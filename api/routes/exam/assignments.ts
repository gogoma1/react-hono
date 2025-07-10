import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, inArray, and } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const assignExamSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problem_ids: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  student_ids: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  header_info: z.record(z.any()).nullable().optional(),
});

const assignmentRoutes = new Hono<AppEnv>();

/**
 * GET /sets/my - 내가 출제한 시험지 목록 조회
 */
assignmentRoutes.get('/sets/my', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: '인증 정보가 필요합니다.' }, 401);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const myExamSets = await db.query.examSetsTable.findMany({
            where: eq(schema.examSetsTable.creator_id, user.id),
            orderBy: [desc(schema.examSetsTable.created_at)],
            with: {
                assignments: {
                    columns: { id: true }
                }
            }
        });

        const responseData = myExamSets.map(set => ({
            id: set.id,
            title: set.title,
            problem_ids: set.problem_ids,
            created_at: set.created_at,
            assigned_student_count: set.assignments.length,
        }));

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch my exam sets:', error);
        return c.json({ error: '내 시험지 목록을 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * GET /my-assignments - 로그인한 학생에게 할당된 모든 시험지 목록 조회
 */
assignmentRoutes.get('/my-assignments', async (c) => {
    const user = c.get('user');
    if (!user || !user.id) return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const userMemberships = await db.query.academyMembersTable.findMany({
            where: and(
                eq(schema.academyMembersTable.profile_id, user.id),
                eq(schema.academyMembersTable.member_type, 'student')
            ),
            columns: { id: true }
        });

        if (userMemberships.length === 0) return c.json([]);
        const memberIds = userMemberships.map(m => m.id);

        const assignments = await db.query.examAssignmentsTable.findMany({
            where: inArray(schema.examAssignmentsTable.student_member_id, memberIds),
            orderBy: [desc(schema.examAssignmentsTable.assigned_at)],
            with: { examSet: true },
        });

        const responseData = assignments.map(a => ({
            id: a.id,
            status: a.status,
            assigned_at: a.assigned_at,
            examSet: {
                id: a.examSet.id,
                title: a.examSet.title,
                problem_ids: a.examSet.problem_ids,
                header_info: a.examSet.header_info,
                creator_id: a.examSet.creator_id,
            }
        }));

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch student assignments from Supabase:', error);
        return c.json({ error: '시험지 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * [핵심 경로 수정] POST /assign - 새로운 시험지 세트 생성 및 학생들에게 할당
 */
assignmentRoutes.post(
  '/assign',
  zValidator('json', assignExamSchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
      const result = await db.transaction(async (tx) => {
        const [newExamSet] = await tx.insert(schema.examSetsTable).values({
          creator_id: user.id,
          title: body.title,
          problem_ids: body.problem_ids,
          header_info: body.header_info,
        }).returning();

        if (!newExamSet) throw new Error("시험지 세트 생성에 실패했습니다.");
        
        const assignments = body.student_ids.map(memberId => ({
          exam_set_id: newExamSet.id,
          student_member_id: memberId,
        }));
        
        if (assignments.length === 0) throw new Error("시험지를 할당할 학생이 없습니다.");
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { exam_set_id: newExamSet.id, assigned_count: assignments.length };
      });

      return c.json({ 
        message: `${result.assigned_count}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
        ...result 
      }, 201);

    } catch (error: any) {
      console.error('Failed to assign exam set:', error);
      return c.json({ error: '시험지 할당 중 오류가 발생했습니다.' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
  }
);

export default assignmentRoutes;