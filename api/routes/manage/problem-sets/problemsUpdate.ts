import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';
import { GRADES_NAME_TO_ID_MAP } from '../../../shared/curriculum.data'; 

const problemSchemaForAdd = z.object({
  question_number: z.number(),
  question_text: z.string(),
  answer: z.string().nullable(),
  solution_text: z.string().nullable(),
  page: z.number().nullable(),
  problem_type: z.enum(schema.problemTypeEnum),
  grade: z.string(), // 이름으로 받음
  semester: z.string().nullable(),
  major_chapter_id: z.string().nullable(),
  middle_chapter_id: z.string().nullable(),
  core_concept_id: z.string().nullable(),
  problem_category: z.string().nullable(),
  difficulty: z.string(),
  score: z.string(),
  calculation_skill_ids: z.array(z.string()).optional(), // 연산 개념 ID 배열
});

const addProblemsToSetSchema = z.object({
  subtitleId: z.string().min(1, '소제목 ID(subtitleId)는 필수입니다.'),
  problems: z.array(problemSchemaForAdd).min(1, '추가할 문제가 하나 이상 필요합니다.'),
});

const problemsUpdateRoutes = new Hono<AppEnv>();

/**
 * [수정됨] 특정 문제집의 특정 소제목에 여러 문제를 추가하는 엔드포인트
 * POST /api/manage/problem-sets/:problemSetId/problems
 * order 값을 Date.now() 기반으로 생성하여 중복 가능성을 최소화합니다.
 */
problemsUpdateRoutes.post(
  '/:problemSetId/problems',
  zValidator('json', addProblemsToSetSchema),
  async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('problemSetId');
    const { subtitleId, problems } = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
      const problemSet = await db.query.problemSetTable.findFirst({
        where: and(
            eq(schema.problemSetTable.problem_set_id, problemSetId),
            eq(schema.problemSetTable.creator_id, user.id)
        )
      });
      if (!problemSet) {
        return c.json({ error: '문제집을 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
      }

      const statements: BatchItem<'sqlite'>[] = [];
      const now = new Date().toISOString().replace(/T|Z/g, ' ').trim();
      
      const baseTimestamp = Date.now();

      for (const [index, problem] of problems.entries()) {
        const { grade, calculation_skill_ids, ...restOfProblem } = problem;
        
        const grade_id = GRADES_NAME_TO_ID_MAP.get(grade) ?? null;
        if (grade && !grade_id) {
            return c.json({ error: `유효하지 않은 학년 이름입니다: ${grade}`}, 400);
        }

        const newProblemId = `prob_${crypto.randomUUID()}`;
        const problemData = {
            ...restOfProblem,
            grade_id,
            problem_id: newProblemId,
            creator_id: user.id,
            subtitle_id: subtitleId,
            created_at: now,
            updated_at: now,
        };
        statements.push(db.insert(schema.problemTable).values(problemData as schema.DbProblem));
        
        statements.push(db.insert(schema.problemSetProblemsTable).values({
            problem_set_id: problemSetId,
            problem_id: newProblemId,
            order: baseTimestamp + index,
        }));
        
        if (calculation_skill_ids && calculation_skill_ids.length > 0) {
            const skillInserts = calculation_skill_ids.map(skill_id => ({
                problem_id: newProblemId,
                skill_id: skill_id,
            }));
            statements.push(db.insert(schema.problemCalculationSkillsTable).values(skillInserts));
        }
      }

      statements.push(
        db.update(schema.problemSetTable)
          .set({ 
              problem_count: sql`${schema.problemSetTable.problem_count} + ${problems.length}`, 
              updated_at: now 
            })
          .where(eq(schema.problemSetTable.problem_set_id, problemSetId))
      );
      
      statements.push(
        db.update(schema.problemSetSubtitlesTable)
          .set({ count: sql`${schema.problemSetSubtitlesTable.count} + ${problems.length}` })
          .where(and(
              eq(schema.problemSetSubtitlesTable.problem_set_id, problemSetId),
              eq(schema.problemSetSubtitlesTable.subtitle_id, subtitleId)
          ))
      );

      if (statements.length > 0) {
        await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
      }
      
      return c.json({
        success: true,
        message: `${problems.length}개의 문제가 '${problemSet.name}' 문제집에 성공적으로 추가되었습니다.`,
      }, 201);

    } catch (error: any) {
      console.error('Failed to add problems to set in D1:', error);
      return c.json({ error: 'D1 데이터베이스 작업에 실패했습니다.', details: error.cause ? error.cause.message : error.message }, 500);
    }
  }
);

export default problemsUpdateRoutes;