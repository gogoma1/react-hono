import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// ... (스키마 정의는 변경 없음)
const problemSchema = z.object({
  problem_id: z.string().uuid().optional(),
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

const updateProblemBodySchema = problemSchema.omit({ problem_id: true }).partial();

const deleteProblemsBodySchema = z.object({
    problem_ids: z.array(z.string().uuid()).min(1, { message: '삭제할 문제 ID를 하나 이상 제공해야 합니다.' }),
});

type UploadProblemsInput = z.infer<typeof uploadProblemsBodySchema>;
type UpdateProblemInput = z.infer<typeof updateProblemBodySchema>;

const problemRoutes = new Hono<AppEnv>();

// ... (GET, POST, PUT 라우트는 변경 없음)
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
            with: {
                majorChapter: { columns: { name: true } },
                middleChapter: { columns: { name: true } },
                coreConcept: { columns: { name: true } },
            }
        });

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
problemRoutes.put('/:id', zValidator('json', updateProblemBodySchema), async (c) => {
    const user = c.get('user')!;
    const problemId = c.req.param('id');
    const problemData = c.req.valid('json') as UpdateProblemInput;

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const [updatedProblem] = await db.transaction(async (tx) => {
            const dataToUpdate: Partial<typeof schema.problemTable.$inferInsert> = {
                ...problemData,
                updated_at: new Date()
            };

            if (problemData.major_chapter_id) {
                const [majorChapter] = await tx.insert(schema.majorChaptersTable)
                    .values({ name: problemData.major_chapter_id })
                    .onConflictDoUpdate({ target: schema.majorChaptersTable.name, set: { name: problemData.major_chapter_id } })
                    .returning();
                dataToUpdate.major_chapter_id = majorChapter.id;
            }

            if (problemData.middle_chapter_id && dataToUpdate.major_chapter_id) {
                 const [middleChapter] = await tx.insert(schema.middleChaptersTable)
                    .values({ name: problemData.middle_chapter_id, major_chapter_id: dataToUpdate.major_chapter_id })
                    .onConflictDoNothing()
                    .returning();
                if (middleChapter) {
                    dataToUpdate.middle_chapter_id = middleChapter.id;
                }
            }

            if (problemData.core_concept_id) {
                const [coreConcept] = await tx.insert(schema.coreConceptsTable)
                    .values({ name: problemData.core_concept_id })
                    .onConflictDoUpdate({ target: schema.coreConceptsTable.name, set: { name: problemData.core_concept_id } })
                    .returning();
                dataToUpdate.core_concept_id = coreConcept.id;
            }

            return tx.update(schema.problemTable)
                .set(dataToUpdate)
                .where(and(
                    eq(schema.problemTable.problem_id, problemId),
                    eq(schema.problemTable.creator_id, user.id)
                ))
                .returning();
        });
        
        if (!updatedProblem) {
            return c.json({ error: '문제를 찾을 수 없거나 업데이트할 권한이 없습니다.' }, 404);
        }

        return c.json(updatedProblem);

    } catch (error: any) {
        console.error(`Failed to update problem ${problemId}:`, error.message);
        return c.json({ error: '데이터베이스 업데이트에 실패했습니다.', details: error.message }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

// [수정] 단일/다중 문제 영구 삭제 라우트 (DELETE /:id 경로 제거)
problemRoutes.delete('/', zValidator('json', deleteProblemsBodySchema), async (c) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { problem_ids } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const deletedProblems = await db.delete(schema.problemTable)
            .where(and(
                inArray(schema.problemTable.problem_id, problem_ids),
                eq(schema.problemTable.creator_id, user.id)
            ))
            .returning({ id: schema.problemTable.problem_id });

        if (deletedProblems.length === 0) {
            return c.json({ error: '삭제할 문제를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }

        return c.json({ 
            message: `${deletedProblems.length}개의 문제가 성공적으로 삭제되었습니다.`, 
            deleted_count: deletedProblems.length 
        }, 200);

    } catch (error: any) {
        console.error(`Failed to delete problems:`, error.message);
        return c.json({ error: '데이터베이스 삭제 작업에 실패했습니다.', details: error.message }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


export default problemRoutes;