import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm'; // and 추가
import { z } from 'zod'; // z, zValidator 추가
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// [신규] 학원 생성을 위한 Zod 스키마
const createAcademySchema = z.object({
    name: z.string().min(1, "학원 이름은 필수입니다.").max(100),
    region: z.string().min(1, "지역 정보는 필수입니다."),
});

const academyRoutes = new Hono<AppEnv>();

/**
 * GET /my - 로그인한 원장이 소유한 학원 목록을 조회합니다.
 */
academyRoutes.get('/my', async (c) => {
    const user = c.get('user');
    if (!user || !user.id) return c.json({ error: '인증 정보가 필요합니다.' }, 401);

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

/**
 * [신규] POST / - 로그인한 사용자를 원장으로 하는 새 학원을 생성합니다.
 */
academyRoutes.post('/', zValidator('json', createAcademySchema), async (c) => {
    const user = c.get('user');
    const { name, region } = c.req.valid('json');

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // 사용자가 '원장' 역할을 가지고 있는지 확인 (선택적이지만 좋은 검증)
        const userRoles = await db.query.userRolesTable.findMany({
            where: eq(schema.userRolesTable.user_id, user.id),
            with: { role: { columns: { name: true } } }
        });
        const isPrincipal = userRoles.some(ur => ur.role.name === '원장');
        if (!isPrincipal) {
            return c.json({ error: "'원장' 역할이 있어야 학원을 생성할 수 있습니다." }, 403);
        }

        const [newAcademy] = await db.insert(schema.academiesTable)
            .values({
                name,
                region,
                principal_id: user.id,
                status: '운영중'
            })
            .returning();
        
        return c.json(newAcademy, 201);

    } catch (error: any) {
        console.error('Failed to create academy:', error.message);
        return c.json({ error: '학원 생성 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default academyRoutes;