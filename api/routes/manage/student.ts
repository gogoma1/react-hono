import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// [수정] inArray를 import하여 일괄 처리에 사용합니다.
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// --- Zod 스키마 정의 ---

const createStudentBodySchema = z.object({
  student_name: z.string().min(1),
  grade: z.string().min(1),
  status: z.enum(schema.studentStatusEnum.enumValues),
  subject: z.string().min(1),
  tuition: z.union([z.string(), z.number()]).transform(val => Number(val)).pipe(z.number().nonnegative()),
  admission_date: z.string().nullable().optional(),
  student_phone: z.string().nullable().optional(),
  guardian_phone: z.string().nullable().optional(),
  school_name: z.string().nullable().optional(),
  class_name: z.string().nullable().optional(), // `class`는 예약어이므로 `class_name` 사용
  teacher: z.string().nullable().optional(),
});
type CreateStudentInput = z.infer<typeof createStudentBodySchema>;

const updateStudentBodySchema = createStudentBodySchema.partial().extend({
    discharge_date: z.string().nullable().optional(),
});
type UpdateStudentInput = z.infer<typeof updateStudentBodySchema>;

// [신규] 일괄 상태 변경을 위한 스키마
const bulkUpdateStatusBodySchema = z.object({
    ids: z.array(z.string().uuid()),
    status: z.enum(schema.studentStatusEnum.enumValues),
});

// [신규] 일괄 삭제를 위한 스키마
const bulkDeleteBodySchema = z.object({
    ids: z.array(z.string().uuid()),
});


// --- 라우터 시작 ---

const studentRoutes = new Hono<AppEnv>();

// [기존] GET / - 모든 학생 조회 (변경 없음)
studentRoutes.get('/', async (c) => {
    const user = c.get('user')!;
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const students = await db.query.studentsTable.findMany({
            where: eq(schema.studentsTable.principal_id, user.id),
            orderBy: (students, { asc }) => [asc(students.student_name)],
        });
        return c.json(students);
    } catch (error: any) {
        console.error('Failed to fetch students:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// [기존] POST / - 새 학생 추가 (변경 없음)
studentRoutes.post('/', zValidator('json', createStudentBodySchema), async (c) => {
    const user = c.get('user')!;
    const validatedData = c.req.valid('json') as CreateStudentInput;
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const [newStudent] = await db.insert(schema.studentsTable)
            .values({ ...validatedData, principal_id: user.id })
            .returning();
        if (!newStudent) throw new Error('Student creation failed, no data returned.');
        return c.json(newStudent, 201);
    } catch (error: any) {
        console.error('Failed to create student:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// [신규] POST /bulk-update-status - 여러 학생 상태 일괄 변경
studentRoutes.post('/bulk-update-status', zValidator('json', bulkUpdateStatusBodySchema), async (c) => {
    const user = c.get('user')!;
    const { ids, status } = c.req.valid('json');

    if (!ids || ids.length === 0) {
        return c.json({ error: 'No student IDs provided' }, 400);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const updatedStudents = await db.update(schema.studentsTable)
            .set({ status: status, updated_at: new Date() })
            .where(and(
                inArray(schema.studentsTable.id, ids),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning();

        return c.json(updatedStudents);
    } catch (error: any) {
        console.error('Failed to bulk update student status:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// [신규] POST /bulk-delete - 여러 학생 일괄 소프트 삭제
studentRoutes.post('/bulk-delete', zValidator('json', bulkDeleteBodySchema), async (c) => {
    const user = c.get('user')!;
    const { ids } = c.req.valid('json');
    
    if (!ids || ids.length === 0) {
        return c.json({ error: 'No student IDs provided' }, 400);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
        const deletedStudents = await db.update(schema.studentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(and(
                inArray(schema.studentsTable.id, ids),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning({ id: schema.studentsTable.id });
            
        return c.json({ message: 'Students marked as deleted successfully', deletedIds: deletedStudents.map(s => s.id) });
    } catch (error: any) {
        console.error('Failed to bulk delete students:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// [기존] PUT /:id - 특정 학생 정보 수정 (변경 없음)
studentRoutes.put('/:id', zValidator('json', updateStudentBodySchema), async (c) => {
    const user = c.get('user')!;
    const studentId = c.req.param('id');
    const validatedData = c.req.valid('json') as UpdateStudentInput;
    if (Object.keys(validatedData).length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
    }
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const [updatedStudent] = await db.update(schema.studentsTable)
            .set({ ...validatedData, updated_at: new Date() })
            .where(and(
                eq(schema.studentsTable.id, studentId),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning();
        if (!updatedStudent) {
            return c.json({ error: 'Student not found or not authorized to update' }, 404);
        }
        return c.json(updatedStudent);
    } catch (error: any) {
        console.error('Failed to update student:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// [수정] DELETE /:id - 특정 학생 소프트 삭제 (상태 변경)
studentRoutes.delete('/:id', async (c) => {
    const user = c.get('user')!;
    const studentId = c.req.param('id');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

        // DELETE 쿼리 대신 UPDATE 쿼리 사용
        const [softDeletedStudent] = await db.update(schema.studentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(and(
                eq(schema.studentsTable.id, studentId),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning({ id: schema.studentsTable.id });

        if (!softDeletedStudent) {
            return c.json({ error: 'Student not found or not authorized to delete' }, 404);
        }
        // 프론트엔드 호환성을 위해 기존 응답 형식 유지
        return c.json({ message: 'Student deleted successfully', id: softDeletedStudent.id });

    } catch (error: any) {
        console.error('Failed to soft delete student:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default studentRoutes;