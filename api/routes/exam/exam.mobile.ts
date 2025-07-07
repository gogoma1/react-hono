import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, inArray, and } from 'drizzle-orm';

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
 * [신규] GET /api/exam/mobile/sets/my - 내가 출제한 모바일 시험지 목록 조회
 */
mobileExamRoutes.get('/sets/my', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: '인증 정보가 필요합니다.' }, 401);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const myExamSets = await db.query.examSetsTable.findMany({
            where: eq(schema.examSetsTable.creator_id, user.id),
            orderBy: [desc(schema.examSetsTable.created_at)],
            with: {
                // 각 시험지에 몇 명이 할당되었는지 카운트 정보를 포함할 수 있습니다.
                assignments: {
                    columns: {
                        id: true,
                    }
                }
            }
        });

        // 클라이언트에 필요한 정보만 가공하여 반환
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
 * GET /api/exam/mobile/my-assignment - 로그인한 학생에게 할당된 최신 시험지 조회
 */
mobileExamRoutes.get('/my-assignment', async (c) => {
    const user = c.get('user');
    
    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }
    
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

        if (userMemberships.length === 0) {
            return c.json({ error: '학생으로 등록된 학원 정보를 찾을 수 없습니다.' }, 404);
        }

        const memberIds = userMemberships.map(m => m.id);

        const assignment = await db.query.examAssignmentsTable.findFirst({
            where: inArray(schema.examAssignmentsTable.student_member_id, memberIds),
            orderBy: [desc(schema.examAssignmentsTable.assigned_at)],
            with: {
                examSet: true,
                studentMember: {
                    with: {
                        academy: true
                    }
                }
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
        
        const assignments = body.student_ids.map(memberId => ({
          exam_set_id: newExamSet.id,
          student_member_id: memberId,
        }));
        
        if (assignments.length === 0) {
            throw new Error("시험지를 할당할 학생이 없습니다.");
        }
        
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