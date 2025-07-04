import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// --- Zod 스키마 정의 ---

// 시험 출제 API의 요청 본문 스키마
const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problemIds: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  studentIds: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  headerInfo: z.record(z.any()).optional(),
});

// 시험 제출 API의 요청 본문 스키마
const submitAssignmentSchema = z.object({
  examStartTime: z.string().datetime(),
  examEndTime: z.string().datetime(),
  totalPureTimeSeconds: z.number().int().nonnegative(),
  correctRate: z.number().min(0).max(100).nullable(),
  problemLogs: z.array(z.object({
    problemId: z.string(),
    timeTakenSeconds: z.number().int().nonnegative(),
    finalAnswer: z.any().optional(),
    finalStatus: z.enum(['A', 'B', 'C', 'D']).optional(), 
    isModified: z.boolean(),
    answerHistory: z.array(z.any()),
  })),
});


const examRoutes = new Hono<AppEnv>();

// --- API 엔드포인트 ---

/**
 * POST /api/exam/sets - 새로운 시험지 세트 생성 및 학생들에게 할당
 */
examRoutes.post(
  '/sets',
  zValidator('json', publishExamSetSchema),
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
      const result = await db.transaction(async (tx) => {
        // 1. exam_sets 테이블에 새로운 시험지 세트 생성
        const [newExamSet] = await tx.insert(schema.examSetsTable).values({
          creator_id: user.id,
          title: body.title,
          problem_ids: body.problemIds,
          header_info: body.headerInfo,
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        // 2. 선택된 학생들에게 시험지 할당
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
      console.error('Failed to publish exam set:', error);
      return c.json({ error: '시험지 출제 중 오류가 발생했습니다.' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
  }
);


/**
 * POST /api/exam/assignments/:assignmentId/submit - 학생 시험 제출 및 R2에 로그 저장
 */
examRoutes.post(
  '/assignments/:assignmentId/submit',
  zValidator('json', submitAssignmentSchema),
  async (c) => {
    const user = c.get('user');
    const assignmentId = c.req.param('assignmentId');
    const body = c.req.valid('json');
    
    // [개선] 로그 저장을 위한 R2 버킷을 미리 확인합니다.
    // 서버 설정이 잘못된 경우, DB 업데이트 전에 미리 실패를 알려줄 수 있습니다.
    const logBucket = c.env.LOGS_R2_BUCKET;
    if (!logBucket) {
        console.error('R2 로그 버킷 바인딩(LOGS_R2_BUCKET)이 설정되지 않았습니다.');
        return c.json({ error: '서버 설정 오류: 로그 저장소를 찾을 수 없습니다.' }, 500);
    }
    
    // --- 1. 주요 DB (PostgreSQL) 업데이트 ---
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    
    try {
        const [updatedAssignment] = await db.update(schema.examAssignmentsTable)
            .set({
                status: body.correctRate === null ? 'completed' : 'graded',
                started_at: new Date(body.examStartTime),
                completed_at: new Date(body.examEndTime),
                total_pure_time_seconds: body.totalPureTimeSeconds,
                correct_rate: body.correctRate,
            })
            .where(and(
                eq(schema.examAssignmentsTable.id, assignmentId),
                eq(schema.examAssignmentsTable.student_id, user.id)
            ))
            .returning({ id: schema.examAssignmentsTable.id });

        if (!updatedAssignment) {
            return c.json({ error: '유효하지 않은 시험이거나 제출 권한이 없습니다.' }, 404);
        }

    } catch (error) {
        console.error('Failed to update assignment status:', error);
        return c.json({ error: '시험 상태 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }

    // --- 2. 로그 데이터 R2 (Data Lake)에 비동기 저장 ---
    // c.executionCtx.waitUntil을 사용해 응답을 기다리지 않고 백그라운드에서 실행합니다.
    c.executionCtx.waitUntil((async () => {
        try {
            // [수정] 요청하신 대로 LOGS_R2_BUCKET을 사용하도록 변경합니다.
            // const bucket = c.env.MY_R2_BUCKET; // <- 이전 코드
            const bucket = logBucket; // <- 미리 확인한 버킷 변수 사용

            const now = new Date();
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const logId = crypto.randomUUID();

            // 데이터 분석에 용이한 파티션 구조로 키를 생성합니다 (e.g., Hive-style partitioning)
            const r2Key = `logs/year=${year}/month=${month}/day=${day}/${assignmentId}/${logId}.json`;
            
            // 저장할 로그 데이터에 메타데이터(과제 ID, 학생 ID, 제출 시각)를 추가합니다.
            const fullLogData = { 
                ...body, 
                assignmentId, 
                studentId: user.id, 
                submittedAt: now.toISOString() 
            };
            
            // R2에 JSON 형태로 로그를 저장합니다.
            await bucket.put(r2Key, JSON.stringify(fullLogData, null, 2), {
                httpMetadata: { contentType: 'application/json' },
            });
            console.log(`Log for assignment ${assignmentId} saved to R2 at ${r2Key}`);

        } catch (r2Error) {
            // 이 에러는 사용자에게 직접 전달되지 않으므로, 서버 로깅이 매우 중요합니다.
            console.error(`CRITICAL: Failed to save log for assignment ${assignmentId} to R2:`, r2Error);
        }
    })());

    // --- 3. 사용자에게 즉시 성공 응답 ---
    return c.json({ message: '시험이 성공적으로 제출되었습니다.' }, 200);
  }
);


export default examRoutes;