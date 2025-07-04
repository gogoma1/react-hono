import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// 시험지 세트 출제 시 요청 본문의 유효성을 검사하기 위한 Zod 스키마
const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problemIds: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  studentIds: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  headerInfo: z.record(z.any()).nullable().optional(),
});

const mobileExamRoutes = new Hono<AppEnv>();

/**
 * GET /api/exam/mobile/my-assignment - 로그인한 학생에게 할당된 최신 시험지 조회
 * Supabase 미들웨어를 통해 인증된 사용자의 ID를 기반으로 동작합니다.
 */
mobileExamRoutes.get('/my-assignment', async (c) => {
    // 미들웨어에서 설정된 'user' 객체를 가져옵니다.
    const user = c.get('user');
    
    // 사용자가 없거나 ID가 없으면 인증 오류를 반환합니다.
    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }
    
    // Supabase DB에 연결합니다.
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // exam_assignments 테이블에서 현재 로그인한 사용자의 ID와 일치하는 데이터를 찾습니다.
        const assignment = await db.query.examAssignmentsTable.findFirst({
            where: eq(schema.examAssignmentsTable.student_id, user.id),
            // 여러 시험지가 할당되었을 경우를 대비해 가장 최근에 할당된 것을 기준으로 정렬합니다.
            orderBy: [desc(schema.examAssignmentsTable.assigned_at)],
            // `with` 옵션을 사용하여 관련된 exam_sets 테이블 정보도 함께 조회합니다 (JOIN).
            with: {
                examSet: true,
            },
        });

        // 조회된 데이터가 없으면 404 Not Found 에러를 반환합니다.
        if (!assignment) {
            return c.json({ error: '할당된 시험지를 찾을 수 없습니다.' }, 404);
        }

        // 조회된 데이터를 JSON 형식으로 반환합니다.
        return c.json(assignment);

    } catch (error: any) {
        console.error('Failed to fetch student assignment from Supabase:', error);
        return c.json({ error: '시험지 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        // 요청 처리가 끝난 후 백그라운드에서 비동기적으로 DB 연결을 종료합니다.
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
      // 트랜잭션을 시작하여 시험지 생성과 할당이 모두 성공하거나 실패하도록 보장합니다.
      const result = await db.transaction(async (tx) => {
        // 1. exam_sets 테이블에 새로운 시험지 세트를 삽입합니다.
        const [newExamSet] = await tx.insert(schema.examSetsTable).values({
          creator_id: user.id,
          title: body.title,
          problem_ids: body.problemIds,
          header_info: body.headerInfo,
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        // 2. 선택된 학생 ID 목록을 순회하며 할당 데이터를 준비합니다.
        const assignments = body.studentIds.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
        // 3. exam_assignments 테이블에 할당 데이터를 삽입합니다.
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { examSetId: newExamSet.id, assignedCount: assignments.length };
      });

      return c.json({ 
        message: `${result.assignedCount}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
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