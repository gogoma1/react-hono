// api/routes/manage/problems.ts

import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


const problemSchema = z.object({
  question_number: z.number(),
  question_text: z.string(),
  answer: z.string().nullable(),
  solution_text: z.string().nullable(),
  page: z.number().nullable(),
  problem_type: z.string(),
  grade: z.string(),
  semester: z.string(),
  source: z.string(),
  major_chapter_id: z.string(),
  middle_chapter_id: z.string(),
  core_concept_id: z.string(),
  problem_category: z.string(),
  difficulty: z.string(),
  score: z.string(),
  concept_keywords: z.array(z.string()).optional(), 
  calculation_keywords: z.array(z.string()).optional(),
});

const uploadProblemsBodySchema = z.object({
  problems: z.array(problemSchema),
});


type UploadProblemsInput = z.infer<typeof uploadProblemsBodySchema>;

const problemRoutes = new Hono<AppEnv>();

problemRoutes.get('/', async (c) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const problemsData = await db.query.problemTable.findMany({
            where: eq(schema.problemTable.creator_id, user.id),
            orderBy: (problem, { asc }) => [asc(problem.created_at)],
            // [수정] with를 사용하여 관계형 데이터(JOIN)를 가져옵니다.
            with: {
                majorChapter: { columns: { name: true } },
                middleChapter: { columns: { name: true } },
                coreConcept: { columns: { name: true } },
            }
        });

        // [수정] 프론트엔드 타입에 맞게 데이터 구조를 변환합니다.
        const transformedProblems = problemsData.map(p => ({
            ...p,
            major_chapter_id: p.majorChapter?.name ?? 'N/A',
            middle_chapter_id: p.middleChapter?.name ?? 'N/A',
            core_concept_id: p.coreConcept?.name ?? 'N/A',
        }));

        return c.json(transformedProblems, 200);

    } catch (error: any) {
        console.error('Failed to fetch problems:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.', details: error.message }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


problemRoutes.post('/upload', zValidator('json', uploadProblemsBodySchema), async (c) => {
    // ... (이하 코드는 변경 없음)
    const user = c.get('user')!;
    const { problems } = c.req.valid('json') as UploadProblemsInput;

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const result = await db.transaction(async (tx) => {
            let insertedCount = 0;

            for (const problem of problems) {
                const [majorChapter] = await tx.insert(schema.majorChaptersTable)
                    .values({ name: problem.major_chapter_id })
                    .onConflictDoUpdate({ target: schema.majorChaptersTable.name, set: { name: problem.major_chapter_id } })
                    .returning();

                const [middleChapter] = await tx.insert(schema.middleChaptersTable)
                    .values({ name: problem.middle_chapter_id, major_chapter_id: majorChapter.id })
                    .onConflictDoNothing() 
                    .returning();

                const [coreConcept] = await tx.insert(schema.coreConceptsTable)
                    .values({ name: problem.core_concept_id })
                    .onConflictDoUpdate({ target: schema.coreConceptsTable.name, set: { name: problem.core_concept_id } })
                    .returning();
                
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