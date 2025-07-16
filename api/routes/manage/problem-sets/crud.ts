import { Hono } from 'hono';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { eq, and, asc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schemaD1 from '../../../db/schema.d1';
import * as schemaPg from '../../../db/schema.pg';

const crudRoutes = new Hono<AppEnv>();

const createEntitlementSchema = z.object({
    problem_set_id: z.string().min(1),
});

// [수정] 문제집 수정 스키마에 folder_id 추가
const updateProblemSetSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(schemaD1.problemSetStatusEnum).optional(),
    folder_id: z.string().nullable().optional(), // 폴더 ID (null은 폴더 해제)
});


/**
 * POST / - PostgreSQL에 문제집에 대한 권한(Entitlement)을 생성합니다.
 * 문제집 생성(D1) 후 이어서 호출됩니다.
 */
crudRoutes.post('/', zValidator('json', createEntitlementSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });
    
    try {
        await dbPg.insert(schemaPg.problemSetEntitlementsTable).values({
            user_id: user.id,
            problem_set_id: body.problem_set_id,
            grant_reason: 'creator' // 문제집 생성자는 'creator' 사유로 권한을 가집니다.
        });

        return c.json({ success: true, message: '권한이 성공적으로 생성되었습니다.' }, 201);

    } catch (error: any) {
        console.error('Failed to create problem set entitlement in PG:', error);
        return c.json({ error: '문제집 권한 생성 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});

/**
 * GET /:id - 특정 문제집의 상세 정보를 조회합니다.
 * 문제 목록을 포함하여 반환합니다.
 */
crudRoutes.get('/:id', async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('id');
    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });
    
    try {
        const entitlement = await dbPg.query.problemSetEntitlementsTable.findFirst({
            where: and(
                eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
                eq(schemaPg.problemSetEntitlementsTable.problem_set_id, problemSetId)
            )
        });

        if (!entitlement) {
            return c.json({ error: '이 문제집에 접근할 권한이 없습니다.' }, 403);
        }

        const problemSet = await dbD1.query.problemSetTable.findFirst({
            where: eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
            with: {
                problemSetProblems: {
                    orderBy: (problemSetProblems, { asc }) => [asc(problemSetProblems.order)],
                    with: { problem: true } // 문제의 상세 정보까지 함께 Join
                }
            }
        });
        
        if (!problemSet || problemSet.status === 'deleted') {
            return c.json({ error: '문제집을 찾을 수 없거나 삭제되었습니다.' }, 404);
        }

        return c.json(problemSet);

    } catch (error: any) {
        console.error('Failed to fetch problem set details:', error);
        return c.json({ error: '문제집 상세 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});

/**
 * [수정] PUT /:id - 문제집 정보를 업데이트합니다.
 */
crudRoutes.put(
    '/:id',
    zValidator('json', updateProblemSetSchema),
    async (c) => {
        const user = c.get('user');
        const problemSetId = c.req.param('id');
        const body = c.req.valid('json');
        const db = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });

        try {
            const [updatedProblemSet] = await db.update(schemaD1.problemSetTable)
                .set({
                    ...body,
                    updated_at: new Date().toISOString().replace('T', ' ').split('.')[0]
                })
                .where(and(
                    eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
                    eq(schemaD1.problemSetTable.creator_id, user.id)
                ))
                .returning();
            
            if (!updatedProblemSet) {
                return c.json({ error: "문제집을 찾을 수 없거나 수정 권한이 없습니다." }, 404);
            }

            return c.json(updatedProblemSet);

        } catch (error: any) {
            console.error(`Failed to update problem set ${problemSetId}:`, error);
            return c.json({ error: '문제집 정보 수정에 실패했습니다.' }, 500);
        }
    }
);


/**
 * DELETE /:id - 문제집 및 관련 데이터를 영구적으로 삭제합니다.
 * D1의 문제집, 연결된 문제, 연결된 이미지와 PG의 권한 데이터를 모두 삭제합니다.
 */
crudRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('id');
    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });
    const r2Bucket = c.env.MY_R2_BUCKET;

    if (!r2Bucket) {
        console.error("MY_R2_BUCKET 환경 변수가 설정되지 않았습니다.");
        return c.json({ error: '서버 설정 오류: 이미지 저장소를 찾을 수 없습니다.' }, 500);
    }
    
    try {
        const problemSetInD1 = await dbD1.query.problemSetTable.findFirst({
            where: and(
                eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
                eq(schemaD1.problemSetTable.creator_id, user.id)
            ),
            columns: { problem_set_id: true }
        });

        if (problemSetInD1) {
            const problemsToDelete = await dbD1.select({ problem_id: schemaD1.problemSetProblemsTable.problem_id })
                .from(schemaD1.problemSetProblemsTable)
                .where(eq(schemaD1.problemSetProblemsTable.problem_set_id, problemSetId));

            const problemIdsToDelete = problemsToDelete.map(p => p.problem_id);
            
            if (problemIdsToDelete.length > 0) {
                const imagesToDelete = await dbD1.query.problemImagesTable.findMany({
                    where: inArray(schemaD1.problemImagesTable.problem_id, problemIdsToDelete),
                    columns: { image_key: true }
                });
                const uniqueKeysToDelete = [...new Set(imagesToDelete.map(img => img.image_key))];

                if (uniqueKeysToDelete.length > 0) {
                    await r2Bucket.delete(uniqueKeysToDelete);
                }
                
                // cascade 옵션 덕분에 problemTable만 삭제해도 problemSetProblems, problemImages 등이 함께 삭제됨
                await dbD1.delete(schemaD1.problemTable).where(inArray(schemaD1.problemTable.problem_id, problemIdsToDelete));
            }

            await dbD1.delete(schemaD1.problemSetTable).where(eq(schemaD1.problemSetTable.problem_set_id, problemSetId));
        } else {
             console.warn(`[DELETE /:id] Problem set not found in D1 or no permission. ID: ${problemSetId}, User: ${user.id}`);
        }

        await dbPg.delete(schemaPg.problemSetEntitlementsTable)
            .where(and(
                eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
                eq(schemaPg.problemSetEntitlementsTable.problem_set_id, problemSetId)
            ));
        
        return c.json({ message: '문제집 삭제 요청이 처리되었습니다.' }, 200);

    } catch (error: any) {
        console.error('Failed to delete problem set:', error);
        return c.json({ error: '문제집 삭제 중 오류가 발생했습니다.', details: error.message }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


export default crudRoutes;