// ./api/routes/manage/teacher.ts 전문

import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { hasAcademyAdminPermission } from '../middleware/permission'; // [수정] 새로운 권한 함수 import

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


const staffDetailsSchema = z.object({
    student_name: z.string().min(1, "이름은 필수입니다."),
    student_phone: z.string().optional().transform(v => v || undefined),
    subject: z.string().optional().transform(v => v || undefined),
    class_name: z.string().optional().transform(v => v || undefined),
});

const createStaffSchema = z.object({
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
    member_type: z.enum(['teacher', 'staff']), 
    details: staffDetailsSchema,
    profile_id: z.string().uuid().optional().nullable(),
});

const updateStaffSchema = z.object({
    status: z.enum(schema.memberStatusEnum.enumValues).optional(),
    details: staffDetailsSchema.partial().optional(),
    start_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
    end_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
});


const teacherRoutes = new Hono<AppEnv>();

/**
 * [GET] /:academyId - 특정 학원의 모든 강사 및 직원 목록을 조회합니다.
 */
teacherRoutes.get('/:academyId', async (c) => {
    const user = c.get('user')!;
    const academyId = c.req.param('academyId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // [수정] 새로운 권한 체크 함수 사용
        const hasPermission = await hasAcademyAdminPermission(db, user.id, academyId);
        if (!hasPermission) {
            return c.json({ error: '강사/직원 목록을 조회할 권한이 없습니다.' }, 403);
        }

        const staffMembers = await db.query.academyMembersTable.findMany({
            where: and(
                eq(schema.academyMembersTable.academy_id, academyId),
                inArray(schema.academyMembersTable.member_type, ['teacher', 'staff'])
            ),
            orderBy: desc(schema.academyMembersTable.created_at),
        });
        return c.json(staffMembers);
    } catch (error: any) {
        console.error('Failed to fetch academy staff:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * [POST] / - 새로운 강사 또는 직원을 등록합니다.
 */
teacherRoutes.post('/', zValidator('json', createStaffSchema), async (c) => {
    const user = c.get('user')!;
    const { academy_id, member_type, details, profile_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // [수정] 새로운 권한 체크 함수 사용
        const hasPermission = await hasAcademyAdminPermission(db, user.id, academy_id);
        if (!hasPermission) {
            return c.json({ error: '강사/직원을 등록할 권한이 없습니다.' }, 403);
        }
        
        const [newMember] = await db.insert(schema.academyMembersTable)
            .values({
                academy_id,
                member_type,
                details,
                profile_id,
                status: 'active'
            })
            .returning();
            
        return c.json(newMember, 201);
    } catch (error: any) {
        console.error('Failed to create staff member:', error.message);
        if (error.code === '23505') {
            return c.json({ error: '이미 등록된 구성원 정보와 중복됩니다.' }, 409);
        }
        return c.json({ error: '데이터베이스 오류로 등록에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * [PUT] /:memberId - 특정 강사/직원 정보 업데이트
 */
teacherRoutes.put('/:memberId', zValidator('json', updateStaffSchema), async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const validatedData = c.req.valid('json');

    if (Object.keys(validatedData).length === 0) return c.json({ error: '수정할 내용이 없습니다.' }, 400);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const member = await db.query.academyMembersTable.findFirst({
            where: and(
                eq(schema.academyMembersTable.id, memberId),
                inArray(schema.academyMembersTable.member_type, ['teacher', 'staff'])
            ),
            columns: { academy_id: true, details: true }
        });

        if (!member) {
            return c.json({ error: '수정할 강사/직원 정보를 찾을 수 없습니다.' }, 404);
        }
        
        // [수정] 새로운 권한 체크 함수 사용
        const hasPermission = await hasAcademyAdminPermission(db, user.id, member.academy_id);
        if (!hasPermission) {
            return c.json({ error: '정보를 수정할 권한이 없습니다.' }, 403);
        }
        
        const dataToUpdate: Partial<schema.DbAcademyMember> = { updated_at: new Date() };

        if(validatedData.status) dataToUpdate.status = validatedData.status;
        if(validatedData.start_date) dataToUpdate.start_date = validatedData.start_date;
        if(validatedData.end_date) dataToUpdate.end_date = validatedData.end_date;
        
        if(validatedData.details) {
            const transformedDetails = Object.fromEntries(
                Object.entries(validatedData.details).map(([key, value]) => [key, value === null ? undefined : value])
            );
            dataToUpdate.details = { ...member.details, ...transformedDetails };
        }

        const [updatedMember] = await db.update(schema.academyMembersTable)
            .set(dataToUpdate)
            .where(eq(schema.academyMembersTable.id, memberId))
            .returning();

        return c.json(updatedMember);
    } catch (error: any) {
        console.error(`Failed to update member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류로 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * [DELETE] /:memberId - 강사/직원을 '퇴사' 처리
 */
teacherRoutes.delete('/:memberId', async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const member = await db.query.academyMembersTable.findFirst({
            where: and(
                eq(schema.academyMembersTable.id, memberId),
                inArray(schema.academyMembersTable.member_type, ['teacher', 'staff'])
            ),
            columns: { academy_id: true }
        });

        if (!member) {
            return c.json({ error: '퇴사 처리할 구성원 정보를 찾을 수 없습니다.' }, 404);
        }

        // [수정] 새로운 권한 체크 함수 사용
        const hasPermission = await hasAcademyAdminPermission(db, user.id, member.academy_id);
        if (!hasPermission) {
            return c.json({ error: '퇴사 처리할 권한이 없습니다.' }, 403);
        }

        const today = new Date().toISOString().split('T')[0];
        const [resignedMember] = await db.update(schema.academyMembersTable)
            .set({ status: 'resigned', end_date: today, updated_at: new Date() })
            .where(eq(schema.academyMembersTable.id, memberId))
            .returning({ id: schema.academyMembersTable.id });
            
        return c.json({ message: '퇴사 처리가 완료되었습니다.', id: resignedMember.id });
    } catch (error: any) {
        console.error(`Failed to soft-delete member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default teacherRoutes;