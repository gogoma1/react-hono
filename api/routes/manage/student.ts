import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


const enrollmentSchemaBase = z.object({
  student_name: z.string().min(1, "학생 이름은 필수입니다."),
  grade: z.string().min(1, "학년은 필수입니다."),
  subject: z.string().min(1, "과목은 필수입니다."),
  status: z.enum(schema.studentStatusEnum.enumValues),
  tuition: z.number().nonnegative().optional().nullable(),
  admission_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
  student_phone: z.string().optional().nullable(),
  school_name: z.string().optional().nullable(),
  class_name: z.string().optional().nullable(),
  teacher: z.string().optional().nullable(),
  student_profile_id: z.string().uuid().optional().nullable(),
});

const createEnrollmentSchema = enrollmentSchemaBase.extend({
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
});

const updateEnrollmentSchema = enrollmentSchemaBase.partial().extend({
    discharge_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
});

const bulkUpdateStatusSchema = z.object({
    enrollment_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    status: z.enum(schema.studentStatusEnum.enumValues),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."), // 권한 확인용
});

const bulkDeleteSchema = z.object({
    enrollment_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."), // 권한 확인용
});


const studentRoutes = new Hono<AppEnv>();


/**
 * GET /:academyId - 특정 학원의 모든 재원생 목록 조회
 * 원장은 자신이 소유한 학원의 학생 목록만 조회할 수 있습니다.
 */
studentRoutes.get('/:academyId', async (c) => {
    const user = c.get('user')!;
    const academyId = c.req.param('academyId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academyId),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '학원을 찾을 수 없거나 조회 권한이 없습니다.' }, 404);
        }

        const enrollments = await db.query.enrollmentsTable.findMany({
            where: eq(schema.enrollmentsTable.academy_id, academyId),
            orderBy: desc(schema.enrollmentsTable.created_at),
        });
        return c.json(enrollments);
    } catch (error: any) {
        console.error('Failed to fetch enrollments:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * POST / - 특정 학원에 새로운 재원생 등록
 */
studentRoutes.post('/', zValidator('json', createEnrollmentSchema), async (c) => {
    const user = c.get('user')!;
    const { academy_id, ...enrollmentData } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '학생을 등록할 학원을 찾을 수 없거나 권한이 없습니다.' }, 403);
        }

        const [newEnrollment] = await db.insert(schema.enrollmentsTable)
            .values({ ...enrollmentData, academy_id })
            .returning();
            
        return c.json(newEnrollment, 201);
    } catch (error: any) {
        console.error('Failed to create enrollment:', error.message);
        return c.json({ error: '데이터베이스 오류로 학생 등록에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * PUT /:enrollmentId - 특정 재원생 정보 수정
 */
studentRoutes.put('/:enrollmentId', zValidator('json', updateEnrollmentSchema), async (c) => {
    const user = c.get('user')!;
    const enrollmentId = c.req.param('enrollmentId');
    const validatedData = c.req.valid('json');
    
    if (Object.keys(validatedData).length === 0) {
        return c.json({ error: '수정할 내용이 없습니다.' }, 400);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const enrollment = await db.query.enrollmentsTable.findFirst({
            where: eq(schema.enrollmentsTable.id, enrollmentId),
            with: { academy: { columns: { principal_id: true } } }
        });

        if (!enrollment || enrollment.academy.principal_id !== user.id) {
            return c.json({ error: '수정할 학생 정보를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }

        const [updatedEnrollment] = await db.update(schema.enrollmentsTable)
            .set({ ...validatedData, updated_at: new Date() })
            .where(eq(schema.enrollmentsTable.id, enrollmentId))
            .returning();

        return c.json(updatedEnrollment);
    } catch (error: any) {
        console.error(`Failed to update enrollment ${enrollmentId}:`, error);
        return c.json({ error: '데이터베이스 오류로 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * DELETE /:enrollmentId - 특정 재원생 퇴원 처리 (Soft Delete)
 */
studentRoutes.delete('/:enrollmentId', async (c) => {
    const user = c.get('user')!;
    const enrollmentId = c.req.param('enrollmentId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const enrollment = await db.query.enrollmentsTable.findFirst({
            where: eq(schema.enrollmentsTable.id, enrollmentId),
            with: { academy: { columns: { principal_id: true } } }
        });

        if (!enrollment || enrollment.academy.principal_id !== user.id) {
            return c.json({ error: '퇴원 처리할 학생 정보를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const [softDeleted] = await db.update(schema.enrollmentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(eq(schema.enrollmentsTable.id, enrollmentId))
            .returning({ id: schema.enrollmentsTable.id });

        return c.json({ message: '퇴원 처리가 완료되었습니다.', id: softDeleted.id });

    } catch (error: any) {
        console.error(`Failed to soft-delete enrollment ${enrollmentId}:`, error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * POST /bulk-update-status - 여러 재원생 상태 일괄 변경
 */
studentRoutes.post('/bulk-update-status', zValidator('json', bulkUpdateStatusSchema), async (c) => {
    const user = c.get('user')!;
    const { enrollment_ids, status, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        }

        const result = await db.update(schema.enrollmentsTable)
            .set({ status: status, updated_at: new Date() })
            .where(and(
                inArray(schema.enrollmentsTable.id, enrollment_ids),
                eq(schema.enrollmentsTable.academy_id, academy_id) // 재확인
            ))
            .returning();
        
        return c.json({ message: `${result.length}명의 학생 상태가 변경되었습니다.`, updated: result });
    } catch (error: any) {
        console.error('Failed to bulk update student status:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * POST /bulk-delete - 여러 재원생 일괄 퇴원 처리 (Soft Delete)
 */
studentRoutes.post('/bulk-delete', zValidator('json', bulkDeleteSchema), async (c) => {
    const user = c.get('user')!;
    const { enrollment_ids, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    
    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        }

        const today = new Date().toISOString().split('T')[0];
        const result = await db.update(schema.enrollmentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(and(
                inArray(schema.enrollmentsTable.id, enrollment_ids),
                eq(schema.enrollmentsTable.academy_id, academy_id)
            ))
            .returning({ id: schema.enrollmentsTable.id });
            
        return c.json({ message: `${result.length}명의 학생이 퇴원 처리되었습니다.`, deletedIds: result.map(s => s.id) });
    } catch (error: any) {
        console.error('Failed to bulk delete students:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default studentRoutes;