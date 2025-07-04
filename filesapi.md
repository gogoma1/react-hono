----- ./api/db/schema.d1.ts -----
import {
    integer,
    real,
    sqliteTable,
    text,
    primaryKey,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

/**
 * 문제 원본 데이터 테이블 (Cloudflare D1)
 */
export const problemTable = sqliteTable("problem", {
    problem_id: text("problem_id").primaryKey(),
    source: text("source"),
    page: integer("page"),
    question_number: real("question_number"),
    answer: text("answer"),
    problem_type: text("problem_type"),
    grade: text("grade"),
    semester: text("semester"),
    creator_id: text("creator_id").notNull(),
    major_chapter_id: text("major_chapter_id"),
    middle_chapter_id: text("middle_chapter_id"),
    core_concept_id: text("core_concept_id"),
    problem_category: text("problem_category"),
    difficulty: text("difficulty"),
    score: text("score"),
    question_text: text("question_text"),
    solution_text: text("solution_text"),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});

/**
 * 문제집 정보 테이블 (Cloudflare D1)
 */
export const problemSetTable = sqliteTable("problem_set", {
    problem_set_id: text("problem_set_id").primaryKey(),
    name: text("name").notNull(),
    grade: text("grade"),
    semester: text("semester"),
    avg_difficulty: text("avg_difficulty"),
    cover_image: text("cover_image"),
    description: text("description"),
    published_year: integer("published_year"),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});

/**
 * 대단원 정보 테이블 (Cloudflare D1)
 */
export const majorChaptersTable = sqliteTable("major_chapters", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
});

/**
 * 중단원 정보 테이블 (Cloudflare D1)
 */
export const middleChaptersTable = sqliteTable("middle_chapters", {
    id: text("id").primaryKey(),
    major_chapter_id: text("major_chapter_id").notNull(),
    name: text("name").notNull(),
}, (table) => ({
    unq: uniqueIndex('middle_chapters_major_id_name_unq').on(table.major_chapter_id, table.name),
}));

/**
 * 핵심 개념 정보 테이블 (Cloudflare D1)
 */
export const coreConceptsTable = sqliteTable("core_concepts", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
});

/**
 * 태그 정보 테이블 (Cloudflare D1)
 */
export const tagTable = sqliteTable("tag", {
    tag_id: text("tag_id").primaryKey(),
    name: text("name").notNull().unique(),
    tag_type: text("tag_type"),
});

/**
 * 문제와 태그의 다대다 관계를 위한 연결 테이블 (Cloudflare D1)
 */
export const problemTagTable = sqliteTable("problem_tag", {
    problem_id: text("problem_id").notNull(),
    tag_id: text("tag_id").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_id, table.tag_id] }),
}));


export const problemRelations = relations(problemTable, ({ one, many }) => ({
    majorChapter: one(majorChaptersTable, {
        fields: [problemTable.major_chapter_id],
        references: [majorChaptersTable.id],
    }),
    middleChapter: one(middleChaptersTable, {
        fields: [problemTable.middle_chapter_id],
        references: [middleChaptersTable.id],
    }),
    coreConcept: one(coreConceptsTable, {
        fields: [problemTable.core_concept_id],
        references: [coreConceptsTable.id],
    }),
    problemTags: many(problemTagTable),
}));

export const tagRelations = relations(tagTable, ({ many }) => ({
    problemTags: many(problemTagTable),
}));

export const problemTagRelations = relations(problemTagTable, ({ one }) => ({
    problem: one(problemTable, {
        fields: [problemTagTable.problem_id],
        references: [problemTable.problem_id],
    }),
    tag: one(tagTable, {
        fields: [problemTagTable.tag_id],
        references: [tagTable.tag_id],
    }),
}));


export type DbProblem = typeof problemTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbMajorChapter = typeof majorChaptersTable.$inferSelect;
export type DbMiddleChapter = typeof middleChaptersTable.$inferSelect;
export type DbCoreConcept = typeof coreConceptsTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;
----- ./api/db/schema.pg.ts -----
import {
    integer,
    real,
    pgTable,
    text,
    timestamp,
    uuid,
    pgEnum,
    date,
    jsonb,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);
export const examAssignmentStatusEnum = pgEnum('exam_assignment_status_enum', ['not_started', 'in_progress', 'completed', 'graded', 'expired']);



/**
 * 사용자 프로필 테이블 (인증 시스템과 연동)
 */
export const profilesTable = pgTable("profiles", {
    id: uuid("id").primaryKey(), // Supabase auth.users.id 참조
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    position: text("position").notNull(),
    academy_name: text("academy_name").notNull(),
    region: text("region").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 학생 정보 테이블
 */
export const studentsTable = pgTable("students", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    principal_id: uuid("principal_id").references(() => profilesTable.id, { onDelete: 'set null' }),
    student_name: text("student_name").notNull(),
    grade: text("grade").notNull(),
    status: studentStatusEnum("status").notNull(),
    subject: text("subject").notNull(),
    tuition: integer("tuition"),
    admission_date: date("admission_date"),
    discharge_date: date("discharge_date"),
    student_phone: text("student_phone"),
    guardian_phone: text("guardian_phone"),
    school_name: text("school_name"),
    class_name: text("class_name"),
    teacher: text("teacher"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 선생님이 생성한 개별 시험지 세트 정보 테이블
 */
export const examSetsTable = pgTable("exam_sets", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    title: text("title").notNull(),
    problem_ids: jsonb("problem_ids").$type<string[]>().notNull(), // D1에 저장된 문제들의 ID 목록
    header_info: jsonb("header_info"), //exam-header-title의 text 내용
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 시험지 할당 정보 테이블 (학생과 시험지 세트 연결)
 */
export const examAssignmentsTable = pgTable("exam_assignments", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    exam_set_id: uuid("exam_set_id").notNull().references(() => examSetsTable.id, { onDelete: 'cascade' }),
    student_id: uuid("student_id").notNull().references(() => studentsTable.id, { onDelete: 'cascade' }),
    status: examAssignmentStatusEnum("status").default('not_started').notNull(),
    correct_rate: real("correct_rate"),
    total_pure_time_seconds: integer("total_pure_time_seconds"),
    assigned_at: timestamp("assigned_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    started_at: timestamp("started_at", { mode: "date", withTimezone: true }),
    completed_at: timestamp("completed_at", { mode: "date", withTimezone: true }),
}, (table) => ({
    unqExamStudent: sql`UNIQUE (${table.exam_set_id}, ${table.student_id})`,
}));

/**
 * 사용자 구매 정보 테이블 (권한 관리용)
 */
export const userPurchaseTable = pgTable("user_purchase", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    problem_set_id: text("problem_set_id"),
    purchase_date: timestamp("purchase_date", { mode: "date", withTimezone: true }),
    purchase_price: integer("purchase_price"),
    license_period: integer("license_period"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});


export const examAssignmentsRelations = relations(examAssignmentsTable, ({ one }) => ({
    examSet: one(examSetsTable, {
        fields: [examAssignmentsTable.exam_set_id],
        references: [examSetsTable.id],
    }),
    student: one(studentsTable, {
        fields: [examAssignmentsTable.student_id],
        references: [studentsTable.id],
    }),
}));

export type DbProfile = typeof profilesTable.$inferSelect;
export type DbStudent = typeof studentsTable.$inferSelect;
export type DbExamSet = typeof examSetsTable.$inferSelect;
export type DbExamAssignment = typeof examAssignmentsTable.$inferSelect;
export type DbUserPurchase = typeof userPurchaseTable.$inferSelect;
----- ./api/index.ts -----

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import profileRoutes from './routes/profiles/profiles';
import studentRoutes from './routes/manage/student';
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import problemRoutes from './routes/manage/problems';
import r2ImageRoutes from './routes/r2/image';
import examRoutes from './routes/exam/examlogs';
import mobileExamRoutes from './routes/exam/exam.mobile';

export type AppEnv = {
    Bindings: Env;
    Variables: {
        supabase: import('@supabase/supabase-js').SupabaseClient;
        user: import('@supabase/supabase-js').User;
        session: import('@supabase/supabase-js').Session;
    }
}

const app = new Hono<AppEnv>().basePath('/api');

app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = ['http://localhost:5173', 'https://your-production-domain.com'];
    if (allowedOrigins.includes(origin)) return origin;
    return null;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Apikey'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(supabaseMiddleware());

app.route('/profiles', profileRoutes); 
app.route('/manage/student', studentRoutes);
app.route('/manage/problems', problemRoutes); 
app.route('/r2', r2ImageRoutes);

app.route('/exam', examRoutes);

app.route('/exam/mobile', mobileExamRoutes); 



app.get('/', (c) => c.text('Hono API is running!'));

export default app;
----- ./api/routes/exam/exam.mobile.ts -----
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problemIds: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  studentIds: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  headerInfo: z.record(z.any()).nullable().optional(),
});

const mobileExamRoutes = new Hono<AppEnv>();

/**
 * [핵심 기능] POST /api/exam/mobile/sets - 새로운 모바일 시험지 세트 생성 및 학생들에게 할당
 */
mobileExamRoutes.post(
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
          problem_ids: body.problemIds,
          header_info: body.headerInfo, // null 또는 객체가 들어옴
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        const assignments = body.studentIds.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { examSetId: newExamSet.id, assignedCount: assignments.length };
      });

      return c.json({ 
        message: `${result.assignedCount}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
        ...result 
      }, 201);

    } catch (error: any) {
      console.error('Failed to publish mobile exam set:', error);
      return c.json({ error: '모바일 시험지 출제 중 오류가 발생했습니다.' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
  }
);

export default mobileExamRoutes;
----- ./api/routes/exam/examlogs.ts -----
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
  problemIds: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  studentIds: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  headerInfo: z.record(z.any()).optional(),
});

const submitAssignmentSchema = z.object({
  examStartTime: z.string().datetime(),
  examEndTime: z.string().datetime(),
  totalPureTimeSeconds: z.number().int().nonnegative(),
  correctRate: z.number().min(0).max(100).nullable(),
  problemLogs: z.array(z.object({
    problemId: z.string(),
    timeTakenSeconds: z.number().int().nonnegative(),
    finalAnswer: z.any().optional(),
    finalStatus: z.enum(['A', 'B', 'C', 'D']).optional(), 
    isModified: z.boolean(),
    answerHistory: z.array(z.any()),
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
          problem_ids: body.problemIds,
          header_info: body.headerInfo,
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        const assignments = body.studentIds.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { examSetId: newExamSet.id, assignedCount: assignments.length };
      });

      return c.json({ 
        message: `${result.assignedCount}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
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
        const [updatedAssignment] = await db.update(schema.examAssignmentsTable)
            .set({
                status: body.correctRate === null ? 'completed' : 'graded',
                started_at: new Date(body.examStartTime),
                completed_at: new Date(body.examEndTime),
                total_pure_time_seconds: body.totalPureTimeSeconds,
                correct_rate: body.correctRate,
            })
            .where(and(
                eq(schema.examAssignmentsTable.id, assignmentId),
                eq(schema.examAssignmentsTable.student_id, user.id)
            ))
            .returning({ id: schema.examAssignmentsTable.id });

        if (!updatedAssignment) {
            return c.json({ error: '유효하지 않은 시험이거나 제출 권한이 없습니다.' }, 404);
        }

    } catch (error) {
        console.error('Failed to update assignment status:', error);
        return c.json({ error: '시험 상태 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }

    c.executionCtx.waitUntil((async () => {
        try {
            const bucket = logBucket; // <- 미리 확인한 버킷 변수 사용

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
----- ./api/routes/manage/problems.ts -----
import { Hono } from 'hono';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, inArray, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.d1';

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

async function ensureChapterAndConceptIdsForPut(
    db: DrizzleD1Database<typeof schema>,
    data: { major_chapter_id?: string | null, middle_chapter_id?: string | null, core_concept_id?: string | null },
    existingProblem?: { major_chapter_id: string | null }
) {
    const result: { major_chapter_id?: string, middle_chapter_id?: string, core_concept_id?: string } = {};
    let finalMajorChapterId = existingProblem?.major_chapter_id;

    if (data.major_chapter_id) {
        await db.insert(schema.majorChaptersTable).values({ id: crypto.randomUUID(), name: data.major_chapter_id }).onConflictDoNothing();
        const [item] = await db.select({ id: schema.majorChaptersTable.id }).from(schema.majorChaptersTable).where(eq(schema.majorChaptersTable.name, data.major_chapter_id));
        if (item) {
            result.major_chapter_id = item.id;
            finalMajorChapterId = item.id;
        }
    }

    if (data.middle_chapter_id && finalMajorChapterId) {
        await db.insert(schema.middleChaptersTable).values({ id: crypto.randomUUID(), name: data.middle_chapter_id, major_chapter_id: finalMajorChapterId }).onConflictDoNothing();
        const [item] = await db.select({ id: schema.middleChaptersTable.id }).from(schema.middleChaptersTable).where(and(eq(schema.middleChaptersTable.name, data.middle_chapter_id), eq(schema.middleChaptersTable.major_chapter_id, finalMajorChapterId)));
        if (item) {
            result.middle_chapter_id = item.id;
        }
    }

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
        const uniqueMajorNames = [...new Set(problems.map(p => p.major_chapter_id).filter(Boolean))];
        const uniqueCoreConceptNames = [...new Set(problems.map(p => p.core_concept_id).filter(Boolean))];
        const middleChapterPairs = problems
            .map(p => ({ majorName: p.major_chapter_id, middleName: p.middle_chapter_id }))
            .filter(p => p.majorName && p.middleName);
        const uniqueMiddlePairs = [...new Map(middleChapterPairs.map(p => [`${p.majorName}__${p.middleName}`, p])).values()];
        const uniqueMiddleNames = [...new Set(uniqueMiddlePairs.map(p => p.middleName))];

        const [existingMajors, existingMiddles, existingCoreConcepts] = await Promise.all([
            uniqueMajorNames.length ? db.select().from(schema.majorChaptersTable).where(inArray(schema.majorChaptersTable.name, uniqueMajorNames)) : Promise.resolve([]),
            uniqueMiddleNames.length ? db.select().from(schema.middleChaptersTable).where(inArray(schema.middleChaptersTable.name, uniqueMiddleNames)) : Promise.resolve([]),
            uniqueCoreConceptNames.length ? db.select().from(schema.coreConceptsTable).where(inArray(schema.coreConceptsTable.name, uniqueCoreConceptNames)) : Promise.resolve([]),
        ]);

        const majorMap = new Map(existingMajors.map(i => [i.name, i.id]));
        const coreConceptMap = new Map(existingCoreConcepts.map(i => [i.name, i.id]));
        const middleMap = new Map(existingMiddles.map(i => [`${i.major_chapter_id}__${i.name}`, i.id]));

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

        const newItemsStmts: BatchItem<'sqlite'>[] = [];
        if (newMajorValues.length > 0) newItemsStmts.push(db.insert(schema.majorChaptersTable).values(newMajorValues));
        if (newMiddleValues.length > 0) newItemsStmts.push(db.insert(schema.middleChaptersTable).values(newMiddleValues));
        if (newCoreConceptValues.length > 0) newItemsStmts.push(db.insert(schema.coreConceptsTable).values(newCoreConceptValues));

        if (newItemsStmts.length > 0) {
            await db.batch(newItemsStmts as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        }
        
        newMiddleValues.forEach(val => middleMap.set(`${val.major_chapter_id}__${val.name}`, val.id));
        newCoreConceptValues.forEach(val => coreConceptMap.set(val.name, val.id));

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
----- ./api/routes/manage/student.ts -----
import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


const createStudentBodySchema = z.object({
  student_name: z.string().min(1),
  grade: z.string().min(1),
  status: z.enum(schema.studentStatusEnum.enumValues),
  subject: z.string().min(1),
  tuition: z.union([z.string(), z.number()]).transform(val => Number(val)).pipe(z.number().nonnegative()),
  admission_date: z.string().nullable().optional(),
  student_phone: z.string().nullable().optional(),
  guardian_phone: z.string().nullable().optional(),
  school_name: z.string().nullable().optional(),
  class_name: z.string().nullable().optional(), // `class`는 예약어이므로 `class_name` 사용
  teacher: z.string().nullable().optional(),
});
type CreateStudentInput = z.infer<typeof createStudentBodySchema>;

const updateStudentBodySchema = createStudentBodySchema.partial().extend({
    discharge_date: z.string().nullable().optional(),
});
type UpdateStudentInput = z.infer<typeof updateStudentBodySchema>;

const bulkUpdateStatusBodySchema = z.object({
    ids: z.array(z.string().uuid()),
    status: z.enum(schema.studentStatusEnum.enumValues),
});

const bulkDeleteBodySchema = z.object({
    ids: z.array(z.string().uuid()),
});



const studentRoutes = new Hono<AppEnv>();

studentRoutes.get('/', async (c) => {
    const user = c.get('user')!;
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const students = await db.query.studentsTable.findMany({
            where: eq(schema.studentsTable.principal_id, user.id),
            orderBy: (students, { asc }) => [asc(students.student_name)],
        });
        return c.json(students);
    } catch (error: any) {
        console.error('Failed to fetch students:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/', zValidator('json', createStudentBodySchema), async (c) => {
    const user = c.get('user')!;
    const validatedData = c.req.valid('json') as CreateStudentInput;
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const [newStudent] = await db.insert(schema.studentsTable)
            .values({ ...validatedData, principal_id: user.id })
            .returning();
        if (!newStudent) throw new Error('Student creation failed, no data returned.');
        return c.json(newStudent, 201);
    } catch (error: any) {
        console.error('Failed to create student:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/bulk-update-status', zValidator('json', bulkUpdateStatusBodySchema), async (c) => {
    const user = c.get('user')!;
    const { ids, status } = c.req.valid('json');

    if (!ids || ids.length === 0) {
        return c.json({ error: 'No student IDs provided' }, 400);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const updatedStudents = await db.update(schema.studentsTable)
            .set({ status: status, updated_at: new Date() })
            .where(and(
                inArray(schema.studentsTable.id, ids),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning();

        return c.json(updatedStudents);
    } catch (error: any) {
        console.error('Failed to bulk update student status:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/bulk-delete', zValidator('json', bulkDeleteBodySchema), async (c) => {
    const user = c.get('user')!;
    const { ids } = c.req.valid('json');
    
    if (!ids || ids.length === 0) {
        return c.json({ error: 'No student IDs provided' }, 400);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
        const deletedStudents = await db.update(schema.studentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(and(
                inArray(schema.studentsTable.id, ids),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning({ id: schema.studentsTable.id });
            
        return c.json({ message: 'Students marked as deleted successfully', deletedIds: deletedStudents.map(s => s.id) });
    } catch (error: any) {
        console.error('Failed to bulk delete students:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.put('/:id', zValidator('json', updateStudentBodySchema), async (c) => {
    const user = c.get('user')!;
    const studentId = c.req.param('id');
    const validatedData = c.req.valid('json') as UpdateStudentInput;
    if (Object.keys(validatedData).length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
    }
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const [updatedStudent] = await db.update(schema.studentsTable)
            .set({ ...validatedData, updated_at: new Date() })
            .where(and(
                eq(schema.studentsTable.id, studentId),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning();
        if (!updatedStudent) {
            return c.json({ error: 'Student not found or not authorized to update' }, 404);
        }
        return c.json(updatedStudent);
    } catch (error: any) {
        console.error('Failed to update student:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.delete('/:id', async (c) => {
    const user = c.get('user')!;
    const studentId = c.req.param('id');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

        const [softDeletedStudent] = await db.update(schema.studentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(and(
                eq(schema.studentsTable.id, studentId),
                eq(schema.studentsTable.principal_id, user.id)
            ))
            .returning({ id: schema.studentsTable.id });

        if (!softDeletedStudent) {
            return c.json({ error: 'Student not found or not authorized to delete' }, 404);
        }
        return c.json({ message: 'Student deleted successfully', id: softDeletedStudent.id });

    } catch (error: any) {
        console.error('Failed to soft delete student:', error.message);
        return c.json({ error: 'Database query failed' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default studentRoutes;
----- ./api/routes/middleware/auth.middleware.ts -----
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { setCookie } from 'hono/cookie'

declare module 'hono' {
  interface ContextVariableMap {
    supabase: SupabaseClient
  }
}

export const getSupabase = (c: Context) => {
  return c.get('supabase')
}

type SupabaseEnv = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c);
    const supabaseUrl = supabaseEnv.SUPABASE_URL;
    const supabaseAnonKey = supabaseEnv.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL missing!');
    }
    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY missing!');
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => setCookie(c, name, value, options));
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user in supabaseMiddleware:', error.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('supabase', supabase);
    c.set('user', user); // 사용자 정보를 Context에 저장

    await next();
  };
};
----- ./api/routes/profiles/profiles.ts -----
import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'; // Zod 유효성 검사기 import

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg'; // 스키마 전체를 가져옵니다.

const POSITIONS = ['학생', '원장', '강사', '학부모'] as const;

const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});


const profileRoutes = new Hono<AppEnv>();

profileRoutes.get('/exists', async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const sql = postgres(c.env.HYPERDRIVE.connectionString);
  const db = drizzle(sql, { schema });

  try {
    const profile = await db.query.profilesTable.findFirst({
      where: eq(schema.profilesTable.id, user.id),
      columns: { id: true },
    });
    return c.json({ success: true, exists: !!profile });
  } catch (error: any) {
    console.error('Failed to check profile existence:', error.message);
    return c.json({ success: false, error: 'Database query failed' }, 500);
  } finally {
    c.executionCtx.waitUntil(sql.end());
  }
});


profileRoutes.post(
  '/setup',
  zValidator('json', profileSetupSchema, (result, c) => {
    if (!result.success) {
      console.error('Validation failed:', result.error.flatten());
      return c.json({ error: 'Invalid input', details: result.error.flatten().fieldErrors }, 400);
    }
  }),
  async (c) => {
    const user = c.get('user');
    const { name, position, academyName, region } = c.req.valid('json');

    if (!user?.id || !user?.email) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
      const newProfile = await db.insert(schema.profilesTable).values({
        id: user.id, // 인증된 사용자의 UUID
        email: user.email, // 인증된 사용자의 이메일
        name: name,
        position: position,
        academy_name: academyName, // 프론트의 camelCase를 DB의 snake_case에 매핑
        region: region,
      })
      .returning({ // 삽입된 데이터 중 id를 반환받아 확인
        insertedId: schema.profilesTable.id 
      });

      if (newProfile.length === 0) {
        throw new Error('Profile insertion failed, no data returned.');
      }
      
      console.log(`New profile created for user: ${newProfile[0].insertedId}`);

      return c.json({ success: true, profileId: newProfile[0].insertedId }, 201); // 201 Created 상태 코드 사용

    } catch (error: any) {
      console.error('Failed to create profile:', error.message);
      if (error.code === '23505') { // PostgreSQL unique_violation 에러 코드
        return c.json({ error: 'Profile for this user already exists.' }, 409); // 409 Conflict
      }
      return c.json({ error: 'Database query failed' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
  }
);


export default profileRoutes;
----- ./api/routes/r2/image.ts -----
import { Hono } from 'hono';
import type { AppEnv } from '../../index'; // 메인 index.ts의 AppEnv 타입을 가져옵니다.

const r2ImageRoutes = new Hono<AppEnv>();

/**
 * POST /api/r2/upload - 이미지 파일을 R2에 업로드
 * Supabase 미들웨어에 의해 인증된 사용자만 접근 가능합니다.
 */
r2ImageRoutes.post('/upload', async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "인증되지 않은 사용자입니다." }, 401);
    }

    const bucket = c.env.MY_R2_BUCKET;
    const publicUrlBase = c.env.R2_PUBLIC_URL; // "R2_PUBLIC_URL" 사용

    if (!bucket) {
        console.error('R2 버킷 바인딩(MY_R2_BUCKET)이 설정되지 않았습니다.');
        return c.json({ error: '서버 설정 오류: R2 버킷을 찾을 수 없습니다.' }, 500);
    }
    if (!publicUrlBase) {
        console.error('R2_PUBLIC_URL 환경 변수가 설정되지 않았습니다.');
        return c.json({ error: '서버 설정 오류: R2 공개 URL을 찾을 수 없습니다.' }, 500);
    }

    try {
        const formData = await c.req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return c.json({ error: '파일이 요청에 포함되지 않았거나 올바른 파일 형식이 아닙니다.' }, 400);
        }
        
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            return c.json({ error: `파일 크기는 ${maxFileSize / 1024 / 1024}MB를 초과할 수 없습니다.` }, 413);
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return c.json({ error: '허용되지 않는 이미지 파일 형식입니다. (JPEG, PNG, GIF, WEBP 허용)' }, 415);
        }
        
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension) {
            return c.json({ error: '파일 확장자를 확인할 수 없습니다.' }, 400);
        }

        const uniqueKey = `${crypto.randomUUID()}.${fileExtension}`;
        await bucket.put(uniqueKey, file.stream(), {
            httpMetadata: { contentType: file.type },
            customMetadata: { userId: user.id } // ⭐ 중요: 파일 소유자 ID를 메타데이터에 저장
        });

        console.log(`사용자 ${user.id}가 파일 업로드 성공: ${uniqueKey}`);

        const separator = publicUrlBase.endsWith('/') ? '' : '/';
        const fileUrl = `${publicUrlBase}${separator}${uniqueKey}`;

        return c.json({
            message: '파일 업로드 성공',
            key: uniqueKey, // 클라이언트가 나중에 삭제 요청 시 사용할 키
            url: fileUrl,
        }, 201);

    } catch (error: unknown) {
        console.error('파일 업로드 중 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return c.json({ error: `파일 업로드 중 오류가 발생했습니다: ${errorMessage}` }, 500);
    }
});

/**
 * DELETE /api/r2/delete - R2 객체 삭제
 * 요청 본문에 { "key": "..." } 형식으로 삭제할 파일의 키를 포함해야 합니다.
 */
r2ImageRoutes.delete('/delete', async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "인증되지 않은 사용자입니다." }, 401);
    }
    
    const bucket = c.env.MY_R2_BUCKET;
    if (!bucket) {
        return c.json({ error: '서버 설정 오류: R2 버킷을 찾을 수 없습니다.' }, 500);
    }

    try {
        const { key: keyToDelete } = await c.req.json<{ key: string }>();
        if (!keyToDelete || typeof keyToDelete !== 'string') {
            return c.json({ error: "요청 본문에 유효한 'key' 속성(문자열)이 필요합니다." }, 400);
        }

        const headResult = await bucket.head(keyToDelete);

        if (!headResult) {
            return c.json({ message: '삭제할 객체를 찾을 수 없거나 이미 삭제되었습니다.' }, 404);
        }

        if (headResult.customMetadata?.userId !== user.id) {
            console.warn(`권한 없는 삭제 시도: 사용자 ${user.id}가 ${headResult.customMetadata?.userId} 소유의 키 ${keyToDelete} 삭제 시도`);
            return c.json({ error: '이 객체를 삭제할 권한이 없습니다.' }, 403); // 403 Forbidden
        }

        await bucket.delete(keyToDelete);
        console.log(`사용자 ${user.id}가 객체 삭제 성공: ${keyToDelete}`);

        return c.json({ message: '객체가 성공적으로 삭제되었습니다.' }, 200);

    } catch (error: unknown) {
        console.error('객체 삭제 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return c.json({ error: `객체 삭제 중 오류가 발생했습니다: ${errorMessage}` }, 500);
    }
});


export default r2ImageRoutes;
