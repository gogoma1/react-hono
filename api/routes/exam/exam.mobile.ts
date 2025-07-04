import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// 클라이언트로부터 받을 데이터의 유효성 검사를 위한 Zod 스키마
const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problemIds: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  studentIds: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  headerInfo: z.record(z.any()).nullable().optional(),
});

const mobileExamRoutes = new Hono<AppEnv>();

/**
 * [핵심 기능] POST /api/exam/mobile/sets - 새로운 모바일 시험지 세트 생성 및 학생들에게 할당
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
      // 데이터 일관성을 위해 트랜잭션 사용
      const result = await db.transaction(async (tx) => {
        // 1. exam_sets 테이블에 시험지 정보 삽입
        const [newExamSet] = await tx.insert(schema.examSetsTable).values({
          creator_id: user.id,
          title: body.title,
          problem_ids: body.problemIds,
          header_info: body.headerInfo, // null 또는 객체가 들어옴
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        // 2. 각 학생에 대해 exam_assignments 테이블에 할당 정보 삽입
        const assignments = body.studentIds.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
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
      // 백그라운드에서 비동기적으로 연결을 종료하도록 함
      c.executionCtx.waitUntil(sql.end());
    }
  }
);

export default mobileExamRoutes;