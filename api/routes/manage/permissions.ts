import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// 역할을 부여/해제하는 API의 body 스키마
const manageRoleSchema = z.object({
    role_name: z.string().min(1, "역할 이름은 필수입니다."), // 예: '부원장'
    action: z.enum(['grant', 'revoke']) // '부여' 또는 '해제'
});

const permissionRoutes = new Hono<AppEnv>();

/**
 * [POST] /:memberId/role - 특정 멤버에게 역할을 부여하거나 해제합니다.
 * 예: 강사 멤버에게 '부원장' 역할 부여
 *
 * 이 API는 학원의 소유주(principal)만 호출할 수 있습니다.
 */
permissionRoutes.post('/:memberId/role', zValidator('json', manageRoleSchema), async (c) => {
    const user = c.get('user')!; // API를 호출한 사용자 (원장)
    const memberId = c.req.param('memberId'); // 역할을 부여받을 대상 멤버
    const { role_name, action } = c.req.valid('json');

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // 1. 역할을 부여/해제할 대상 멤버 정보 조회
        const member = await db.query.academyMembersTable.findFirst({
            where: eq(schema.academyMembersTable.id, memberId),
            columns: { academy_id: true, profile_id: true }
        });

        if (!member) {
            return c.json({ error: '대상 구성원을 찾을 수 없습니다.' }, 404);
        }
        if (!member.profile_id) {
            // 계정과 연결되지 않은 멤버(1차 등록만 된 상태)에게는 역할을 부여할 수 없음
            return c.json({ error: '계정과 연결되지 않은 구성원에게는 역할을 부여할 수 없습니다.' }, 400);
        }

        // 2. API 호출자가 대상 멤버가 소속된 학원의 '소유주(원장)'인지 확인 (가장 강력한 권한 체크)
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, member.academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });
        if (!academy) {
            return c.json({ error: '역할을 관리할 권한이 없습니다. 학원 소유주만 가능합니다.' }, 403);
        }

        // 3. 부여/해제 하려는 역할이 DB에 존재하는지 확인
        const targetRole = await db.query.rolesTable.findFirst({
            where: eq(schema.rolesTable.name, role_name)
        });
        if (!targetRole) {
            return c.json({ error: `'${role_name}' 역할을 찾을 수 없습니다. DB 시딩 데이터를 확인해주세요.` }, 404);
        }

        // 4. 요청된 action에 따라 역할 부여 또는 해제 실행
        if (action === 'grant') {
            await db.insert(schema.userRolesTable)
                .values({ user_id: member.profile_id, role_id: targetRole.id })
                .onConflictDoNothing(); // 이미 역할이 있으면 아무 작업도 하지 않음
            
            return c.json({ message: `'${role_name}' 역할이 성공적으로 부여되었습니다.` }, 200);

        } else { // action === 'revoke'
            await db.delete(schema.userRolesTable)
                .where(and(
                    eq(schema.userRolesTable.user_id, member.profile_id),
                    eq(schema.userRolesTable.role_id, targetRole.id)
                ));

            return c.json({ message: `'${role_name}' 역할이 성공적으로 해제되었습니다.` }, 200);
        }

    } catch (error: any) {
        console.error('Failed to manage role for member:', error.message);
        return c.json({ error: '역할 관리 중 데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default permissionRoutes;