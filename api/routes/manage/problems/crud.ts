// ./api/routes/manage/problems/crud.ts

import { Hono } from 'hono';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, inArray, sql, asc, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';
import { GRADES_NAME_TO_ID_MAP, GRADES_ID_TO_NAME_MAP } from '../../../shared/curriculum.data'; 

// --- Helper Functions ---

function extractImageKeysFromText(text: string | null, r2PublicUrl: string): string[] {
    if (!text || !r2PublicUrl) return [];
    const urlRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    const matches = text.matchAll(urlRegex);
    const urls = [...matches].map(match => match[1]);
    const keys = urls
        .filter(url => url.startsWith(r2PublicUrl))
        .map(url => url.substring(r2PublicUrl.length).replace(/^\//, ''));
    return [...new Set(keys)];
}

async function ensureSubtitleId(db: DrizzleD1Database<typeof schema>, subtitleName: string): Promise<string> {
    const trimmedName = subtitleName.trim();
    if (!trimmedName) {
        throw new Error("Subtitle name cannot be empty.");
    }

    const existing = await db.query.subtitlesTable.findFirst({
        where: eq(schema.subtitlesTable.name, trimmedName)
    });

    if (existing) {
        return existing.id;
    }

    const newId = `sub_${crypto.randomUUID()}`;
    await db.insert(schema.subtitlesTable).values({ 
        id: newId, 
        name: trimmedName,
        folder_id: null
    });
    
    return newId;
}

const transformProblemData = (problem: any) => {
    const { 
        subtitle_id, subtitle, 
        grade_id,
        problemCalculationSkills,
        ...rest 
    } = problem;
    return {
        ...rest,
        grade_id,
        grade: GRADES_ID_TO_NAME_MAP.get(grade_id) ?? '미지정',
        subtitle: subtitle?.name ?? '미지정',
        calculation_skill_ids: problemCalculationSkills?.map((s: { skill_id: string }) => s.skill_id) || [],
    };
};

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
  subtitle: z.string(),
  major_chapter_id: z.string().nullable(),
  middle_chapter_id: z.string().nullable(),
  core_concept_id: z.string().nullable(),
  problem_category: z.string().nullable(),
  difficulty: z.string(),
  score: z.string(),
  calculation_skill_ids: z.array(z.string()).optional(),
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


const crudRoutes = new Hono<AppEnv>();

crudRoutes.post('/upload', zValidator('json', uploadProblemsAndCreateSetSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    const r2PublicUrl = c.env.R2_PUBLIC_URL;

    if (!r2PublicUrl) {
        return c.json({ error: '서버 설정 오류: R2 공개 URL을 처리할 수 없습니다.' }, 500);
    }

    try {
        const statements: BatchItem<'sqlite'>[] = [];
        
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
            grade_id: body.grade ? (GRADES_NAME_TO_ID_MAP.get(body.grade) ?? null) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        statements.push(db.insert(schema.problemSetTable).values(newSetData));

        const subtitleIdCache = new Map<string, string>();
        const subtitleCounts = new Map<string, number>();

        for (const [index, problem] of body.problems.entries()) {
            const { subtitle, problem_id, grade, calculation_skill_ids, ...restOfProblemDetails } = problem;
            
            if (!subtitle || !subtitle.trim()) {
                return c.json({ error: `${index + 1}번째 문제의 'subtitle' 필드가 비어있습니다.` }, 400);
            }

            const now = new Date().toISOString().replace(/T|Z/g, ' ').trim();
            const newProblemId = `prob_${crypto.randomUUID()}`;
            const grade_id = GRADES_NAME_TO_ID_MAP.get(grade) ?? null;
            if(grade && !grade_id) throw new Error(`유효하지 않은 학년 이름입니다: ${grade}`);
            
            let subtitleId = subtitleIdCache.get(subtitle);
            if (!subtitleId) {
                subtitleId = await ensureSubtitleId(db, subtitle);
                subtitleIdCache.set(subtitle, subtitleId);
            }
            
            const problemData = { 
                ...restOfProblemDetails, 
                grade_id, 
                problem_id: newProblemId, 
                creator_id: user.id, 
                created_at: now, 
                updated_at: now, 
                subtitle_id: subtitleId,
            };
            statements.push(db.insert(schema.problemTable).values(problemData as schema.DbProblem));
            statements.push(db.insert(schema.problemSetProblemsTable).values({ problem_set_id: newProblemSetId, problem_id: newProblemId, order: index + 1 }));

            const imageKeys = extractImageKeysFromText(problemData.question_text, r2PublicUrl);
            if (imageKeys.length > 0) {
                statements.push(db.insert(schema.problemImagesTable).values(imageKeys.map(key => ({ problem_id: newProblemId, image_key: key }))));
            }

            if (calculation_skill_ids && calculation_skill_ids.length > 0) {
                statements.push(db.insert(schema.problemCalculationSkillsTable).values(
                    calculation_skill_ids.map(skill_id => ({ problem_id: newProblemId, skill_id }))
                ));
            }
            
            subtitleCounts.set(subtitleId, (subtitleCounts.get(subtitleId) || 0) + 1);
        }
        
        for (const [subtitle_id, count] of subtitleCounts.entries()) {
             statements.push(db.insert(schema.problemSetSubtitlesTable).values({ problem_set_id: newProblemSetId, subtitle_id: subtitle_id, count: count }));
        }
        
        if (statements.length > 0) {
            await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }
        return c.json({ success: true, message: "문제집과 문제가 D1에 성공적으로 생성되었습니다.", problemSet: newSetData }, 201);
    } catch (error: any) {
        console.error('Failed to upload problems and create set in D1:', error);
        return c.json({ error: 'D1 데이터베이스 작업에 실패했습니다.', details: error.message }, 500);
    }
});

crudRoutes.get('/', async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    try {
        const problemsData = await db.query.problemTable.findMany({
            where: eq(schema.problemTable.creator_id, user.id),
            orderBy: asc(schema.problemTable.created_at),
            with: {
                subtitle: { columns: { name: true } },
                problemCalculationSkills: { columns: { skill_id: true } },
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
                subtitle: { columns: { name: true } },
                problemCalculationSkills: { columns: { skill_id: true } },
            }
        });
        const problemsMap = new Map(problemsData.map(p => [p.problem_id, p]));
        const orderedProblems = problemIds.map(id => problemsMap.get(id)).filter(Boolean);
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
    const r2PublicUrl = c.env.R2_PUBLIC_URL;

    if (!r2PublicUrl) {
        return c.json({ error: '서버 설정 오류: 이미지 URL을 처리할 수 없습니다.' }, 500);
    }

    try {
        await db.transaction(async (tx) => {
            const oldImages = await tx.query.problemImagesTable.findMany({
                where: eq(schema.problemImagesTable.problem_id, problemId),
                columns: { image_key: true }
            });
            const oldKeys = new Set(oldImages.map(img => img.image_key));
            
            const newKeys = new Set(extractImageKeysFromText(problemDataFromClient.question_text || null, r2PublicUrl));
            
            const { subtitle, grade, calculation_skill_ids, ...restOfProblem } = problemDataFromClient;
            
            let subtitle_id: string | null | undefined = undefined;
            if (subtitle !== undefined) {
                 subtitle_id = await ensureSubtitleId(db, subtitle);
            }

            let grade_id: string | null | undefined = undefined;
            if (grade !== undefined) {
                grade_id = GRADES_NAME_TO_ID_MAP.get(grade) ?? null;
                if (grade && !grade_id) throw new Error(`유효하지 않은 학년 이름입니다: ${grade}`);
            }

            const dataToUpdate: Partial<schema.DbProblem> = { ...restOfProblem, updated_at: new Date().toISOString().replace(/T|Z/g, ' ').trim() };
            if (subtitle_id !== undefined) dataToUpdate.subtitle_id = subtitle_id;
            if (grade_id !== undefined) dataToUpdate.grade_id = grade_id;
            
            if (Object.keys(dataToUpdate).length > 1) {
                await tx.update(schema.problemTable).set(dataToUpdate).where(and(eq(schema.problemTable.problem_id, problemId), eq(schema.problemTable.creator_id, user.id)));
            }

            const keysToAdd = [...newKeys].filter(key => !oldKeys.has(key));
            const keysToRemove = [...oldKeys].filter(key => !newKeys.has(key));

            if (keysToRemove.length > 0) {
                await tx.delete(schema.problemImagesTable).where(and(
                    eq(schema.problemImagesTable.problem_id, problemId),
                    inArray(schema.problemImagesTable.image_key, keysToRemove)
                ));
            }
            if (keysToAdd.length > 0) {
                await tx.insert(schema.problemImagesTable).values(
                    keysToAdd.map(key => ({ problem_id: problemId, image_key: key }))
                );
            }

            if (calculation_skill_ids !== undefined) {
                await tx.delete(schema.problemCalculationSkillsTable).where(eq(schema.problemCalculationSkillsTable.problem_id, problemId));
                if (calculation_skill_ids.length > 0) {
                    await tx.insert(schema.problemCalculationSkillsTable).values(
                        calculation_skill_ids.map(skill_id => ({ problem_id: problemId, skill_id }))
                    );
                }
            }
        });

        const fullUpdatedProblem = await db.query.problemTable.findFirst({
            where: eq(schema.problemTable.problem_id, problemId),
            with: {
                subtitle: { columns: { name: true } },
                problemCalculationSkills: { columns: { skill_id: true } },
            }
        });
        
        if (!fullUpdatedProblem || fullUpdatedProblem.creator_id !== user.id) {
             return c.json({ error: '문제를 찾을 수 없거나 업데이트할 권한이 없습니다.' }, 404);
        }

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
    const r2Bucket = c.env.MY_R2_BUCKET;

    if (!r2Bucket) {
        return c.json({ error: '서버 설정 오류: 이미지 저장소를 찾을 수 없습니다.' }, 500);
    }

    try {
        const imagesToDelete = await db.query.problemImagesTable.findMany({
            where: inArray(schema.problemImagesTable.problem_id, problem_ids),
            columns: { image_key: true }
        });
        const uniqueKeysToDelete = [...new Set(imagesToDelete.map(img => img.image_key))];

        if (uniqueKeysToDelete.length > 0) {
            await r2Bucket.delete(uniqueKeysToDelete);
        }
        
        const statements: BatchItem<'sqlite'>[] = [
            db.delete(schema.problemImagesTable).where(inArray(schema.problemImagesTable.problem_id, problem_ids)),
            db.delete(schema.problemTagTable).where(inArray(schema.problemTagTable.problem_id, problem_ids)),
            db.delete(schema.problemCalculationSkillsTable).where(inArray(schema.problemCalculationSkillsTable.problem_id, problem_ids)),
            db.delete(schema.problemSetProblemsTable).where(inArray(schema.problemSetProblemsTable.problem_id, problem_ids)),
            db.delete(schema.problemTable).where(and(inArray(schema.problemTable.problem_id, problem_ids), eq(schema.problemTable.creator_id, user.id))),
        ];

        await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        
        return c.json({ message: `${problem_ids.length}개의 문제 및 관련 데이터에 대한 삭제 요청이 처리되었습니다.` }, 200);
    } catch (error: any) {
        console.error(`Failed to delete problems from D1:`, error.message);
        return c.json({ error: 'D1 데이터베이스 삭제 작업에 실패했습니다.', details: error.message }, 500);
    }
});

export default crudRoutes;