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
 * [기존] GET /api/exam/mobile/sets/my - 내가 출제한 모바일 시험지 목록 조회
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
                assignments: {
                    columns: {
                        id: true,
                    }
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
 * [핵심 수정] GET /api/exam/mobile/my-assignments - 로그인한 학생에게 할당된 '모든' 시험지 목록 조회
 * 기존의 /my-assignment 라우트를 복수형으로 변경하고, 모든 할당된 시험지를 배열로 반환합니다.
 */
mobileExamRoutes.get('/my-assignments', async (c) => {
    const user = c.get('user');
    
    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // 1. 현재 로그인한 유저가 '학생'으로서 속한 모든 학원 멤버십 ID를 찾습니다.
        const userMemberships = await db.query.academyMembersTable.findMany({
            where: and(
                eq(schema.academyMembersTable.profile_id, user.id),
                eq(schema.academyMembersTable.member_type, 'student')
            ),
            columns: { id: true }
        });

        if (userMemberships.length === 0) {
            // 학생으로 등록된 정보가 없으면 빈 배열을 반환합니다. 프론트에서 처리하기 용이합니다.
            return c.json([]);
        }

        const memberIds = userMemberships.map(m => m.id);

        // 2. 해당 멤버십 ID로 할당된 '모든' 시험 과제를 찾습니다. (findFirst -> findMany)
        const assignments = await db.query.examAssignmentsTable.findMany({
            where: inArray(schema.examAssignmentsTable.student_member_id, memberIds),
            orderBy: [desc(schema.examAssignmentsTable.assigned_at)],
            with: {
                examSet: true, // 시험지 세트 정보 포함
                // 학생 및 학원 정보는 목록에서는 굳이 필요하지 않을 수 있으므로 제외하여 페이로드 감소
            },
        });

        // 3. 프론트엔드에서 사용하기 편한 형태로 데이터를 가공합니다.
        const responseData = assignments.map(a => ({
            id: a.id, // assignment.id
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
 * [기존] POST /api/exam/mobile/sets - 새로운 모바일 시험지 세트 생성 및 학생들에게 할당
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