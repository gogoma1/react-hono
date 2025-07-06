import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problem_ids: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  student_ids: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  header_info: z.record(z.any()).nullable().optional(),
});

const mobileExamRoutes = new Hono<AppEnv>();

/**
 * GET /api/exam/mobile/my-assignment - 로그인한 학생에게 할당된 최신 시험지 조회
 * Supabase 미들웨어를 통해 인증된 사용자의 ID를 기반으로 동작합니다.
 */
mobileExamRoutes.get('/my-assignment', async (c) => {
    const user = c.get('user');
    
    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const assignment = await db.query.examAssignmentsTable.findFirst({
            where: eq(schema.examAssignmentsTable.student_id, user.id),
            orderBy: [desc(schema.examAssignmentsTable.assigned_at)],
            with: {
                examSet: true,
            },
        });

        if (!assignment) {
            return c.json({ error: '할당된 시험지를 찾을 수 없습니다.' }, 404);
        }

        return c.json(assignment);

    } catch (error: any) {
        console.error('Failed to fetch student assignment from Supabase:', error);
        return c.json({ error: '시험지 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * POST /api/exam/mobile/sets - 새로운 모바일 시험지 세트 생성 및 학생들에게 할당
 */
mobileExamRoutes.post(
  '/sets',
  zValidator('json', publishExamSetSchema),
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

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        const assignments = body.student_ids.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { exam_set_id: newExamSet.id, assigned_count: assignments.length };
      });

      return c.json({ 
        message: `${result.assigned_count}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
        ...result 
      }, 201);

    } catch (error: any) {
      console.error('Failed to publish mobile exam set:', error);
      return c.json({ error: '모바일 시험지 출제 중 오류가 발생했습니다.' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
  }
);

export default mobileExamRoutes;