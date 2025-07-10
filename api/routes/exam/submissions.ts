import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
// [수정] inArray를 다시 import 합니다.
import { eq, and, inArray } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as pgSchema from '../../db/schema.pg';
import * as logD1Schema from '../../db/schema.log.d1';

const problemResultSchema = z.object({
    problem_id: z.string(),
    is_correct: z.boolean().optional(),
    time_taken_seconds: z.number().int().nonnegative(),
    submitted_answer: z.any().optional(),
    meta_cognition_status: z.enum(['A', 'B', 'C', 'D']).optional(),
    answer_change_count: z.number().int().nonnegative(),
});

const examSummarySchema = z.object({
    exam_start_time: z.string().datetime(),
    exam_end_time: z.string().datetime(),
    total_pure_time_seconds: z.number().int().nonnegative(),
    correct_rate: z.number().min(0).max(100),
    answer_change_total_count: z.number().int().nonnegative(),
});

const submitAssignmentSchema = z.object({
    exam_summary: examSummarySchema,
    problem_results: z.array(problemResultSchema),
});

const submissionRoutes = new Hono<AppEnv>();

submissionRoutes.post(
  '/assignments/:assignmentId/submit',
  zValidator('json', submitAssignmentSchema),
  async (c) => {
    const user = c.get('user');
    const assignmentId = c.req.param('assignmentId');
    const body = c.req.valid('json');
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(sql, { schema: pgSchema });
    const dbLogD1 = drizzleD1(c.env.D1_DATABASE_LOG, { schema: logD1Schema });

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

    let pgUpdateSucceeded = false;
    let d1InsertSucceeded = false;
    
    try {
        const summary = body.exam_summary;
        const totalDuration = Math.round((new Date(summary.exam_end_time).getTime() - new Date(summary.exam_start_time).getTime()) / 1000);

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
            .then(() => { pgUpdateSucceeded = true; });

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
            d1InsertSucceeded = true;
        }

        await Promise.all([pgPromise, d1Promise]);

    } catch (error: any) {
        console.error('시험 제출 중 분산 작업 오류 발생:', error.message);

        if (pgUpdateSucceeded && !d1InsertSucceeded) {
            console.warn(`[보상 트랜잭션] D1 삽입 실패. PG 업데이트를 롤백합니다. Assignment ID: ${assignmentId}`);
            try {
                await dbPg.update(pgSchema.examAssignmentsTable)
                    .set({ status: 'in_progress' }) 
                    .where(eq(pgSchema.examAssignmentsTable.id, assignmentId));
            } catch (rollbackError: any) {
                console.error(`[CRITICAL] PG 롤백 실패! 데이터 불일치 발생. Assignment ID: ${assignmentId}`, rollbackError.message);
            }
        }
        
        // [수정] 롤백 로직을 inArray를 사용하는 방식으로 개선합니다.
        if (d1InsertSucceeded && !pgUpdateSucceeded && body.problem_results.length > 0) {
            console.warn(`[보상 트랜잭션] PG 업데이트 실패. D1 삽입을 롤백합니다. Assignment ID: ${assignmentId}`);
            try {
                const problemIds = body.problem_results.map(p => p.problem_id);
                // 단일 쿼리로 여러 행을 삭제하여 더 효율적입니다.
                await dbLogD1.delete(logD1Schema.studentProblemResultsTable)
                    .where(
                        and(
                            eq(logD1Schema.studentProblemResultsTable.assignment_id, assignmentId),
                            inArray(logD1Schema.studentProblemResultsTable.problem_id, problemIds)
                        )
                    );
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

export default submissionRoutes;