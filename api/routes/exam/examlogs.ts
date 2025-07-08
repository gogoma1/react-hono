import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problem_ids: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  student_ids: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  header_info: z.record(z.any()).optional(),
});

const submitAssignmentSchema = z.object({
  exam_start_time: z.string().datetime(),
  exam_end_time: z.string().datetime(),
  total_pure_time_seconds: z.number().int().nonnegative(),
  correct_rate: z.number().min(0).max(100).nullable(),
  problem_logs: z.array(z.object({
    problem_id: z.string(),
    time_taken_seconds: z.number().int().nonnegative(),
    final_answer: z.any().optional(),
    final_status: z.enum(['A', 'B', 'C', 'D']).optional(), 
    is_modified: z.boolean(),
    answer_history: z.array(z.any()),
  })),
});


const examRoutes = new Hono<AppEnv>();


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
        const [newExamSet] = await tx.insert(schema.examSetsTable).values({
          creator_id: user.id,
          title: body.title,
          problem_ids: body.problem_ids,
          header_info: body.header_info,
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        // [수정] 'student_id'를 스키마에 정의된 'student_member_id'로 변경합니다.
        // `body.student_ids`는 `academy_members.id`를 담고 있으므로 변수명은 그대로 사용해도 괜찮습니다.
        const assignments = body.student_ids.map(studentMemberId => ({
          exam_set_id: newExamSet.id,
          student_member_id: studentMemberId,
        }));
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { exam_set_id: newExamSet.id, assigned_count: assignments.length };
      });

      return c.json({ 
        message: `${result.assigned_count}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
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
    
    const logBucket = c.env.LOGS_R2_BUCKET;
    if (!logBucket) {
        console.error('R2 로그 버킷 바인딩(LOGS_R2_BUCKET)이 설정되지 않았습니다.');
        return c.json({ error: '서버 설정 오류: 로그 저장소를 찾을 수 없습니다.' }, 500);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    
    try {
        // [수정] 제출 권한을 확인하고 상태를 업데이트하는 로직 개선
        
        // 1. 제출하려는 시험 할당 정보를 가져옵니다.
        const assignment = await db.query.examAssignmentsTable.findFirst({
            where: eq(schema.examAssignmentsTable.id, assignmentId),
            with: {
                studentMember: { // academyMembersTable과의 관계를 이용합니다.
                    columns: {
                        profile_id: true // 학생의 profile_id를 가져옵니다.
                    }
                }
            }
        });
        
        // 2. 시험이 존재하지 않거나, 할당된 학생의 profile_id가 현재 로그인한 사용자의 id와 다르면 권한 오류를 반환합니다.
        if (!assignment || assignment.studentMember?.profile_id !== user.id) {
            return c.json({ error: '유효하지 않은 시험이거나 제출 권한이 없습니다.' }, 404);
        }

        // 3. 권한이 확인되었으므로, assignmentId를 기준으로 상태를 업데이트합니다.
        const [updatedAssignment] = await db.update(schema.examAssignmentsTable)
            .set({
                status: body.correct_rate === null ? 'completed' : 'graded',
                started_at: new Date(body.exam_start_time),
                completed_at: new Date(body.exam_end_time),
                total_pure_time_seconds: body.total_pure_time_seconds,
                correct_rate: body.correct_rate,
            })
            .where(eq(schema.examAssignmentsTable.id, assignmentId))
            .returning({ id: schema.examAssignmentsTable.id });
        
        if (!updatedAssignment) {
            // 이 경우는 거의 발생하지 않지만, 방어 코드로 남겨둡니다.
            return c.json({ error: '시험 상태 업데이트에 실패했습니다. 다시 시도해주세요.' }, 500);
        }

    } catch (error) {
        console.error('Failed to update assignment status:', error);
        return c.json({ error: '시험 상태 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }

    c.executionCtx.waitUntil((async () => {
        try {
            const bucket = logBucket;

            const now = new Date();
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const logId = crypto.randomUUID();

            const r2Key = `logs/year=${year}/month=${month}/day=${day}/${assignmentId}/${logId}.json`;
            
            const fullLogData = { 
                ...body, 
                assignmentId, 
                studentId: user.id, 
                submittedAt: now.toISOString() 
            };
            
            await bucket.put(r2Key, JSON.stringify(fullLogData, null, 2), {
                httpMetadata: { contentType: 'application/json' },
            });
            console.log(`Log for assignment ${assignmentId} saved to R2 at ${r2Key}`);

        } catch (r2Error) {
            console.error(`CRITICAL: Failed to save log for assignment ${assignmentId} to R2:`, r2Error);
        }
    })());

    return c.json({ message: '시험이 성공적으로 제출되었습니다.' }, 200);
  }
);


export default examRoutes;