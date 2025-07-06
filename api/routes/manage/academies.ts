import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const academyRoutes = new Hono<AppEnv>();

/**
 * GET /my - 로그인한 원장이 소유한 학원 목록을 조회합니다.
 * Supabase 미들웨어를 통해 인증된 사용자의 ID를 기반으로 동작합니다.
 */
academyRoutes.get('/my', async (c) => {
    const user = c.get('user');

    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const myAcademies = await db.query.academiesTable.findMany({
            where: eq(schema.academiesTable.principal_id, user.id),
            orderBy: (academies, { asc }) => [asc(academies.created_at)],
        });

        return c.json(myAcademies);

    } catch (error: any) {
        console.error('Failed to fetch my academies:', error.message);
        return c.json({ error: '내 학원 목록을 조회하는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default academyRoutes;