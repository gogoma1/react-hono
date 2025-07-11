import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
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
    
    console.log(`[SUBMIT_START] Assignment ID: ${assignmentId}, User ID: ${user.id}`);
    console.log(`[SUBMIT_PAYLOAD] Body contains ${body.problem_results.length} problem results.`);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(sql, { schema: pgSchema });
    const dbLogD1 = drizzleD1(c.env.D1_DATABASE_LOG, { schema: logD1Schema });

    const assignment = await dbPg.query.examAssignmentsTable.findFirst({
        where: eq(pgSchema.examAssignmentsTable.id, assignmentId),
        with: { studentMember: { columns: { profile_id: true } } }
    });
    
    if (!assignment) {
        console.warn(`[SUBMIT_FAIL] Assignment not found. ID: ${assignmentId}`);
        return c.json({ error: '존재하지 않는 시험입니다.' }, 404);
    }
    if (assignment.studentMember?.profile_id !== user.id) {
        console.warn(`[SUBMIT_FAIL] User mismatch. Requester: ${user.id}, Student in DB: ${assignment.studentMember?.profile_id}`);
        return c.json({ error: '시험을 제출할 권한이 없습니다.' }, 403);
    }
    if (assignment.status === 'completed' || assignment.status === 'graded') {
        console.log(`[SUBMIT_INFO] Already completed. Status: ${assignment.status}. ID: ${assignmentId}`);
        return c.json({ message: '이미 제출이 완료된 시험입니다.' }, 200); // 충돌이 아닌 정보성으로 200 OK를 반환할 수도 있습니다.
    }

    let pgUpdateSucceeded = false;
    let d1InsertSucceeded = false;
    
    try {
        const summary = body.exam_summary;
        const totalDuration = Math.round((new Date(summary.exam_end_time).getTime() - new Date(summary.exam_start_time).getTime()) / 1000);

        const pgUpdateData = {
            status: 'completed' as const,
            started_at: new Date(summary.exam_start_time),
            completed_at: new Date(summary.exam_end_time),
            total_pure_time_seconds: summary.total_pure_time_seconds,
            correct_rate: summary.correct_rate,
            total_duration_seconds: totalDuration,
            answer_change_total_count: summary.answer_change_total_count,
        };
        
        console.log(`[SUBMIT_PG_DATA] PG update data for ${assignmentId}:`, JSON.stringify(pgUpdateData));
        const pgPromise = dbPg.update(pgSchema.examAssignmentsTable)
            .set(pgUpdateData)
            .where(eq(pgSchema.examAssignmentsTable.id, assignmentId))
            .then(() => { 
                pgUpdateSucceeded = true;
                console.log(`[SUBMIT_PG_SUCCESS] PG update successful for ${assignmentId}`);
             });

        let d1Promise = Promise.resolve();
        if (body.problem_results.length > 0) {
            const logValues = body.problem_results.map(res => ({
                assignment_id: assignmentId,
                problem_id: res.problem_id,
                student_id: user.id,
                is_correct: res.is_correct ?? null,
                time_taken_seconds: res.time_taken_seconds,
                submitted_answer: res.submitted_answer != null ? String(res.submitted_answer) : null,
                meta_cognition_status: res.meta_cognition_status ?? null,
                answer_change_count: res.answer_change_count,
            }));
            
            console.log(`[SUBMIT_D1_DATA] Total ${logValues.length} records to insert into D1 for ${assignmentId}.`);
            
            d1Promise = (async () => {
                const CHUNK_SIZE = 10;
                for (let i = 0; i < logValues.length; i += CHUNK_SIZE) {
                    const chunk = logValues.slice(i, i + CHUNK_SIZE);
                    console.log(`[SUBMIT_D1_CHUNK] Inserting chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(logValues.length / CHUNK_SIZE)}...`);
                    await dbLogD1.insert(logD1Schema.studentProblemResultsTable)
                        .values(chunk)
                        .onConflictDoNothing();
                }
                d1InsertSucceeded = true; 
                console.log(`[SUBMIT_D1_SUCCESS] All D1 chunks inserted for ${assignmentId}`);
            })();

        } else {
            console.log(`[SUBMIT_D1_INFO] No problem results to log in D1 for ${assignmentId}.`);
            d1InsertSucceeded = true;
        }

        await Promise.all([pgPromise, d1Promise]);

    } catch (error: any) {
        console.error(`[SUBMIT_ERROR] Distributed transaction failed for ${assignmentId}.`, error);
        console.error(`[SUBMIT_ERROR_DETAILS] Name: ${error.name}, Message: ${error.message}, Cause:`, JSON.stringify(error.cause, null, 2));

        if (pgUpdateSucceeded && !d1InsertSucceeded) {
            console.warn(`[SUBMIT_COMPENSATION] D1 insert failed. Rolling back PG update for ${assignmentId}.`);
            try {
                await dbPg.update(pgSchema.examAssignmentsTable)
                    .set({ status: 'in_progress' }) 
                    .where(eq(pgSchema.examAssignmentsTable.id, assignmentId));
            } catch (rollbackError: any) {
                console.error(`[SUBMIT_CRITICAL] PG rollback FAILED! Data inconsistency for ${assignmentId}.`, rollbackError);
            }
        }
        
        if (d1InsertSucceeded && !pgUpdateSucceeded) {
            console.warn(`[SUBMIT_COMPENSATION] PG update failed. Rolling back D1 insert for ${assignmentId}.`);
            try {
                const problemIds = body.problem_results.map(p => p.problem_id);
                await dbLogD1.delete(logD1Schema.studentProblemResultsTable)
                    .where(
                        and(
                            eq(logD1Schema.studentProblemResultsTable.assignment_id, assignmentId),
                            inArray(logD1Schema.studentProblemResultsTable.problem_id, problemIds)
                        )
                    );
            } catch (rollbackError: any) {
                 console.error(`[SUBMIT_CRITICAL] D1 rollback FAILED! Data inconsistency for ${assignmentId}.`, rollbackError);
            }
        }

        return c.json({ 
            error: '시험 제출 처리 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            details: { name: error.name, message: error.message, cause: error.cause }
        }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }

    console.log(`[SUBMIT_SUCCESS] Successfully submitted assignment ${assignmentId}.`);
    return c.json({ message: '시험이 성공적으로 제출되었습니다.' }, 200);
  }
);

export default submissionRoutes;