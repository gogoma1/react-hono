import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as pgSchema from '../../db/schema.pg';
import * as logD1Schema from '../../db/schema.log.d1';

// --- 프론트엔드가 전송할 Payload에 대한 Zod 스키마 정의 ---

// 문제별 결과 객체 스키마
const problemResultSchema = z.object({
    problem_id: z.string(),
    is_correct: z.boolean().optional(),
    time_taken_seconds: z.number().int().nonnegative(),
    submitted_answer: z.any().optional(),
    meta_cognition_status: z.enum(['A', 'B', 'C', 'D']).optional(),
    answer_change_count: z.number().int().nonnegative(),
});

// 시험 전체 요약 객체 스키마
const examSummarySchema = z.object({
    exam_start_time: z.string().datetime(),
    exam_end_time: z.string().datetime(),
    total_pure_time_seconds: z.number().int().nonnegative(),// 순수 시험 시간 시간이 누적되지 않는 경우도 있어서 순수하게 문제 푼 시간들의 합.
    correct_rate: z.number().min(0).max(100),
    answer_change_total_count: z.number().int().nonnegative(),
});

// 최종 제출 Payload 스키마
const submitAssignmentSchema = z.object({
    exam_summary: examSummarySchema,
    problem_results: z.array(problemResultSchema),
});


const examRoutes = new Hono<AppEnv>();


/**
 * POST /api/exam/assignments/:assignmentId/submit
 * 학생의 시험 제출을 처리하고, 결과를 PG와 D1에 분산 저장합니다.
 * 한쪽 DB 작업이 실패할 경우, 다른 쪽의 성공한 작업을 되돌리는 보상 로직을 포함합니다.
 */
examRoutes.post(
  '/assignments/:assignmentId/submit',
  zValidator('json', submitAssignmentSchema),
  async (c) => {
    const user = c.get('user');
    const assignmentId = c.req.param('assignmentId');
    const body = c.req.valid('json');
    
    // --- DB 클라이언트 초기화 ---
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(sql, { schema: pgSchema });
    const dbLogD1 = drizzleD1(c.env.D1_DATABASE_LOG, { schema: logD1Schema });

    // 1. 권한 확인 (PG에서 assignment 정보 조회)
    const assignment = await dbPg.query.examAssignmentsTable.findFirst({
        where: eq(pgSchema.examAssignmentsTable.id, assignmentId),
        with: { studentMember: { columns: { profile_id: true } } }
    });
    
    if (!assignment || assignment.studentMember?.profile_id !== user.id) {
        return c.json({ error: '유효하지 않은 시험이거나 제출 권한이 없습니다.' }, 404);
    }
    if (assignment.status === 'completed' || assignment.status === 'graded') {
        return c.json({ error: '이미 제출이 완료된 시험입니다.' }, 409);
    }

    // --- 보상 트랜잭션을 위한 플래그 ---
    let pgUpdateSucceeded = false;
    let d1InsertSucceeded = false;
    
    try {
        // --- 2. PG와 D1 작업을 병렬로 실행 ---
        const summary = body.exam_summary;
        const totalDuration = Math.round((new Date(summary.exam_end_time).getTime() - new Date(summary.exam_start_time).getTime()) / 1000);

        // PG 업데이트 Promise
        const pgPromise = dbPg.update(pgSchema.examAssignmentsTable)
            .set({
                status: 'completed',
                started_at: new Date(summary.exam_start_time),
                completed_at: new Date(summary.exam_end_time),
                total_pure_time_seconds: summary.total_pure_time_seconds,
                correct_rate: summary.correct_rate,
                total_duration_seconds: totalDuration,
                answer_change_total_count: summary.answer_change_total_count,
            })
            .where(eq(pgSchema.examAssignmentsTable.id, assignmentId))
            .then(() => { pgUpdateSucceeded = true; }); // 성공 시 플래그 설정

        // D1 삽입 Promise (풀이한 문제가 있을 경우에만)
        let d1Promise = Promise.resolve();
        if (body.problem_results.length > 0) {
            const logValues = body.problem_results.map(res => ({
                assignment_id: assignmentId,
                problem_id: res.problem_id,
                student_id: user.id,
                is_correct: res.is_correct,
                time_taken_seconds: res.time_taken_seconds,
                submitted_answer: res.submitted_answer != null ? String(res.submitted_answer) : null,
                meta_cognition_status: res.meta_cognition_status,
                answer_change_count: res.answer_change_count,
            }));
            
            d1Promise = dbLogD1.insert(logD1Schema.studentProblemResultsTable)
                .values(logValues)
                .onConflictDoNothing()
                .then(() => { d1InsertSucceeded = true; });
        } else {
            d1InsertSucceeded = true; // D1에 쓸 데이터가 없으면 성공으로 간주
        }

        await Promise.all([pgPromise, d1Promise]);

    } catch (error: any) {
        console.error('시험 제출 중 분산 작업 오류 발생:', error.message);

        // --- 3. 보상 로직 실행 ---
        if (pgUpdateSucceeded && !d1InsertSucceeded) {
            console.warn(`[보상 트랜잭션] D1 삽입 실패. PG 업데이트를 롤백합니다. Assignment ID: ${assignmentId}`);
            try {
                await dbPg.update(pgSchema.examAssignmentsTable)
                    .set({ status: 'in_progress' }) // 원래 상태로 롤백
                    .where(eq(pgSchema.examAssignmentsTable.id, assignmentId));
            } catch (rollbackError: any) {
                console.error(`[CRITICAL] PG 롤백 실패! 데이터 불일치 발생. Assignment ID: ${assignmentId}`, rollbackError.message);
            }
        }
        
        if (d1InsertSucceeded && !pgUpdateSucceeded && body.problem_results.length > 0) {
            console.warn(`[보상 트랜잭션] PG 업데이트 실패. D1 삽입을 롤백합니다. Assignment ID: ${assignmentId}`);
            try {
                const problemIds = body.problem_results.map(p => p.problem_id);
                const deleteStatements = problemIds.map(problemId => 
                    dbLogD1.delete(logD1Schema.studentProblemResultsTable)
                        .where(
                            and(
                                eq(logD1Schema.studentProblemResultsTable.assignment_id, assignmentId),
                                eq(logD1Schema.studentProblemResultsTable.problem_id, problemId)
                            )
                        )
                );
                if (deleteStatements.length > 0) {
                    await dbLogD1.batch(deleteStatements as any); // D1 batch의 타입추론이 완벽하지 않을 수 있음
                }
            } catch (rollbackError: any) {
                 console.error(`[CRITICAL] D1 롤백 실패! 데이터 불일치 발생. Assignment ID: ${assignmentId}`, rollbackError.message);
            }
        }

        return c.json({ error: '시험 제출 처리 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }

    return c.json({ message: '시험이 성공적으로 제출되었습니다.' }, 200);
  }
);


export default examRoutes;