import { Hono } from 'hono';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';
import { GRADES_NAME_TO_ID_MAP } from '../../../shared/curriculum.data'; 

/**
 * [핵심 수정] 소제목 이름으로 subtitle_id를 보장하고, 선택적으로 folder_id를 설정하는 함수.
 */
async function ensureSubtitleId(db: DrizzleD1Database<typeof schema>, subtitleName: string, folderId: string | null): Promise<string> {
    const trimmedName = subtitleName.trim();
    if (!trimmedName) {
        throw new Error("Subtitle name cannot be empty.");
    }

    // 이름과 폴더 ID가 모두 일치하는 기존 소제목을 찾습니다.
    // 하지만 폴더 ID가 다른 동일 이름의 소제목을 허용할지는 정책에 따라 달라질 수 있습니다.
    // 여기서는 이름으로만 찾고, 생성 시에만 folder_id를 설정하는 것으로 단순화합니다.
    const existing = await db.query.subtitlesTable.findFirst({
        where: eq(schema.subtitlesTable.name, trimmedName)
    });

    if (existing) {
        // 이미 존재하는 소제목은 폴더를 이동시키지 않고 ID만 반환합니다.
        // 폴더 이동은 별도의 API(move)를 사용하도록 유도합니다.
        return existing.id;
    }
    
    const newId = `sub_${crypto.randomUUID()}`;
    await db.insert(schema.subtitlesTable).values({ 
        id: newId, 
        name: trimmedName,
        folder_id: folderId, // [수정] 생성 시 folder_id를 설정
    });
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
  subtitle: z.string().min(1, '문제별 소제목(subtitle)은 필수입니다.'), 
  major_chapter_id: z.string().nullable(),
  middle_chapter_id: z.string().nullable(),
  core_concept_id: z.string().nullable(),
  problem_category: z.string().nullable(),
  difficulty: z.string(),
  score: z.string(),
  calculation_skill_ids: z.array(z.string()).optional(),
});

// [수정] API 요청 스키마에 folderId 추가
const addProblemsToSetSchema = z.object({
  subtitleName: z.string().min(1, '소제목 이름(subtitleName)은 필수입니다.'),
  problems: z.array(problemSchemaForAdd).min(1, '추가할 문제가 하나 이상 필요합니다.'),
  folderId: z.string().nullable().optional(), // [신규] 폴더 ID (선택 사항)
});

const problemsUpdateRoutes = new Hono<AppEnv>();

problemsUpdateRoutes.post(
  '/:problemSetId/problems',
  zValidator('json', addProblemsToSetSchema),
  async (c) => {
    const user = c.get('user');
    const problemSetId = c.req.param('problemSetId');
    // [수정] 요청 본문에서 folderId 추출
    const { subtitleName, problems, folderId } = c.req.valid('json');
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

      // [수정] ensureSubtitleId 호출 시 folderId 전달
      const subtitleId = await ensureSubtitleId(db, subtitleName, folderId ?? null);

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
      return c.json({ error: 'D1 데이터베이스 작업에 실패했습니다.', details: error.message }, 500);
    }
  }
);

export default problemsUpdateRoutes;