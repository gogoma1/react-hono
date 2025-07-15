import { Hono } from 'hono';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { eq, and, desc, inArray, sql, max } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';

import type { AppEnv } from '../../index';
import * as schemaD1 from '../../db/schema.d1';
import * as schemaPg from '../../db/schema.pg';
import * as schemaMarketplace from '../../db/schema.marketplace.d1';

// [수정] 이 파일은 이제 PostgreSQL에 권한을 생성하는 역할만 함
const createEntitlementSchema = z.object({
    problem_set_id: z.string().min(1),
});

const problemSetRoutes = new Hono<AppEnv>();

/**
 * @route   POST /
 * @desc    PostgreSQL에 문제집에 대한 권한(Entitlement) 생성
 * @access  Private
 */
problemSetRoutes.post('/', zValidator('json', createEntitlementSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });
    
    try {
        await dbPg.insert(schemaPg.problemSetEntitlementsTable).values({
            user_id: user.id,
            problem_set_id: body.problem_set_id,
            grant_reason: 'creator'
        });

        return c.json({ success: true, message: '권한이 성공적으로 생성되었습니다.' }, 201);

    } catch (error: any) {
        console.error('Failed to create problem set entitlement in PG:', error);
        return c.json({ error: '문제집 권한 생성 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});

// GET /my, GET /:id 등 다른 라우트는 그대로 유지
// (문제집 조회/수정/삭제는 여전히 필요)

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

        const [ problemSets, listings ] = await Promise.all([
            dbD1.query.problemSetTable.findMany({
                where: and(
                    inArray(schemaD1.problemSetTable.problem_set_id, problemSetIds),
                    sql`${schemaD1.problemSetTable.status} != 'deleted'`
                ),
                orderBy: [desc(schemaD1.problemSetTable.created_at)],
                with: {
                    sources: {
                        with: {
                            source: {
                                columns: { id: true, name: true }
                            }
                        }
                    }
                }
            }),
            dbMarketplace.query.marketplaceListingsTable.findMany({
                where: inArray(schemaMarketplace.marketplaceListingsTable.problem_set_id, problemSetIds)
            })
        ]);

        const marketplaceStatus = new Map(listings.map(item => [item.problem_set_id, item.status]));

        const responseData = problemSets.map(ps => {
            const mappedSources = ps.sources?.map(s => ({
                source_id: s.source?.id || 'unknown',
                name: s.source?.name || 'Unknown Source',
                count: s.count,
            })) || [];

            return {
                ...ps,
                sources: mappedSources,
                marketplace_status: marketplaceStatus.get(ps.problem_set_id) || 'not_listed'
            };
        });

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch my problem sets:', error);
        return c.json({ error: '내 문제집 목록을 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});

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
            where: eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
            with: {
                problemSetProblems: {
                    orderBy: (problemSetProblems, { asc }) => [asc(problemSetProblems.order)],
                    with: { problem: true }
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


export default problemSetRoutes;