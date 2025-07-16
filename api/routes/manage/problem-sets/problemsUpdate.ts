import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';
import { GRADES_NAME_TO_ID_MAP } from '../../../shared/curriculum.data'; 

// 중복 사용될 수 있으므로 별도 함수로 분리
async function ensureSubtitleId(db: import('drizzle-orm/d1').DrizzleD1Database<typeof schema>, name: string): Promise<string> {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Subtitle name cannot be empty.");

    const existing = await db.query.subtitlesTable.findFirst({ where: eq(schema.subtitlesTable.name, trimmedName) });
    if (existing) return existing.id;
    
    const newId = `sub_${crypto.randomUUID()}`;
    await db.insert(schema.subtitlesTable).values({ id: newId, name: trimmedName });
    return newId;
}

const problemSchemaForAdd = z.object({
  question_number: z.number(),
  question_text: z.string(),
  answer: z.string().nullable(),
  solution_text: z.string().nullable(),
  page: z.number().nullable(),
  problem_type: z.enum(schema.problemTypeEnum),
  grade: z.string(),
  semester: z.string().nullable(),
  // [수정] subtitle 필드를 필수로 받도록 변경
  subtitle: z.string().min(1, '문제별 소제목(subtitle)은 필수입니다.'), 
  major_chapter_id: z.string().nullable(),
  middle_chapter_id: z.string().nullable(),
  core_concept_id: z.string().nullable(),
  problem_category: z.string().nullable(),
  difficulty: z.string(),
  score: z.string(),
  calculation_skill_ids: z.array(z.string()).optional(),
});

// [수정] `addProblemsToSetSchema` 수정: `subtitleId` 대신 `subtitleName`을 받도록 함
const addProblemsToSetSchema = z.object({
  subtitleId: z.string().min(1, '소제목(subtitleId)은 필수입니다.'), // 클라이언트에서는 소제목 이름(string)을 이 필드에 담아 보냅니다.
  problems: z.array(problemSchemaForAdd).min(1, '추가할 문제가 하나 이상 필요합니다.'),
});

const problemsUpdateRoutes = new Hono<AppEnv>();

problemsUpdateRoutes.post(
  '/:problemSetId/problems',
  zValidator('json', addProblemsToSetSchema),
  async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('problemSetId');
    // [수정] body에서 subtitleId를 subtitleName으로 간주하여 사용
    const { subtitleId: subtitleName, problems } = c.req.valid('json');
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

      // [수정] 전달받은 이름으로 subtitleId를 조회하거나 생성
      const subtitleId = await ensureSubtitleId(db, subtitleName);

      const lastProblemInSet = await db.query.problemSetProblemsTable.findFirst({
        where: eq(schema.problemSetProblemsTable.problem_set_id, problemSetId),
        orderBy: [desc(schema.problemSetProblemsTable.order)],
        columns: { order: true }
      });
      const startOrder = (lastProblemInSet?.order || 0) + 1;

      const existingSubtitleLink = await db.query.problemSetSubtitlesTable.findFirst({
        where: and(
            eq(schema.problemSetSubtitlesTable.problem_set_id, problemSetId),
            eq(schema.problemSetSubtitlesTable.subtitle_id, subtitleId)
        )
      });
      
      const statements: BatchItem<'sqlite'>[] = [];
      const now = new Date().toISOString().replace(/T|Z/g, ' ').trim();
      
      for (const [index, problem] of problems.entries()) {
        const { grade, calculation_skill_ids, subtitle, ...restOfProblem } = problem;
        
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
            // [수정] 각 문제에 조회/생성된 subtitleId를 할당
            subtitle_id: subtitleId, 
            created_at: now,
            updated_at: now,
        };
        statements.push(db.insert(schema.problemTable).values(problemData as schema.DbProblem));
        
        statements.push(db.insert(schema.problemSetProblemsTable).values({
            problem_set_id: problemSetId,
            problem_id: newProblemId,
            order: startOrder + index,
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
      
      if (existingSubtitleLink) {
          statements.push(
            db.update(schema.problemSetSubtitlesTable)
              .set({ count: sql`${schema.problemSetSubtitlesTable.count} + ${problems.length}` })
              .where(and(
                  eq(schema.problemSetSubtitlesTable.problem_set_id, problemSetId),
                  eq(schema.problemSetSubtitlesTable.subtitle_id, subtitleId)
              ))
          );
      } else {
          statements.push(
            db.insert(schema.problemSetSubtitlesTable).values({
                problem_set_id: problemSetId,
                subtitle_id: subtitleId,
                count: problems.length
            })
          );
      }

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