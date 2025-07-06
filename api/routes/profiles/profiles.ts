import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  phone: z.string().optional(),
  role_name: z.enum(['원장', '학생', '강사', '학부모', '과외 선생님']), 
  academy_name: z.string().optional(),
  region: z.string().optional(),
  academy_id: z.string().uuid().optional(),
}).refine(data => {
    if (data.role_name === '원장') {
        return !!data.academy_name && !!data.region;
    }
    if (['강사', '학생', '학부모'].includes(data.role_name)) {
        return !!data.academy_id;
    }
    return true;
}, {
    message: "원장은 학원/지역, 그 외 학원 소속원은 학원 ID가 필수입니다.",
    path: ["academy_name", "region", "academy_id"],
});

const profileRoutes = new Hono<AppEnv>();

profileRoutes.get('/academies', async (c) => {
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academies = await db.query.academiesTable.findMany({
            where: eq(schema.academiesTable.status, '운영중'),
            orderBy: (academies, { asc }) => [asc(academies.name)],
        });
        
        const result = academies.map(a => ({
            id: a.id,
            name: a.name,
            region: a.region,
            status: a.status,
        }));
        
        return c.json(result);

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
        const { name, phone, role_name, academy_name, region, academy_id } = c.req.valid('json');

        if (!user?.id || !user?.email) {
            return c.json({ error: '인증이 필요합니다.' }, 401);
        }
        
        const sql = postgres(c.env.HYPERDRIVE.connectionString);
        const db = drizzle(sql, { schema });

        // [핵심] API가 받은 전화번호를 DB와 비교하기 전에 항상 정제(sanitize)합니다.
        const sanitizedPhone = phone ? phone.replace(/-/g, '') : undefined;

        try {
            const result = await db.transaction(async (tx) => {
                const existingProfile = await tx.query.profilesTable.findFirst({
                    where: eq(schema.profilesTable.id, user.id)
                });

                if (existingProfile) {
                    throw new Error('Profile for this user already exists.');
                }
                
                let enrollmentRecord: schema.DbEnrollment | undefined;
                if (['학생', '강사', '학부모'].includes(role_name)) {
                    if (!academy_id || !sanitizedPhone) {
                        throw new Error("학원 소속원은 학원 ID와 전화번호가 모두 필요합니다.");
                    }

                    enrollmentRecord = await tx.query.enrollmentsTable.findFirst({
                        where: and(
                            eq(schema.enrollmentsTable.academy_id, academy_id),
                            eq(schema.enrollmentsTable.student_phone, sanitizedPhone)
                        )
                    });

                    if (!enrollmentRecord) {
                        // 이 에러는 catch 블록에서 잡아서 404로 변환됩니다.
                        throw new Error('Enrollment not found'); 
                    }
                }
                
                const [newProfile] = await tx.insert(schema.profilesTable).values({
                    id: user.id,
                    email: user.email!,
                    name: name,
                    phone: sanitizedPhone, // DB에는 정제된 번호를 저장합니다.
                }).returning();

                const role = await tx.query.rolesTable.findFirst({
                    where: eq(schema.rolesTable.name, role_name)
                });

                if (!role) {
                    throw new Error(`'${role_name}' 역할을 찾을 수 없습니다.`);
                }

                await tx.insert(schema.userRolesTable).values({
                    user_id: newProfile.id,
                    role_id: role.id,
                });

                if (role_name === '원장') {
                    if (!academy_name || !region) {
                         throw new Error('원장은 학원 이름과 지역 정보가 필수입니다.');
                    }
                    await tx.insert(schema.academiesTable).values({
                        name: academy_name,
                        region: region,
                        principal_id: newProfile.id,
                        status: '운영중',
                    });
                }
                
                if (['학생', '강사', '학부모'].includes(role_name) && enrollmentRecord) {
                    await tx.update(schema.enrollmentsTable)
                        .set({
                            student_profile_id: newProfile.id,
                            updated_at: new Date()
                        })
                        .where(eq(schema.enrollmentsTable.id, enrollmentRecord.id));
                }
                
                return { profileId: newProfile.id };
            });

            return c.json({ success: true, ...result }, 201);

        } catch (error: any) {
            console.error('Failed to create profile:', error.message);

            if (error.message === 'Enrollment not found') {
                return c.json({ error: 'Enrollment not found' }, 404);
            }
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