// ./api/routes/manage/student.ts 전문

import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
// [수정] canManageStudent 함수도 import 합니다.
import { hasAcademyAdminPermission, canManageStudent } from '../middleware/permission';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// ... (스키마 정의는 변경 없음) ...
const memberDetailsSchema = z.object({
    student_name: z.string().min(1, "학생 이름은 필수입니다."),
    grade: z.string().min(1, "학년은 필수입니다."),
    subject: z.string().min(1, "과목은 필수입니다."),
    student_phone: z.string().optional().transform(v => v || undefined),
    guardian_phone: z.string().optional().transform(v => v || undefined),
    school_name: z.string().optional().transform(v => v || undefined),
    class_name: z.string().optional().transform(v => v || undefined),
    teacher: z.string().optional().transform(v => v || undefined),
    tuition: z.number().nonnegative().optional(),
});

const createStudentSchema = z.object({
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
    details: memberDetailsSchema,
    profile_id: z.string().uuid().optional().nullable(),
});

const updateMemberSchema = z.object({
    status: z.enum(schema.memberStatusEnum.enumValues).optional(),
    details: memberDetailsSchema.partial().optional(),
    start_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
    end_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
    // [신규] 담당 강사 목록을 업데이트 하기 위한 필드
    manager_member_ids: z.array(z.string().uuid()).optional(),
});

const bulkUpdateStatusSchema = z.object({
    member_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    status: z.enum(schema.memberStatusEnum.enumValues),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
});

const bulkDeleteSchema = z.object({
    member_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
});


const studentRoutes = new Hono<AppEnv>();

// 학생 목록 조회는 학원 관리자만 가능하도록 유지합니다.
studentRoutes.get('/:academyId', async (c) => {
    const user = c.get('user')!;
    const academyId = c.req.param('academyId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const hasPermission = await hasAcademyAdminPermission(db, user.id, academyId);
        if (!hasPermission) {
            return c.json({ error: '학원 학생 목록을 조회할 권한이 없습니다.' }, 403);
        }

        const members = await db.query.academyMembersTable.findMany({
            where: and(
                eq(schema.academyMembersTable.academy_id, academyId),
                eq(schema.academyMembersTable.member_type, 'student')
            ),
            orderBy: desc(schema.academyMembersTable.created_at),
            // [개선] 학생의 담당자 목록도 함께 조회할 수 있습니다.
            with: {
                managerLinks: {
                    with: {
                        manager: {
                            columns: { id: true, details: true }
                        }
                    }
                }
            }
        });
        return c.json(members);
    } catch (error: any) {
        console.error('Failed to fetch academy students:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// 학생 등록은 학원 관리자만 가능
studentRoutes.post('/', zValidator('json', createStudentSchema), async (c) => {
    const user = c.get('user')!;
    const { academy_id, details, profile_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const hasPermission = await hasAcademyAdminPermission(db, user.id, academy_id);
        if (!hasPermission) {
            return c.json({ error: '학생을 등록할 권한이 없습니다.' }, 403);
        }
        
        const [newMember] = await db.insert(schema.academyMembersTable)
            .values({
                academy_id,
                member_type: 'student',
                details,
                profile_id,
                status: 'active'
            })
            .returning();
            
        return c.json(newMember, 201);
    } catch (error: any) {
        console.error('Failed to create student:', error.message);
        if (error.code === '23505') {
            return c.json({ error: '해당 학생은 이미 이 학원에 등록되어 있습니다.' }, 409);
        }
        return c.json({ error: '데이터베이스 오류로 학생 등록에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// 학생 정보 수정 (학원 관리자 또는 담당 강사)
studentRoutes.put('/:memberId', zValidator('json', updateMemberSchema), async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId'); // 이 memberId가 targetStudentMemberId
    const validatedData = c.req.valid('json');
    
    if (Object.keys(validatedData).length === 0) return c.json({ error: '수정할 내용이 없습니다.' }, 400);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // [수정] canManageStudent 로 권한을 체크합니다!
        const hasPermission = await canManageStudent(db, user.id, memberId);
        if (!hasPermission) {
            return c.json({ error: '학생 정보를 수정할 권한이 없습니다.' }, 403);
        }

        const member = await db.query.academyMembersTable.findFirst({
            where: eq(schema.academyMembersTable.id, memberId),
            columns: { details: true }
        });

        if (!member) {
            return c.json({ error: '수정할 학생 정보를 찾을 수 없습니다.' }, 404);
        }

        await db.transaction(async (tx) => {
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

            if (Object.keys(dataToUpdate).length > 1) { // updated_at 외에 다른 변경사항이 있을 때만
                await tx.update(schema.academyMembersTable)
                    .set(dataToUpdate)
                    .where(eq(schema.academyMembersTable.id, memberId));
            }
            
            // 담당자 목록 업데이트 로직
            if (validatedData.manager_member_ids) {
                // 이 학생의 기존 담당자 연결을 모두 삭제
                await tx.delete(schema.studentManagerLinksTable)
                    .where(eq(schema.studentManagerLinksTable.student_member_id, memberId));

                // 새로운 담당자 목록으로 재설정
                if (validatedData.manager_member_ids.length > 0) {
                    const newLinks = validatedData.manager_member_ids.map(managerId => ({
                        student_member_id: memberId,
                        manager_member_id: managerId,
                    }));
                    await tx.insert(schema.studentManagerLinksTable).values(newLinks);
                }
            }
        });

        const updatedMember = await db.query.academyMembersTable.findFirst({
            where: eq(schema.academyMembersTable.id, memberId)
        });

        return c.json(updatedMember);
    } catch (error: any) {
        console.error(`Failed to update member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류로 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


// 학생 퇴원 처리 (학원 관리자 또는 담당 강사)
studentRoutes.delete('/:memberId', async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // [수정] canManageStudent 로 권한을 체크합니다!
        const hasPermission = await canManageStudent(db, user.id, memberId);
        if (!hasPermission) {
            return c.json({ error: '학생을 퇴원 처리할 권한이 없습니다.' }, 403);
        }
        
        const today = new Date().toISOString().split('T')[0];
        const [resignedMember] = await db.update(schema.academyMembersTable)
            .set({ status: 'resigned', end_date: today, updated_at: new Date() })
            .where(eq(schema.academyMembersTable.id, memberId))
            .returning({ id: schema.academyMembersTable.id });
            
        return c.json({ message: '퇴원 처리가 완료되었습니다.', id: resignedMember.id });
    } catch (error: any) {
        console.error(`Failed to soft-delete member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// 벌크 작업들은 학원 관리자만 가능하도록 유지
studentRoutes.post('/bulk-update-status', zValidator('json', bulkUpdateStatusSchema), async (c) => {
    const user = c.get('user')!;
    const { member_ids, status, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const hasPermission = await hasAcademyAdminPermission(db, user.id, academy_id);
        if (!hasPermission) {
            return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        }
        
        const result = await db.update(schema.academyMembersTable)
            .set({ status: status, updated_at: new Date() })
            .where(and(
                inArray(schema.academyMembersTable.id, member_ids), 
                eq(schema.academyMembersTable.academy_id, academy_id),
                eq(schema.academyMembersTable.member_type, 'student')
            ))
            .returning();
        return c.json({ message: `${result.length}명의 학생 상태가 변경되었습니다.`, updated: result });
    } catch (error: any) {
        console.error('Failed to bulk update member status:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/bulk-delete', zValidator('json', bulkDeleteSchema), async (c) => {
    const user = c.get('user')!;
    const { member_ids, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const hasPermission = await hasAcademyAdminPermission(db, user.id, academy_id);
        if (!hasPermission) {
            return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        }
        
        const today = new Date().toISOString().split('T')[0];
        const result = await db.update(schema.academyMembersTable)
            .set({ status: 'resigned', end_date: today, updated_at: new Date() })
            .where(and(
                inArray(schema.academyMembersTable.id, member_ids), 
                eq(schema.academyMembersTable.academy_id, academy_id),
                eq(schema.academyMembersTable.member_type, 'student')
            ))
            .returning({ id: schema.academyMembersTable.id });
        return c.json({ message: `${result.length}명의 학생이 퇴원 처리되었습니다.`, changedIds: result.map(s => s.id) });
    }
    catch (error: any)
    {
        console.error('Failed to bulk delete members:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default studentRoutes;