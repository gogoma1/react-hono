import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, sql, count, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { createClient } from '@supabase/supabase-js';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const STAFF_GROUP = ['원장', '강사'];
const MEMBER_GROUP = ['학생', '학부모'];

function validateRoleAddition(existingRoles: Set<string>, roleNameToAdd: string): void {
    if (existingRoles.has(roleNameToAdd)) {
        throw new Error(`이미 해당 학원의 '${roleNameToAdd}'입니다.`);
    }
    const isAddingStaff = STAFF_GROUP.includes(roleNameToAdd);
    const isAddingMember = MEMBER_GROUP.includes(roleNameToAdd);
    const userHasStaffRole = [...existingRoles].some(r => STAFF_GROUP.includes(r));
    const userHasMemberRole = [...existingRoles].some(r => MEMBER_GROUP.includes(r));
    if (isAddingStaff && userHasMemberRole) {
        throw new Error("이미 해당 학원의 소속원(학생/학부모)이므로 관리자(강사) 역할을 추가할 수 없습니다.");
    }
    if (isAddingMember && userHasStaffRole) {
        throw new Error("이미 해당 학원의 관리자(원장/강사)이므로 소속원(학생/학부모) 역할을 추가할 수 없습니다.");
    }
    if (roleNameToAdd === '학생' && existingRoles.has('학부모')) {
         throw new Error("이미 해당 학원의 '학부모' 역할이 있어 '학생' 역할을 추가할 수 없습니다.");
    }
    if (roleNameToAdd === '학부모' && existingRoles.has('학생')) {
         throw new Error("이미 해당 학원의 '학생' 역할이 있어 '학부모' 역할을 추가할 수 없습니다.");
    }
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100).optional(),
  phone: z.string().min(10, "유효한 전화번호를 입력해주세요.").optional(),
});

const addRoleSchema = z.object({
    role_name: z.enum(schema.rolesTable.name.enumValues),
    academy_name: z.string().optional(),
    region: z.string().optional(),
    academy_id: z.string().uuid().optional(),
}).refine(data => {
    if (data.role_name === '원장') return !!data.academy_name && !!data.region;
    if (['강사', '학생', '학부모'].includes(data.role_name)) return !!data.academy_id;
    return true;
}, {
    message: "역할에 따라 학원 정보 또는 학원 ID가 필요합니다.",
    path: ["academy_name", "region", "academy_id"],
});

const settingsRoutes = new Hono<AppEnv>();

settingsRoutes.get('/me', async (c) => {
    const user = c.get('user');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const profileData = await db.query.profilesTable.findFirst({
            where: and(eq(schema.profilesTable.id, user.id), eq(schema.profilesTable.status, 'active')),
            with: { 
                userRoles: { with: { role: true } },
                ownedAcademies: { columns: { id: true, name: true, region: true } },
                // [핵심 수정] Drizzle 관계를 이용해 멤버십 정보를 한번에 가져옴
                academyMemberships: { with: { academy: { columns: { id: true, name: true, region: true } } } }
            }
        });
        if (!profileData) return c.json({ error: '활성화된 프로필을 찾을 수 없습니다.' }, 404);
        
        // [핵심 수정] 가져온 데이터를 기반으로 역할과 소속을 매핑
        const rolesWithAffiliation = profileData.userRoles.map(userRole => {
            const roleInfo: { id: string; name: string; academyId?: string; academyName?: string; region?: string; } = {
                id: userRole.role.id, name: userRole.role.name,
            };

            if (userRole.role.name === '원장') {
                // 원장은 여러 학원을 소유할 수 있으므로, 일단 첫 번째 학원 정보를 대표로 표시
                const mainOwnedAcademy = profileData.ownedAcademies[0];
                if (mainOwnedAcademy) {
                    roleInfo.academyId = mainOwnedAcademy.id;
                    roleInfo.academyName = mainOwnedAcademy.name;
                    roleInfo.region = mainOwnedAcademy.region;
                }
            } else {
                // 강사, 학생, 학부모의 경우, member_type이 역할 이름과 일치하는 소속 정보를 찾음
                const memberType = userRole.role.name === '강사' ? 'teacher' : (userRole.role.name === '학생' ? 'student' : 'parent');
                const membership = profileData.academyMemberships.find(m => m.member_type === memberType);
                if (membership) {
                    roleInfo.academyId = membership.academy.id;
                    roleInfo.academyName = membership.academy.name;
                    roleInfo.region = membership.academy.region;
                }
            }
            return roleInfo;
        });
        
        const responseData = {
            id: profileData.id, email: profileData.email, name: profileData.name,
            phone: profileData.phone, status: profileData.status, roles: rolesWithAffiliation,
            ownedAcademies: profileData.ownedAcademies, 
        };
        return c.json(responseData);
    } catch (e: any) {
        console.error('Error fetching my profile:', e.message);
        return c.json({ error: '프로필 정보를 조회하는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

settingsRoutes.post(
    '/me/roles',
    zValidator('json', addRoleSchema),
    async (c) => {
        const user = c.get('user');
        const { role_name, academy_id } = c.req.valid('json');
        
        if (!user?.id || !user?.email) return c.json({ error: '인증이 필요합니다.' }, 401);

        const sql = postgres(c.env.HYPERDRIVE.connectionString);
        const db = drizzle(sql, { schema });

        try {
            await db.transaction(async (tx) => {
                const roleToAdd = await tx.query.rolesTable.findFirst({ where: eq(schema.rolesTable.name, role_name) });
                if (!roleToAdd) throw new Error(`'${role_name}' 역할을 찾을 수 없습니다.`);

                if (role_name === '원장') throw new Error("새로운 학원 개설은 '학원 추가' 기능을 이용해주세요.");

                if (academy_id) {
                    const existingRolesInAcademy = new Set<string>();
                    const isPrincipal = await tx.query.academiesTable.findFirst({ where: and(eq(schema.academiesTable.id, academy_id), eq(schema.academiesTable.principal_id, user.id)) });
                    if (isPrincipal) existingRolesInAcademy.add('원장');

                    const memberships = await tx.query.academyMembersTable.findMany({
                        where: and( eq(schema.academyMembersTable.academy_id, academy_id), eq(schema.academyMembersTable.profile_id, user.id))
                    });
                    
                    if (memberships.length > 0) {
                        const memberRoles = new Set(memberships.map(m => m.member_type));
                        if(memberRoles.has('student')) existingRolesInAcademy.add('학생');
                        if(memberRoles.has('parent')) existingRolesInAcademy.add('학부모');
                        if(memberRoles.has('teacher')) existingRolesInAcademy.add('강사');
                    }

                    validateRoleAddition(existingRolesInAcademy, role_name);
                    
                    await tx.insert(schema.userRolesTable).values({ user_id: user.id, role_id: roleToAdd.id });

                    const memberType = role_name === '강사' ? 'teacher' : (role_name === '학생' ? 'student' : 'parent');
                    const hasMembership = memberships.some(m => m.member_type === memberType);

                    if (!hasMembership) {
                        const profile = await tx.query.profilesTable.findFirst({where: eq(schema.profilesTable.id, user.id)});
                        
                        await tx.insert(schema.academyMembersTable).values({
                            academy_id: academy_id, profile_id: user.id, member_type: memberType, status: 'active',
                            details: { student_name: profile!.name, student_phone: profile!.phone || undefined }
                        });
                    }
                } else { // 과외 선생님 등 학원 소속이 아닌 역할
                    const existingUserRoles = await tx.query.userRolesTable.findMany({ where: eq(schema.userRolesTable.user_id, user.id), with: { role: true } });
                    const hasRole = existingUserRoles.some(ur => ur.role.id === roleToAdd.id);
                    if (hasRole) throw new Error(`이미 '${role_name}' 역할을 가지고 있습니다.`);
                    await tx.insert(schema.userRolesTable).values({ user_id: user.id, role_id: roleToAdd.id });
                }
            });
            return c.json({ message: "역할이 성공적으로 추가되었습니다." }, 201);
        } catch (error: any) {
            console.error('Failed to add role:', error.message);
            return c.json({ error: error.message }, 409);
        } finally {
            c.executionCtx.waitUntil(sql.end());
        }
    }
);

settingsRoutes.delete('/me/roles/:roleId', async (c) => {
    const user = c.get('user');
    const roleId = c.req.param('roleId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        await db.transaction(async (tx) => {
            const [roleCountResult] = await tx.select({ value: count() }).from(schema.userRolesTable).where(eq(schema.userRolesTable.user_id, user.id));
            if (roleCountResult.value <= 1) { c.status(400); throw new Error('마지막 역할은 삭제할 수 없습니다.'); }
            
            const [roleToDelete] = await tx.select({ name: schema.rolesTable.name }).from(schema.rolesTable).where(eq(schema.rolesTable.id, roleId));
            if (roleToDelete?.name === '원장') {
                const [ownedAcademy] = await tx.select({ id: schema.academiesTable.id }).from(schema.academiesTable).where(and(eq(schema.academiesTable.principal_id, user.id), eq(schema.academiesTable.status, '운영중')));
                if (ownedAcademy) { c.status(400); throw new Error('운영 중인 학원의 원장 역할은 삭제할 수 없습니다. 먼저 학원을 폐업 또는 양도하세요.'); }
            }
            
            const [deleted] = await tx.delete(schema.userRolesTable).where(and(eq(schema.userRolesTable.user_id, user.id), eq(schema.userRolesTable.role_id, roleId))).returning({ userId: schema.userRolesTable.user_id });
            if (!deleted) { c.status(404); throw new Error('삭제할 역할을 찾을 수 없거나 권한이 없습니다.'); }
        });
        return c.json({ message: '역할이 성공적으로 삭제되었습니다.' });
    } catch (e: any) {
        console.error('Error deleting user role:', e.message);
        if (c.res.status === 400 || c.res.status === 404) return c.json({ error: e.message }, c.res.status);
        return c.json({ error: '역할 삭제 중 서버 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

settingsRoutes.put('/me', zValidator('json', updateProfileSchema), async (c) => {
    const user = c.get('user');
    const validatedData = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    
    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const [updatedProfile] = await db.transaction(async (tx) => {
            const [updated] = await tx.update(schema.profilesTable)
                .set({ ...validatedData, updated_at: new Date() })
                .where(eq(schema.profilesTable.id, user.id))
                .returning();

            if (!updated) { await tx.rollback(); return []; }

            if (validatedData.phone) {
                const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                    user.id, { phone: validatedData.phone }
                );
                if (authError) throw new Error(`Supabase 인증 정보 업데이트 실패: ${authError.message}`);
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

settingsRoutes.patch('/me/deactivate', async (c) => {
    const user = c.get('user');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        await db.transaction(async (tx) => {
            const userRoles = await tx.query.userRolesTable.findMany({
                where: eq(schema.userRolesTable.user_id, user.id),
                with: { role: { columns: { name: true } } }
            });
            const isPrincipal = userRoles.some(ur => ur.role.name === '원장');

            if (isPrincipal) {
                await tx.update(schema.academiesTable)
                    .set({ status: '폐업', updated_at: new Date() })
                    .where(eq(schema.academiesTable.principal_id, user.id));
            }

            await tx.update(schema.profilesTable)
                .set({ status: 'deleted', deleted_at: new Date() })
                .where(eq(schema.profilesTable.id, user.id));

            const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id, { ban_duration: 'none' }
            );
            if (banError) throw new Error(`Supabase 사용자 비활성화 실패: ${banError.message}`);
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