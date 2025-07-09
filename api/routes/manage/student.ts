import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { hasAcademyAdminPermission, canManageStudent } from '../middleware/permission';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const memberDetailsSchema = z.object({
    student_name: z.string().min(1, "학생 이름은 필수입니다."),
    grade: z.string().min(1, "학년은 필수입니다."),
    subject: z.string().min(1, "과목은 필수입니다."),
    student_phone: z.string().optional().transform(v => v || undefined),
    guardian_phone: z.string().optional().transform(v => v || undefined),
    school_name: z.string().optional().transform(v => v || undefined),
    class_name: z.string().optional().transform(v => v || undefined),
    // teacher 필드는 더 이상 사용하지 않음
    tuition: z.number().nonnegative().optional(),
});

const createStudentSchema = z.object({
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
    details: memberDetailsSchema,
    profile_id: z.string().uuid().optional().nullable(),
});

// [수정] updateMemberSchema에 담당자 ID 배열(manager_member_ids) 추가
const updateMemberSchema = z.object({
    status: z.enum(schema.memberStatusEnum.enumValues).optional(),
    details: memberDetailsSchema.partial().optional(),
    start_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
    end_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
    manager_member_ids: z.array(z.string().uuid()).optional(), // 담당 강사/관리자 member_id 목록
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

// [수정] 학생 목록 조회 시, 담당자 정보도 함께 가져오도록 with 옵션 추가
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
            with: {
                managerLinks: { // 학생에게 연결된 담당자 링크를 가져옴
                    with: {
                        manager: { // 링크를 통해 실제 담당자(manager)의 정보를 가져옴
                            columns: { id: true, details: true } // 필요한 정보만 선택
                        }
                    }
                }
            }
        });
        
        // 프론트엔드에서 사용하기 편하도록 데이터 구조 변환
        const responseData = members.map(member => ({
            ...member,
            managers: member.managerLinks.map(link => link.manager)
        }));

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch academy students:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

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

// [수정] 학생 정보 및 담당자 정보 업데이트 로직 변경
studentRoutes.put('/:memberId', zValidator('json', updateMemberSchema), async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const validatedData = c.req.valid('json');
    
    if (Object.keys(validatedData).length === 0) return c.json({ error: '수정할 내용이 없습니다.' }, 400);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
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

        // 트랜잭션을 사용하여 학생 정보와 담당자 연결 정보를 원자적으로 업데이트
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

            // `updated_at` 외에 다른 변경사항이 있을 때만 업데이트 실행
            if (Object.keys(dataToUpdate).length > 1) { 
                await tx.update(schema.academyMembersTable)
                    .set(dataToUpdate)
                    .where(eq(schema.academyMembersTable.id, memberId));
            }
            
            // `manager_member_ids`가 요청에 포함된 경우에만 담당자 연결 정보 업데이트
            if (validatedData.manager_member_ids) {
                // 1. 해당 학생의 기존 연결을 모두 삭제
                await tx.delete(schema.studentManagerLinksTable)
                    .where(eq(schema.studentManagerLinksTable.student_member_id, memberId));

                // 2. 요청으로 들어온 새로운 담당자 목록이 비어있지 않다면, 다시 insert
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
            where: eq(schema.academyMembersTable.id, memberId),
            with: { // 업데이트된 담당자 정보까지 포함하여 반환
                 managerLinks: {
                    with: {
                        manager: {
                            columns: { id: true, details: true }
                        }
                    }
                }
            }
        });
        
        const responseData = {
            ...updatedMember,
            managers: updatedMember?.managerLinks.map(link => link.manager)
        }

        return c.json(responseData);
    } catch (error: any) {
        console.error(`Failed to update member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류로 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.delete('/:memberId', async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
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

// ... (나머지 bulk-update, bulk-delete 코드는 변경 없음)
// ...
// ...
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