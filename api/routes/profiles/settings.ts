// ./api/routes/profiles/settings.ts (최종 완성본)

import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { createClient } from '@supabase/supabase-js';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// Zod 스키마 정의
const updateProfileSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100).optional(),
  phone: z.string().min(10, "유효한 전화번호를 입력해주세요.").optional(),
});

// Hono 라우터 생성
const settingsRoutes = new Hono<AppEnv>();

/**
 * GET /me - 현재 로그인한 사용자의 상세 프로필 조회
 */
settingsRoutes.get('/me', async (c) => {
    const user = c.get('user');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const profileData = await db.query.profilesTable.findFirst({
            where: and(
                eq(schema.profilesTable.id, user.id),
                eq(schema.profilesTable.status, 'active')
            ),
            with: {
                userRoles: {
                    with: { role: { columns: { name: true } } }
                },
                ownedAcademies: {
                    columns: { name: true, region: true },
                    where: eq(schema.academiesTable.status, '운영중')
                }
            }
        });

        if (!profileData) {
            return c.json({ error: '활성화된 프로필을 찾을 수 없습니다.' }, 404);
        }

        // 프론트에서 사용하기 좋은 형태로 데이터 가공 (DTO)
        const responseData = {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            phone: profileData.phone,
            status: profileData.status,
            roles: profileData.userRoles.map(ur => {
                const isPrincipalRole = ur.role.name === '원장';
                // 원장 역할이고, 소유한 학원이 있는 경우에만 학원 정보 추가
                if (isPrincipalRole && profileData.ownedAcademies.length > 0) {
                    return {
                        name: ur.role.name,
                        academy_name: profileData.ownedAcademies[0].name,
                        region: profileData.ownedAcademies[0].region,
                    };
                }
                // 다른 역할이나, 원장이지만 학원 정보가 없는 경우
                return { name: ur.role.name };
            })
        };

        return c.json(responseData);

    } catch (e: any) {
        console.error('Error fetching my profile:', e.message);
        return c.json({ error: '프로필 정보를 조회하는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * PUT /me - 사용자 프로필(이름, 전화번호) 업데이트 (DB와 Supabase Auth 동시 처리)
 */
settingsRoutes.put('/me', zValidator('json', updateProfileSchema), async (c) => {
    const user = c.get('user');
    const validatedData = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    
    // Admin 클라이언트는 백엔드 환경변수를 사용하여 안전하게 생성
    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const [updatedProfile] = await db.transaction(async (tx) => {
            // 1. 우리 DB의 profiles 테이블 업데이트
            const [updated] = await tx.update(schema.profilesTable)
                .set({ ...validatedData, updated_at: new Date() })
                .where(eq(schema.profilesTable.id, user.id))
                .returning();

            if (!updated) {
                // 트랜잭션을 롤백하고 빈 배열을 반환하여 이후 로직 중단
                await tx.rollback();
                return [];
            }

            // 2. Supabase Auth의 사용자 정보 업데이트 (전화번호가 있을 경우)
            if (validatedData.phone) {
                const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                    user.id,
                    { phone: validatedData.phone }
                );
                if (authError) {
                    throw new Error(`Supabase 인증 정보 업데이트 실패: ${authError.message}`);
                }
            }
            return [updated];
        });

        if (!updatedProfile) {
             return c.json({ error: '프로필을 찾을 수 없거나 업데이트에 실패했습니다.' }, 404);
        }

        return c.json(updatedProfile);

    } catch (e: any) {
        console.error('Error updating my profile:', e.message);
        return c.json({ error: '프로필 업데이트 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * PATCH /me/deactivate - 계정 비활성화 (DB 상태 변경 및 Supabase Auth 비활성화 동시 처리)
 */
settingsRoutes.patch('/me/deactivate', async (c) => {
    const user = c.get('user');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    // Admin 클라이언트는 백엔드 환경변수를 사용하여 안전하게 생성
    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        await db.transaction(async (tx) => {
            // 1. 사용자 역할 조회
            const userRoles = await tx.query.userRolesTable.findMany({
                where: eq(schema.userRolesTable.user_id, user.id),
                with: { role: { columns: { name: true } } }
            });
            const isPrincipal = userRoles.some(ur => ur.role.name === '원장');

            // 2. '원장'일 경우, 소유 학원 '폐업' 처리
            if (isPrincipal) {
                await tx.update(schema.academiesTable)
                    .set({ status: '폐업', updated_at: new Date() })
                    .where(eq(schema.academiesTable.principal_id, user.id));
            }

            // 3. 우리 DB의 profiles 테이블 상태 변경
            await tx.update(schema.profilesTable)
                .set({ status: 'deleted', deleted_at: new Date() })
                .where(eq(schema.profilesTable.id, user.id));

            // 4. Supabase Auth 사용자 비활성화(ban)
            const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { ban_duration: 'none' } // 영구 정지를 의미
            );
            if (banError) {
                throw new Error(`Supabase 사용자 비활성화 실패: ${banError.message}`);
            }
        });

        return c.json({ message: '계정이 성공적으로 비활성화되었습니다.' });

    } catch (e: any) {
        console.error('Error deactivating account:', e.message);
        return c.json({ error: '계정 비활성화 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


export default settingsRoutes;