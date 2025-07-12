import { Hono } from 'hono';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, inArray, sql, max } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../index';
import * as schemaD1 from '../../db/schema.d1';
import * as schemaPg from '../../db/schema.pg';
import * as schemaMarketplace from '../../db/schema.marketplace.d1';

// [수정] Zod 스키마 정의 방식 변경
// 1. 공통 필드를 가진 기본 스키마를 먼저 정의합니다.
const baseProblemSetSchema = z.object({
    name: z.string().min(1, "문제집 이름은 필수입니다.").max(100),
    description: z.string().optional(),
    copyright_type: z.enum(schemaD1.copyrightTypeEnum).default('ORIGINAL_CREATION'),
    copyright_source: z.string().optional(),
});

// 2. 생성용 스키마는 기본 스키마에 .refine()을 적용합니다.
const createProblemSetSchema = baseProblemSetSchema.refine(data => {
    return data.copyright_type !== 'COPYRIGHTED_MATERIAL' || (!!data.copyright_source && data.copyright_source.length > 0);
}, {
    message: "저작권이 있는 자료의 경우 출처를 반드시 입력해야 합니다.",
    path: ["copyright_source"],
});

// 3. 수정용 스키마는 기본 스키마에 .partial()을 적용합니다.
const updateProblemSetSchema = baseProblemSetSchema.partial();

const addProblemsSchema = z.object({
    problem_ids: z.array(z.string().uuid()).min(1, '하나 이상의 문제를 추가해야 합니다.'),
});


const problemSetRoutes = new Hono<AppEnv>();

/**
 * @route   POST /
 * @desc    새로운 문제집 생성 (분산 트랜잭션)
 * @access  Private (Authenticated User)
 */
problemSetRoutes.post('/', zValidator('json', createProblemSetSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });

    let newProblemSetId: string | null = null;

    try {
        const newSet = {
            problem_set_id: `pset_${crypto.randomUUID()}`,
            creator_id: user.id,
            name: body.name,
            description: body.description,
            copyright_type: body.copyright_type,
            copyright_source: body.copyright_source,
            type: 'PRIVATE_USER' as const,
            status: 'private' as const,
        };
        await dbD1.insert(schemaD1.problemSetTable).values(newSet);
        newProblemSetId = newSet.problem_set_id;
        
        await dbPg.insert(schemaPg.problemSetEntitlementsTable).values({
            user_id: user.id,
            problem_set_id: newProblemSetId,
            grant_reason: 'creator'
        });

        const [createdProblemSet] = await dbD1.select().from(schemaD1.problemSetTable).where(eq(schemaD1.problemSetTable.problem_set_id, newProblemSetId));

        return c.json(createdProblemSet, 201);

    } catch (error: any) {
        console.error('Failed to create problem set in distributed transaction:', error);

        if (newProblemSetId) {
            console.warn(`Executing compensation transaction: Deleting problem set ${newProblemSetId} from D1.`);
            await dbD1.delete(schemaD1.problemSetTable).where(eq(schemaD1.problemSetTable.problem_set_id, newProblemSetId));
        }

        return c.json({ error: '문제집 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


/**
 * @route   GET /my
 * @desc    내가 생성하거나 접근 권한이 있는 모든 문제집 목록 조회
 * @access  Private
 */
problemSetRoutes.get('/my', async (c) => {
    const user = c.get('user');
    
    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const dbMarketplace = drizzleD1(c.env.D1_DATABASE_MARKET, { schema: schemaMarketplace });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });
    
    try {
        const entitlements = await dbPg.query.problemSetEntitlementsTable.findMany({
            where: eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
            columns: { problem_set_id: true }
        });
        
        if (entitlements.length === 0) return c.json([]);
        const problemSetIds = entitlements.map(e => e.problem_set_id);

        const [ problemSets, problemCountsResult, listings ] = await Promise.all([
            dbD1.query.problemSetTable.findMany({
                where: and(
                    inArray(schemaD1.problemSetTable.problem_set_id, problemSetIds),
                    eq(schemaD1.problemSetTable.status, 'private')
                ),
                orderBy: [desc(schemaD1.problemSetTable.created_at)]
            }),
            dbD1.select({ 
                problem_set_id: schemaD1.problemSetProblemsTable.problem_set_id, 
                count: sql<number>`count(*)` 
            })
            .from(schemaD1.problemSetProblemsTable)
            .where(inArray(schemaD1.problemSetProblemsTable.problem_set_id, problemSetIds))
            .groupBy(schemaD1.problemSetProblemsTable.problem_set_id),
            dbMarketplace.query.marketplaceListingsTable.findMany({
                where: inArray(schemaMarketplace.marketplaceListingsTable.problem_set_id, problemSetIds)
            })
        ]);

        const problemCounts = new Map(problemCountsResult.map(item => [item.problem_set_id, item.count]));
        const marketplaceStatus = new Map(listings.map(item => [item.problem_set_id, item.status]));

        const responseData = problemSets.map(ps => ({
            ...ps,
            problem_count: problemCounts.get(ps.problem_set_id) || 0,
            marketplace_status: marketplaceStatus.get(ps.problem_set_id) || 'not_listed'
        }));

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch my problem sets:', error);
        return c.json({ error: '내 문제집 목록을 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


/**
 * @route   GET /:id
 * @desc    특정 문제집의 상세 정보 조회 (문제 목록 포함)
 * @access  Private (Entitled User)
 */
problemSetRoutes.get('/:id', async (c) => {
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
        if (!entitlement) return c.json({ error: '이 문제집에 접근할 권한이 없습니다.' }, 403);

        const problemSet = await dbD1.query.problemSetTable.findFirst({
            where: and(
                eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
                eq(schemaD1.problemSetTable.status, 'private')
            ),
            with: {
                problemSetProblems: {
                    orderBy: (problemSetProblems, { asc }) => [asc(problemSetProblems.order)],
                    with: { problem: true }
                }
            }
        });
        
        if (!problemSet) return c.json({ error: '문제집을 찾을 수 없거나 삭제되었습니다.' }, 404);

        return c.json(problemSet);

    } catch (error: any) {
        console.error('Failed to fetch problem set details:', error);
        return c.json({ error: '문제집 상세 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


/**
 * @route   PUT /:id
 * @desc    문제집 정보 수정
 * @access  Private (Creator Only)
 */
problemSetRoutes.put('/:id', zValidator('json', updateProblemSetSchema), async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('id');
    const body = c.req.valid('json');

    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });

    try {
        const entitlement = await dbPg.query.problemSetEntitlementsTable.findFirst({
            where: and(
                eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
                eq(schemaPg.problemSetEntitlementsTable.problem_set_id, problemSetId),
                eq(schemaPg.problemSetEntitlementsTable.grant_reason, 'creator')
            )
        });
        if (!entitlement) return c.json({ error: '문제집을 수정할 권한이 없습니다.' }, 403);

        const [updatedSet] = await dbD1
            .update(schemaD1.problemSetTable)
            .set({ ...body, updated_at: new Date().toISOString().replace(/T|Z/g, ' ').trim() })
            .where(eq(schemaD1.problemSetTable.problem_set_id, problemSetId))
            .returning();
            
        return c.json(updatedSet);

    } catch (error: any) {
        console.error('Failed to update problem set:', error);
        return c.json({ error: '문제집 정보 수정 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


/**
 * @route   POST /:id/problems
 * @desc    기존 문제집에 여러 문제 추가
 * @access  Private (Creator Only)
 */
problemSetRoutes.post('/:id/problems', zValidator('json', addProblemsSchema), async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('id');
    const { problem_ids } = c.req.valid('json');

    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });

    try {
        const entitlement = await dbPg.query.problemSetEntitlementsTable.findFirst({
            where: and(
                eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
                eq(schemaPg.problemSetEntitlementsTable.problem_set_id, problemSetId),
                eq(schemaPg.problemSetEntitlementsTable.grant_reason, 'creator')
            )
        });
        if (!entitlement) return c.json({ error: '문제집에 문제를 추가할 권한이 없습니다.' }, 403);
        
        const [maxOrderResult] = await dbD1.select({ value: max(schemaD1.problemSetProblemsTable.order) })
            .from(schemaD1.problemSetProblemsTable)
            .where(eq(schemaD1.problemSetProblemsTable.problem_set_id, problemSetId));
        
        let currentMaxOrder = maxOrderResult?.value ?? 0;

        const statements: BatchItem<'sqlite'>[] = problem_ids.map(problemId => {
            currentMaxOrder++;
            return dbD1.insert(schemaD1.problemSetProblemsTable).values({
                problem_set_id: problemSetId,
                problem_id: problemId,
                order: currentMaxOrder
            });
        });

        if (statements.length > 0) {
            await dbD1.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }
        
        return c.json({ message: `${problem_ids.length}개의 문제가 성공적으로 추가되었습니다.` }, 201);
    } catch (error: any) {
        console.error('Failed to add problems to set:', error);
        return c.json({ error: '문제 추가 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


/**
 * @route   DELETE /:id
 * @desc    문제집 삭제 (소프트 삭제)
 * @access  Private (Creator Only)
 */
problemSetRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('id');
    
    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const dbMarketplace = drizzleD1(c.env.D1_DATABASE_MARKET, { schema: schemaMarketplace });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });

    try {
        const entitlement = await dbPg.query.problemSetEntitlementsTable.findFirst({
            where: and(
                eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
                eq(schemaPg.problemSetEntitlementsTable.problem_set_id, problemSetId),
                eq(schemaPg.problemSetEntitlementsTable.grant_reason, 'creator')
            )
        });
        if (!entitlement) return c.json({ error: '문제집을 삭제할 권한이 없습니다.' }, 403);

        await dbPg.delete(schemaPg.problemSetEntitlementsTable)
            .where(eq(schemaPg.problemSetEntitlementsTable.problem_set_id, problemSetId));

        await Promise.all([
            dbD1.update(schemaD1.problemSetTable)
                .set({ status: 'deleted' })
                .where(eq(schemaD1.problemSetTable.problem_set_id, problemSetId)),
            dbMarketplace.update(schemaMarketplace.marketplaceListingsTable)
                .set({ status: 'deleted' })
                .where(eq(schemaMarketplace.marketplaceListingsTable.problem_set_id, problemSetId))
                .catch(e => console.warn(`Marketplace listing for ${problemSetId} not found or failed to delete, which is okay.`))
        ]);
        
        // [수정] c.json() 대신 c.body()를 사용하여 204 No Content 응답을 보냅니다.
        return c.body(null, 204);

    } catch (error: any) {
        console.error('Failed to delete problem set:', error);
        return c.json({ error: '문제집 삭제 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


export default problemSetRoutes;