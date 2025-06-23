import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// --- 여기부터 수정 ---

const problemSchema = z.object({
  // 프론트엔드 `useJsonProblemImporter`에서 생성하는 데이터 형식과 일치시킵니다.
  question_number: z.number(),
  question_text: z.string(),
  answer: z.string().nullable(), // JSON에서 null이 올 수 있으므로 nullable() 추가
  solution_text: z.string().nullable(), // 이름 변경 (detailed_solution -> solution_text), nullable() 추가
  page: z.number().nullable(), // 이름 변경 (page_number -> page)
  problem_type: z.string(),
  grade: z.string(), // 이름 변경 (grade_level -> grade)
  semester: z.string(),
  source: z.string(),

  // 이 필드들도 이름 변경
  major_chapter_id: z.string(),
  middle_chapter_id: z.string(),
  core_concept_id: z.string(),
  problem_category: z.string(), // 이름 변경 (problemCategories -> problem_category)

  difficulty: z.string(),
  score: z.string(),
  
  // 현재 JSON Importer는 이 키워드들을 생성하지 않으므로 optional()로 만들어줍니다.
  // 나중에 키워드 추출 기능을 추가하면 optional()을 제거할 수 있습니다.
  concept_keywords: z.array(z.string()).optional(), 
  calculation_keywords: z.array(z.string()).optional(),
});

const uploadProblemsBodySchema = z.object({
  problems: z.array(problemSchema),
});

// --- 여기까지 수정 ---

type UploadProblemsInput = z.infer<typeof uploadProblemsBodySchema>;

const problemRoutes = new Hono<AppEnv>();

problemRoutes.post('/upload', zValidator('json', uploadProblemsBodySchema), async (c) => {
    const user = c.get('user')!;
    const { problems } = c.req.valid('json') as UploadProblemsInput;

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const result = await db.transaction(async (tx) => {
            let insertedCount = 0;

            for (const problem of problems) {
                // majorChapters 대신 major_chapter_id 사용
                const [majorChapter] = await tx.insert(schema.majorChaptersTable)
                    .values({ name: problem.major_chapter_id })
                    .onConflictDoUpdate({ target: schema.majorChaptersTable.name, set: { name: problem.major_chapter_id } })
                    .returning();

                // middleChapters 대신 middle_chapter_id 사용
                const [middleChapter] = await tx.insert(schema.middleChaptersTable)
                    .values({ name: problem.middle_chapter_id, major_chapter_id: majorChapter.id })
                    .onConflictDoNothing() 
                    .returning();

                // coreConcepts 대신 core_concept_id 사용
                const [coreConcept] = await tx.insert(schema.coreConceptsTable)
                    .values({ name: problem.core_concept_id })
                    .onConflictDoUpdate({ target: schema.coreConceptsTable.name, set: { name: problem.core_concept_id } })
                    .returning();
                
                // Zod 스키마와 일치된 필드명으로 DB에 삽입
                const [insertedProblem] = await tx.insert(schema.problemTable).values({
                    question_number: problem.question_number,
                    question_text: problem.question_text,
                    answer: problem.answer,
                    solution_text: problem.solution_text,
                    page: problem.page,
                    problem_type: problem.problem_type,
                    grade: problem.grade,
                    semester: problem.semester,
                    source: problem.source,
                    problem_category: problem.problem_category,
                    difficulty: problem.difficulty,
                    score: problem.score,
                    creator_id: user.id,
                    major_chapter_id: majorChapter?.id,
                    middle_chapter_id: middleChapter?.id,
                    core_concept_id: coreConcept?.id,
                }).returning({ id: schema.problemTable.problem_id });
                
                insertedCount++;

                // optional chaining을 사용하여 keywords가 있을 때만 실행
                const allKeywords = [
                    ...(problem.concept_keywords?.map(kw => ({ name: kw, type: 'concept' })) || []),
                    ...(problem.calculation_keywords?.map(kw => ({ name: kw, type: 'calculation' })) || []),
                ];

                for (const keyword of allKeywords) {
                    const [tag] = await tx.insert(schema.tagTable)
                        .values({ name: keyword.name, tag_type: keyword.type })
                        .onConflictDoUpdate({ target: schema.tagTable.name, set: { name: keyword.name } })
                        .returning();

                    if (insertedProblem && tag) {
                        await tx.insert(schema.problemTagTable)
                           .values({ problem_id: insertedProblem.id, tag_id: tag.tag_id })
                           .onConflictDoNothing();
                    }
                }
            }
            return { count: insertedCount };
        });

        return c.json({ success: true, count: result.count }, 201);

    } catch (error: any) {
        console.error('Failed to upload problems:', error.message);
        return c.json({ error: 'Database query failed', details: error.message }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default problemRoutes;