import { Hono } from 'hono';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, inArray, sql, asc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';

// --- Zod Schemas ---
const problemSchemaForUpload = z.object({
  problem_id: z.string().optional(),
  question_number: z.number(),
  question_text: z.string(),
  answer: z.string().nullable(),
  solution_text: z.string().nullable(),
  page: z.number().nullable(),
  problem_type: z.enum(schema.problemTypeEnum), 
  grade: z.string(),
  semester: z.string().nullable(),
  source: z.string(),
  major_chapter_id: z.string().nullable(),
  middle_chapter_id: z.string().nullable(),
  core_concept_id: z.string().nullable(),
  problem_category: z.string().nullable(),
  difficulty: z.string(),
  score: z.string(),
});

const uploadProblemsAndCreateSetSchema = z.object({
  problemSetName: z.string().min(1, "문제집 이름은 필수입니다."),
  description: z.string().nullable().optional(),
  problems: z.array(problemSchemaForUpload).min(1, "업로드할 문제가 하나 이상 필요합니다."),
  type: z.enum(schema.problemSetTypeEnum),
  status: z.enum(schema.problemSetStatusEnum),
  copyright_type: z.enum(schema.copyrightTypeEnum),
  copyright_source: z.string().nullable().optional(),
  grade: z.string().optional(),
});

const updateProblemBodySchema = problemSchemaForUpload.omit({ problem_id: true }).partial();
const deleteProblemsBodySchema = z.object({ problem_ids: z.array(z.string()).min(1) });
const getProblemsByIdsSchema = z.object({ problemIds: z.array(z.string()).min(1, "problemIds 배열은 비어있을 수 없습니다.") });


// --- Helper Functions ---
async function ensureSourceId(db: DrizzleD1Database<typeof schema>, sourceName: string): Promise<string> {
    const trimmedName = sourceName?.trim();
    if (!trimmedName) {
        const defaultSource = await db.query.sourcesTable.findFirst({ where: eq(schema.sourcesTable.name, '미지정') });
        if (defaultSource) return defaultSource.id;
        const newId = `src_${crypto.randomUUID()}`;
        await db.insert(schema.sourcesTable).values({ id: newId, name: '미지정' }).onConflictDoNothing();
        const result = await db.query.sourcesTable.findFirst({ where: eq(schema.sourcesTable.name, '미지정') });
        return result!.id;
    }
    const existingSource = await db.query.sourcesTable.findFirst({ where: eq(schema.sourcesTable.name, trimmedName) });
    if (existingSource) return existingSource.id;
    const newId = `src_${crypto.randomUUID()}`;
    await db.insert(schema.sourcesTable).values({ id: newId, name: trimmedName });
    return newId;
}

async function ensureGradeId(db: DrizzleD1Database<typeof schema>, gradeName: string | undefined | null): Promise<string | null> {
    if (!gradeName) return null;
    const grade = await db.query.gradesTable.findFirst({ where: eq(schema.gradesTable.name, gradeName) });
    return grade ? grade.id : null;
}

const transformProblemData = (problem: any) => {
    const { 
        major_chapter_id, majorChapter, 
        middle_chapter_id, middleChapter, 
        core_concept_id, coreConcept, 
        source_id, source, 
        grade_id, grade,
        ...rest 
    } = problem;
    return {
        ...rest,
        source: source?.name ?? '미지정',
        grade: grade?.name ?? '미지정',
        major_chapter_id,
        middle_chapter_id,
        core_concept_id,
        major_chapter_name: majorChapter?.name,
        middle_chapter_name: middleChapter?.name,
        core_concept_name: coreConcept?.name,
    };
};

const crudRoutes = new Hono<AppEnv>();

// --- Routes ---
crudRoutes.post('/upload', zValidator('json', uploadProblemsAndCreateSetSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        const statements: BatchItem<'sqlite'>[] = [];
        const gradeNames = [...new Set(body.problems.map(p => p.grade).filter(Boolean)), body.grade];
        const gradeIdMap = new Map<string, string | null>();
        for (const name of gradeNames) {
            if (name) {
                gradeIdMap.set(name, await ensureGradeId(db, name));
            }
        }
        const newProblemSetId = `pset_${crypto.randomUUID()}`;
        const newSetData = {
            problem_set_id: newProblemSetId,
            creator_id: user.id,
            name: body.problemSetName,
            description: body.description || null,
            type: body.type,
            status: body.status,
            copyright_type: body.copyright_type,
            copyright_source: body.copyright_source || null,
            problem_count: body.problems.length,
            grade_id: body.grade ? gradeIdMap.get(body.grade) ?? null : null,
            cover_image: null,
            published_year: null,
            semester: null,
            avg_difficulty: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        statements.push(db.insert(schema.problemSetTable).values(newSetData));
        const sourceNames = [...new Set(body.problems.map(p => p.source).filter(Boolean))];
        const sourceIdMap = new Map<string, string>();
        for (const name of sourceNames) {
            sourceIdMap.set(name, await ensureSourceId(db, name));
        }
        const sourceCounts = new Map<string, number>();
        body.problems.forEach((problem, index) => {
            const now = new Date().toISOString().replace(/T|Z/g, ' ').trim();
            const { source, problem_id, grade, ...restOfProblem } = problem;
            const newProblemId = `prob_${crypto.randomUUID()}`;
            const problemData = {
                ...restOfProblem,
                grade_id: gradeIdMap.get(grade) ?? null,
                semester: restOfProblem.semester || null,
                problem_category: restOfProblem.problem_category || null,
                problem_id: newProblemId,
                creator_id: user.id,
                created_at: now,
                updated_at: now,
                source_id: sourceIdMap.get(source) || null,
            };
            statements.push(db.insert(schema.problemTable).values(problemData as schema.DbProblem));
            statements.push(db.insert(schema.problemSetProblemsTable).values({ problem_set_id: newProblemSetId, problem_id: newProblemId, order: index + 1 }));
            if (problemData.source_id) {
                sourceCounts.set(problemData.source_id, (sourceCounts.get(problemData.source_id) || 0) + 1);
            }
        });
        for (const [source_id, count] of sourceCounts.entries()) {
             statements.push(db.insert(schema.problemSetSourcesTable).values({ problem_set_id: newProblemSetId, source_id: source_id, count: count }));
        }
        if (statements.length > 0) {
            await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }
        return c.json({ success: true, message: "문제집과 문제가 D1에 성공적으로 생성되었습니다.", problemSet: newSetData }, 201);
    } catch (error: any) {
        console.error('Failed to upload problems and create set in D1:', error);
        return c.json({ error: 'D1 데이터베이스 작업에 실패했습니다.', details: error.cause ? error.cause.message : error.message }, 500);
    }
});

crudRoutes.get('/', async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    try {
        const problemsData = await db.query.problemTable.findMany({
            where: eq(schema.problemTable.creator_id, user.id),
            orderBy: (problem, { asc }) => [asc(problem.created_at)],
            with: {
                source: { columns: { name: true } },
                grade: { columns: { name: true } },
                majorChapter: { columns: { name: true } },
                middleChapter: { columns: { name: true } },
                coreConcept: { columns: { name: true } },
            }
        });
        return c.json(problemsData.map(transformProblemData));
    } catch (error: any) {
        console.error('Failed to fetch problems from D1:', error.message);
        return c.json({ error: 'D1 데이터베이스 조회에 실패했습니다.', details: error.message }, 500);
    }
});

crudRoutes.post('/by-ids', zValidator('json', getProblemsByIdsSchema), async (c) => {
    const { problemIds } = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    try {
        if (problemIds.length === 0) return c.json([]);
        const problemsData = await db.query.problemTable.findMany({
            where: inArray(schema.problemTable.problem_id, problemIds),
            with: {
                source: { columns: { name: true } },
                grade: { columns: { name: true } },
                majorChapter: { columns: { name: true } },
                middleChapter: { columns: { name: true } },
                coreConcept: { columns: { name: true } },
            }
        });
        const problemsMap = new Map(problemsData.map(p => [p.problem_id, p]));
        const orderedProblems = problemIds.map(id => problemsMap.get(id)).filter(Boolean) as (typeof problemsData);
        return c.json(orderedProblems.map(transformProblemData));
    } catch (error: any) {
        console.error('Failed to fetch problems by IDs from D1:', error);
        return c.json({ error: 'D1 데이터베이스 조회에 실패했습니다.', details: error.message }, 500);
    }
});

crudRoutes.put('/:id', zValidator('json', updateProblemBodySchema), async (c) => {
    const user = c.get('user');
    const problemId = c.req.param('id');
    const problemDataFromClient = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    try {
        const { source, grade, ...restOfProblem } = problemDataFromClient;
        let source_id: string | null | undefined = undefined;
        let grade_id: string | null | undefined = undefined;
        if (source) { source_id = await ensureSourceId(db, source); }
        if (grade) { grade_id = await ensureGradeId(db, grade); }
        const dataToUpdate: Partial<schema.DbProblem> = { ...restOfProblem, semester: restOfProblem.semester || null, problem_category: restOfProblem.problem_category || null, updated_at: new Date().toISOString().replace(/T|Z/g, ' ').trim() };
        if(source_id !== undefined) { dataToUpdate.source_id = source_id; }
        if(grade_id !== undefined) { dataToUpdate.grade_id = grade_id; }
        const [updatedProblem] = await db.update(schema.problemTable).set(dataToUpdate).where(and(eq(schema.problemTable.problem_id, problemId), eq(schema.problemTable.creator_id, user.id))).returning({ id: schema.problemTable.problem_id });
        if (!updatedProblem) return c.json({ error: '문제를 찾을 수 없거나 업데이트할 권한이 없습니다.' }, 404);
        const fullUpdatedProblem = await db.query.problemTable.findFirst({ where: eq(schema.problemTable.problem_id, updatedProblem.id), with: { source: { columns: { name: true } }, grade: { columns: { name: true } }, majorChapter: { columns: { name: true } }, middleChapter: { columns: { name: true } }, coreConcept: { columns: { name: true } } } });
        return c.json(transformProblemData(fullUpdatedProblem));
    } catch (error: any) {
        console.error(`Failed to update problem ${problemId} in D1:`, error.message);
        return c.json({ error: 'D1 데이터베이스 업데이트에 실패했습니다.', details: error.message }, 500);
    }
});

crudRoutes.delete('/', zValidator('json', deleteProblemsBodySchema), async (c) => {
    const user = c.get('user');
    const { problem_ids } = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    try {
        const statements: BatchItem<'sqlite'>[] = [
            db.delete(schema.problemTagTable).where(inArray(schema.problemTagTable.problem_id, problem_ids)),
            db.delete(schema.problemCalculationSkillsTable).where(inArray(schema.problemCalculationSkillsTable.problem_id, problem_ids)),
            db.delete(schema.problemSetProblemsTable).where(inArray(schema.problemSetProblemsTable.problem_id, problem_ids)),
            db.delete(schema.problemTable).where(and(inArray(schema.problemTable.problem_id, problem_ids), eq(schema.problemTable.creator_id, user.id))),
        ];
        await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        return c.json({ message: `${problem_ids.length}개의 문제에 대한 삭제 요청이 처리되었습니다.` }, 200);
    } catch (error: any) {
        console.error(`Failed to delete problems from D1:`, error.message);
        return c.json({ error: 'D1 데이터베이스 삭제 작업에 실패했습니다.', details: error.message }, 500);
    }
});

export default crudRoutes;