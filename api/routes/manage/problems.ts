import { Hono } from 'hono';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, inArray, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.d1';

// --- Zod 스키마 정의 ---
const problemSchema = z.object({
  problem_id: z.string().optional(),
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
});

const uploadProblemsBodySchema = z.object({
  problems: z.array(problemSchema),
});

const updateProblemBodySchema = problemSchema.omit({ problem_id: true }).partial();

const deleteProblemsBodySchema = z.object({
    problem_ids: z.array(z.string()).min(1),
});

const problemRoutes = new Hono<AppEnv>();

// --- 헬퍼 함수: 단원/개념 이름으로 ID를 찾아오거나 새로 생성 ---
// PUT /:id 에서만 사용됩니다.
async function ensureChapterAndConceptIdsForPut(
    db: DrizzleD1Database<typeof schema>,
    data: { major_chapter_id?: string | null, middle_chapter_id?: string | null, core_concept_id?: string | null },
    existingProblem?: { major_chapter_id: string | null }
) {
    const result: { major_chapter_id?: string, middle_chapter_id?: string, core_concept_id?: string } = {};
    let finalMajorChapterId = existingProblem?.major_chapter_id;

    // 1. 대단원 처리
    if (data.major_chapter_id) {
        await db.insert(schema.majorChaptersTable).values({ id: crypto.randomUUID(), name: data.major_chapter_id }).onConflictDoNothing();
        const [item] = await db.select({ id: schema.majorChaptersTable.id }).from(schema.majorChaptersTable).where(eq(schema.majorChaptersTable.name, data.major_chapter_id));
        if (item) {
            result.major_chapter_id = item.id;
            finalMajorChapterId = item.id;
        }
    }

    // 2. 중단원 처리 (대단원 ID가 있어야 함)
    if (data.middle_chapter_id && finalMajorChapterId) {
        await db.insert(schema.middleChaptersTable).values({ id: crypto.randomUUID(), name: data.middle_chapter_id, major_chapter_id: finalMajorChapterId }).onConflictDoNothing();
        const [item] = await db.select({ id: schema.middleChaptersTable.id }).from(schema.middleChaptersTable).where(and(eq(schema.middleChaptersTable.name, data.middle_chapter_id), eq(schema.middleChaptersTable.major_chapter_id, finalMajorChapterId)));
        if (item) {
            result.middle_chapter_id = item.id;
        }
    }

    // 3. 핵심 개념 처리
    if (data.core_concept_id) {
        await db.insert(schema.coreConceptsTable).values({ id: crypto.randomUUID(), name: data.core_concept_id }).onConflictDoNothing();
        const [item] = await db.select({ id: schema.coreConceptsTable.id }).from(schema.coreConceptsTable).where(eq(schema.coreConceptsTable.name, data.core_concept_id));
        if (item) {
            result.core_concept_id = item.id;
        }
    }

    return result;
}


/**
 * GET / - 사용자가 생성한 모든 문제 목록 조회
 */
problemRoutes.get('/', async (c) => {
    const user = c.get('user');
    const d1 = c.env.D1_DATABASE;
    const db = drizzle(d1, { schema });

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
            major_chapter_id: p.majorChapter?.name ?? p.major_chapter_id,
            middle_chapter_id: p.middleChapter?.name ?? p.middle_chapter_id,
            core_concept_id: p.coreConcept?.name ?? p.core_concept_id,
        }));

        return c.json(transformedProblems, 200);
    } catch (error: any) {
        console.error('Failed to fetch problems from D1:', error.message);
        return c.json({ error: 'D1 데이터베이스 조회에 실패했습니다.', details: error.message }, 500);
    }
});

/**
 * POST /upload - 여러 문제 생성 또는 업데이트 (성능 최적화 버전)
 */
problemRoutes.post('/upload', zValidator('json', uploadProblemsBodySchema), async (c) => {
    const user = c.get('user');
    const { problems } = c.req.valid('json');
    const d1 = c.env.D1_DATABASE;
    const db = drizzle(d1, { schema });

    if (problems.length === 0) {
        return c.json({ success: true, created: 0, updated: 0 });
    }

    try {
        // --- 1. 요청 데이터에서 모든 단원/개념 이름 수집 ---
        const uniqueMajorNames = [...new Set(problems.map(p => p.major_chapter_id).filter(Boolean))];
        const uniqueCoreConceptNames = [...new Set(problems.map(p => p.core_concept_id).filter(Boolean))];
        const middleChapterPairs = problems
            .map(p => ({ majorName: p.major_chapter_id, middleName: p.middle_chapter_id }))
            .filter(p => p.majorName && p.middleName);
        const uniqueMiddlePairs = [...new Map(middleChapterPairs.map(p => [`${p.majorName}__${p.middleName}`, p])).values()];
        const uniqueMiddleNames = [...new Set(uniqueMiddlePairs.map(p => p.middleName))];

        // --- 2. 기존 단원/개념 일괄 조회 ---
        const [existingMajors, existingMiddles, existingCoreConcepts] = await Promise.all([
            uniqueMajorNames.length ? db.select().from(schema.majorChaptersTable).where(inArray(schema.majorChaptersTable.name, uniqueMajorNames)) : Promise.resolve([]),
            uniqueMiddleNames.length ? db.select().from(schema.middleChaptersTable).where(inArray(schema.middleChaptersTable.name, uniqueMiddleNames)) : Promise.resolve([]),
            uniqueCoreConceptNames.length ? db.select().from(schema.coreConceptsTable).where(inArray(schema.coreConceptsTable.name, uniqueCoreConceptNames)) : Promise.resolve([]),
        ]);

        // --- 3. 메모리에 이름-ID 맵, (대단원,중단원)-ID 맵 생성 ---
        const majorMap = new Map(existingMajors.map(i => [i.name, i.id]));
        const coreConceptMap = new Map(existingCoreConcepts.map(i => [i.name, i.id]));
        const middleMap = new Map(existingMiddles.map(i => [`${i.major_chapter_id}__${i.name}`, i.id]));

        // --- 4. 새로 생성해야 할 단원/개념 목록 필터링 ---
        const newMajorValues = uniqueMajorNames
            .filter(name => !majorMap.has(name))
            .map(name => ({ id: crypto.randomUUID(), name }));
        
        newMajorValues.forEach(val => majorMap.set(val.name, val.id)); // 새로 생성할 ID도 미리 맵에 추가

        const newMiddleValues = uniqueMiddlePairs
            .filter(pair => !middleMap.has(`${majorMap.get(pair.majorName)}__${pair.middleName}`))
            .map(pair => ({
                id: crypto.randomUUID(),
                name: pair.middleName!,
                major_chapter_id: majorMap.get(pair.majorName)!,
            }));
        
        const newCoreConceptValues = uniqueCoreConceptNames
            .filter(name => !coreConceptMap.has(name))
            .map(name => ({ id: crypto.randomUUID(), name }));

        // --- 5. 새로운 단원/개념들 일괄 INSERT ---
        const newItemsStmts: BatchItem<'sqlite'>[] = [];
        if (newMajorValues.length > 0) newItemsStmts.push(db.insert(schema.majorChaptersTable).values(newMajorValues));
        if (newMiddleValues.length > 0) newItemsStmts.push(db.insert(schema.middleChaptersTable).values(newMiddleValues));
        if (newCoreConceptValues.length > 0) newItemsStmts.push(db.insert(schema.coreConceptsTable).values(newCoreConceptValues));

        if (newItemsStmts.length > 0) {
            await db.batch(newItemsStmts as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }
        
        // 새로 추가된 항목들을 최종 맵에 반영
        newMiddleValues.forEach(val => middleMap.set(`${val.major_chapter_id}__${val.name}`, val.id));
        newCoreConceptValues.forEach(val => coreConceptMap.set(val.name, val.id));

        // --- 6. 문제 데이터 최종 매핑 및 INSERT/UPDATE 목록 생성 ---
        const problemStmts: BatchItem<'sqlite'>[] = [];
        let createdCount = 0;
        let updatedCount = 0;

        for (const problem of problems) {
            const now = new Date().toISOString().replace(/T|Z/g, ' ').trim();
            const majorId = problem.major_chapter_id ? majorMap.get(problem.major_chapter_id) : null;
            
            const problemData = {
                ...problem,
                creator_id: user.id,
                updated_at: now,
                major_chapter_id: majorId,
                middle_chapter_id: (majorId && problem.middle_chapter_id) ? middleMap.get(`${majorId}__${problem.middle_chapter_id}`) || null : null,
                core_concept_id: problem.core_concept_id ? coreConceptMap.get(problem.core_concept_id) : null,
            };

            if (problem.problem_id && !problem.problem_id.startsWith('new-')) { // 'new-'로 시작하는 임시 ID는 업데이트 대상이 아님
                problemStmts.push(db.update(schema.problemTable).set(problemData).where(and(eq(schema.problemTable.problem_id, problem.problem_id), eq(schema.problemTable.creator_id, user.id))));
                updatedCount++;
            } else {
                problemStmts.push(db.insert(schema.problemTable).values({ ...problemData, problem_id: crypto.randomUUID(), created_at: now }));
                createdCount++;
            }
        }
        
        // --- 7. 모든 문제 데이터 일괄 INSERT/UPDATE ---
        if (problemStmts.length > 0) {
            await db.batch(problemStmts as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }

        return c.json({ success: true, created: createdCount, updated: updatedCount });

    } catch (error: any) {
        console.error('Failed to upload/update problems to D1:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({ error: 'D1 데이터베이스 작업에 실패했습니다.', details: errorMessage }, 500);
    }
});


/**
 * PUT /:id - 특정 문제 업데이트
 */
problemRoutes.put('/:id', zValidator('json', updateProblemBodySchema), async (c) => {
    const user = c.get('user');
    const problemId = c.req.param('id');
    const problemData = c.req.valid('json');
    const d1 = c.env.D1_DATABASE;
    const db = drizzle(d1, { schema });

    try {
        const [existingProblem] = await db.select({ major_chapter_id: schema.problemTable.major_chapter_id })
            .from(schema.problemTable)
            .where(and(eq(schema.problemTable.problem_id, problemId), eq(schema.problemTable.creator_id, user.id)));

        if (!existingProblem) {
            return c.json({ error: '문제를 찾을 수 없거나 업데이트할 권한이 없습니다.' }, 404);
        }

        const chapterIds = await ensureChapterAndConceptIdsForPut(db, problemData, existingProblem);
        
        const dataToUpdate: Partial<typeof schema.problemTable.$inferInsert> = {
            ...problemData,
            ...chapterIds,
            updated_at: new Date().toISOString().replace(/T|Z/g, ' ').trim(),
        };
        
        const [updatedProblem] = await db.update(schema.problemTable).set(dataToUpdate).where(and(eq(schema.problemTable.problem_id, problemId), eq(schema.problemTable.creator_id, user.id))).returning();
        
        if (!updatedProblem) {
            return c.json({ error: '문제를 찾을 수 없거나 업데이트할 권한이 없습니다.' }, 404);
        }
        return c.json(updatedProblem);
    } catch (error: any) {
        console.error(`Failed to update problem ${problemId} in D1:`, error.message);
        return c.json({ error: 'D1 데이터베이스 업데이트에 실패했습니다.', details: error.message }, 500);
    }
});

/**
 * DELETE / - 여러 문제 삭제
 */
problemRoutes.delete('/', zValidator('json', deleteProblemsBodySchema), async (c) => {
    const user = c.get('user');
    const { problem_ids } = c.req.valid('json');
    const d1 = c.env.D1_DATABASE;
    const db = drizzle(d1, { schema });

    try {
        const statements: BatchItem<'sqlite'>[] = [
            db.delete(schema.problemTagTable).where(inArray(schema.problemTagTable.problem_id, problem_ids)),
            db.delete(schema.problemTable).where(and(inArray(schema.problemTable.problem_id, problem_ids), eq(schema.problemTable.creator_id, user.id))),
        ];
        
        await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

        return c.json({ message: `${problem_ids.length}개의 문제에 대한 삭제 요청이 처리되었습니다.` }, 200);
    } catch (error: any) {
        console.error(`Failed to delete problems from D1:`, error.message);
        return c.json({ error: 'D1 데이터베이스 삭제 작업에 실패했습니다.', details: error.message }, 500);
    }
});

export default problemRoutes;