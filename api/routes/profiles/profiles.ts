import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// [수정됨] camelCase -> snake_case
const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  phone: z.string().optional(),
  role_name: z.enum(['원장', '학생', '강사', '학부모', '과외 선생님']), 
  academy_name: z.string().optional(),
  region: z.string().optional(),
}).refine(data => {
    if (data.role_name === '원장') {
        return !!data.academy_name && !!data.region;
    }
    return true;
}, {
    message: "원장으로 가입 시 학원 이름과 지역은 필수입니다.",
    path: ["academy_name", "region"],
});

const profileRoutes = new Hono<AppEnv>();

profileRoutes.get('/academies', async (c) => {
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academies = await db.select({
            id: schema.academiesTable.id,
            name: schema.academiesTable.name,
            region: schema.academiesTable.region,
        })
        .from(schema.academiesTable)
        .orderBy(schema.academiesTable.name);
        
        return c.json(academies);

    } catch (error: any) {
        console.error('Failed to fetch academies:', error.message);
        return c.json({ error: '학원 목록 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

profileRoutes.get('/exists', async (c) => {
    const user = c.get('user');
  
    if (!user?.id) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
  
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
  
    try {
      const profile = await db.query.profilesTable.findFirst({
        where: eq(schema.profilesTable.id, user.id),
        columns: { id: true },
      });
      return c.json({ success: true, exists: !!profile });
    } catch (error: any) {
      console.error('Failed to check profile existence:', error.message);
      return c.json({ success: false, error: 'Database query failed' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
});
  
profileRoutes.post(
    '/setup',
    zValidator('json', profileSetupSchema),
    async (c) => {
        const user = c.get('user');
        const { name, phone, role_name, academy_name, region } = c.req.valid('json'); // [수정됨]

        if (!user?.id || !user?.email) {
            return c.json({ error: '인증이 필요합니다.' }, 401);
        }
        
        const sql = postgres(c.env.HYPERDRIVE.connectionString);
        const db = drizzle(sql, { schema });

        try {
            const result = await db.transaction(async (tx) => {
                const existingProfile = await tx.query.profilesTable.findFirst({
                    where: eq(schema.profilesTable.id, user.id)
                });

                if (existingProfile) {
                    throw new Error('Profile for this user already exists.');
                }
                
                const [newProfile] = await tx.insert(schema.profilesTable).values({
                    id: user.id,
                    email: user.email!,
                    name: name,
                    phone: phone,
                }).returning();

                const role = await tx.query.rolesTable.findFirst({
                    where: eq(schema.rolesTable.name, role_name) // [수정됨]
                });

                if (!role) {
                    throw new Error(`'${role_name}' 역할을 찾을 수 없습니다. DB에 역할이 미리 등록되어 있어야 합니다.`); // [수정됨]
                }

                await tx.insert(schema.userRolesTable).values({
                    user_id: newProfile.id,
                    role_id: role.id,
                });

                if (role_name === '원장') { // [수정됨]
                    if (!academy_name || !region) { // [수정됨]
                         throw new Error('원장은 학원 이름과 지역 정보가 필수입니다.');
                    }
                    await tx.insert(schema.academiesTable).values({
                        name: academy_name, // [수정됨]
                        region: region,
                        principal_id: newProfile.id,
                    });
                }
                
                return { profileId: newProfile.id };
            });

            return c.json({ success: true, ...result }, 201);

        } catch (error: any) {
            console.error('Failed to create profile:', error.message);
            if (error.message.includes('already exists')) {
                return c.json({ error: '이미 존재하는 프로필입니다.' }, 409);
            }
            return c.json({ error: '프로필 생성 중 데이터베이스 오류가 발생했습니다.', details: error.message }, 500);
        } finally {
            c.executionCtx.waitUntil(sql.end());
        }
    }
);

export default profileRoutes;