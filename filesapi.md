----- ./api/db/schema.pg.ts -----
import {
    boolean,
    integer,
    real,
    pgTable,
    text,
    timestamp,
    uuid,
    pgEnum,
    date,
    primaryKey, // problem_tag_table 복합 PK 예시용 (현재는 단일 uuid id 사용)
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm"; // raw SQL 사용 및 default 값 설정용

export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);


/**
 * 사용자 프로필 테이블.
 * id는 외부 인증 시스템(예: Supabase의 auth.users 테이블)의 사용자 ID를 참조합니다.
 * 이 테이블의 레코드는 사용자가 인증 시스템에 등록된 후, 추가 프로필 정보를 입력할 때 생성됩니다.
 */
export const profilesTable = pgTable("profiles", {
    id: uuid("id").primaryKey(),

    email: text("email").notNull().unique(),

    name: text("name").notNull(), // 사용자가 설정하는 프로필 이름
    position: text("position").notNull(), // 예: 학생, 원장, 강사, 학부모
    academy_name: text("academy_name").notNull(),
    region: text("region").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const studentsTable = pgTable("students", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`), // 학생 고유 ID
    tuition: integer("tuition"), // 수강료
    admission_date: date("admission_date"), // 입학일 (YYYY-MM-DD)
    discharge_date: date("discharge_date"), // 퇴학일 (YYYY-MM-DD)
    principal_id: uuid("principal_id").references(() => profilesTable.id, { onDelete: 'set null' }),
    grade: text("grade").notNull(), // 학년
    student_phone: text("student_phone"), // 학생 연락처
    guardian_phone: text("guardian_phone"), // 보호자 연락처
    school_name: text("school_name"), // 학교명
    class_name: text("class_name"), // 반 이름 (SQL 예약어 'class' 회피)
    student_name: text("student_name").notNull(), // 학생 이름
    teacher: text("teacher"), // 담당 강사 (profilesTable.id 참조 가능 또는 텍스트)
    status: studentStatusEnum("status").notNull(), // 학생 상태 (재원, 휴원, 퇴원)
    subject: text("subject").notNull(), // 주요 과목
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemSetTable = pgTable("problem_set", {
    problem_set_id: uuid("problem_set_id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    grade: text("grade"), // 대상 학년
    semester: text("semester"), // 대상 학기
    avg_difficulty: text("avg_difficulty"), // 평균 난이도 (텍스트 또는 numeric/real 타입 고려)
    cover_image: text("cover_image"), // 표지 이미지 URL
    description: text("description"), // 설명
    published_year: integer("published_year"), // 출판 연도
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const majorChaptersTable = pgTable("major_chapters", { // 대단원
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 대단원명
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const middleChaptersTable = pgTable("middle_chapters", { // 중단원
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    major_chapter_id: uuid("major_chapter_id").notNull().references(() => majorChaptersTable.id, { onDelete: 'cascade' }), // 대단원 ID 참조
    name: text("name").notNull(), // 중단원명 (대단원 내에서 unique할 수도 있음)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const coreConceptsTable = pgTable("core_concepts", { // 핵심 개념
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 핵심 개념명
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemTable = pgTable("problem", {
    problem_id: uuid("problem_id").primaryKey().default(sql`gen_random_uuid()`),
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'set null' }), // 문제집 ID 참조
    source: text("source"), // 출처 (예: 문제집명, 모의고사명)
    page: integer("page"), // 페이지 번호
    question_number: real("question_number"), // 문제 번호 (소수점 가능, 예: 3.1)
    answer: text("answer"), // 정답
    problem_type: text("problem_type"), // 문제 유형 (예: 객관식, 주관식)
    grade: text("grade"), // grade_level -> grade 로 이름 변경 (studentsTable과 통일)
    semester: text("semester"),
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'restrict' }), // restrict: 출제자 프로필 삭제 시 문제 삭제 방지 (정책에 따라 cascade, set null 등)
    major_chapter_id: uuid("major_chapter_id").references(() => majorChaptersTable.id, { onDelete: 'set null' }), // 대단원 ID 참조
    middle_chapter_id: uuid("middle_chapter_id").references(() => middleChaptersTable.id, { onDelete: 'set null' }), // 중단원 ID 참조
    core_concept_id: uuid("core_concept_id").references(() => coreConceptsTable.id, { onDelete: 'set null' }), // 핵심 개념 ID 참조
    problem_category: text("problem_category"), // 문제 카테고리
    difficulty: text("difficulty"), // 난이도 (텍스트 또는 numeric/real 타입 고려)
    score: text("score"),           // 배점 (텍스트 또는 numeric/real 타입 고려)
    question_text: text("question_text"), // 문제 본문 (긴 텍스트)
    solution_text: text("solution_text"), // 해설 (긴 텍스트)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemRelations = relations(problemTable, ({ one }) => ({
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
    creator: one(profilesTable, {
        fields: [problemTable.creator_id],
        references: [profilesTable.id],
    }),
}));

export const tagTable = pgTable("tag", {
    tag_id: uuid("tag_id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 태그명
    tag_type: text("tag_type"), // 태그 유형 (예: 개념, 유형, 출처)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemTagTable = pgTable("problem_tag", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // 연결 테이블 자체의 고유 ID
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), // 문제 ID 참조
    tag_id: uuid("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }), // 태그 ID 참조
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => {
    return {
        unqProblemTag: sql`UNIQUE (${table.problem_id}, ${table.tag_id})`,
    };
});

export const userPurchaseTable = pgTable("user_purchase", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }), // 사용자 삭제 시 구매 내역도 삭제 (정책에 따라)
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'set null' }), // 구매한 문제집 ID (문제집 삭제 시 null로 설정)
    purchase_date: timestamp("purchase_date", { mode: "date", withTimezone: true }), // 구매일
    purchase_price: integer("purchase_price"), // 구매 가격
    license_period: integer("license_period"), // 라이선스 기간 (예: 일 단위)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const userProblemLogTable = pgTable("user_problem_log", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    problem_id: uuid("problem_id").references(() => problemTable.problem_id, { onDelete: 'cascade' }), // 푼 문제 ID (문제 삭제 시 로그도 삭제)
    is_correct: boolean("is_correct"), // 정답 여부
    a_solved: boolean("a_solved").default(false).notNull(), // (분석용 플래그)
    q_unknown: boolean("q_unknown").default(false).notNull(), // (분석용 플래그)
    t_think: boolean("t_think").default(false).notNull(), // (분석용 플래그)
    qt_failed: boolean("qt_failed").default(false).notNull(), // (분석용 플래그)
    time_taken: integer("time_taken"), // 문제 풀이 시간 (예: 초 단위)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`), // 풀이 시점
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemStatsTable = pgTable("problem_stats", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // 통계 레코드 자체의 ID
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }), // 통계 대상 문제집 (선택적)
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), // 통계 대상 문제 ID
    attempt_count: integer("attempt_count").default(0).notNull(), // 시도 횟수
    correct_count: integer("correct_count").default(0).notNull(), // 정답 횟수
    wrong_rate: real("wrong_rate"), // 오답률 (계산된 값, numeric(정밀도, 스케일) 타입 고려)
    avg_time: integer("avg_time"), // 평균 풀이 시간 (예: 초 단위)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => {
    return {
        unqProblemStats: sql`UNIQUE (${table.problem_id})`, // 문제별 통계는 하나만 존재
    };
});

export type DbProfile = typeof profilesTable.$inferSelect;
export type DbStudent = typeof studentsTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbMajorChapter = typeof majorChaptersTable.$inferSelect;
export type DbMiddleChapter = typeof middleChaptersTable.$inferSelect;
export type DbCoreConcept = typeof coreConceptsTable.$inferSelect;
export type DbProblem = typeof problemTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;
export type DbUserPurchase = typeof userPurchaseTable.$inferSelect;
export type DbUserProblemLog = typeof userProblemLogTable.$inferSelect;
export type DbProblemStats = typeof problemStatsTable.$inferSelect;
----- ./api/index.ts -----

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import profileRoutes from './routes/profiles/profiles';
import exampleRoute from './routes/example/selectpg_tables';
import studentRoutes from './routes/manage/student';
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import problemRoutes from './routes/manage/problems';
import r2ImageRoutes from './routes/r2/image';

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

app.route('/example', exampleRoute); 
app.route('/profiles', profileRoutes); 
app.route('/manage/student', studentRoutes);
app.route('/manage/problems', problemRoutes); 
app.route('/r2', r2ImageRoutes);



app.get('/', (c) => c.text('Hono API is running!'));

export default app;
----- ./api/routes/example/selectpg_tables.ts -----

import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

const exampleRoutes = new Hono<{ Bindings: Env }>();

exampleRoutes.get('/pgtables', async (c) => {
  const sqlConnection = postgres(c.env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
  });

  try {
    const db = drizzle(sqlConnection);

    const result = await db.execute(sql`SELECT * FROM pg_tables`);


    c.executionCtx.waitUntil(sqlConnection.end());

    return c.json({ success: true, result });
  } catch (e: any) {
    console.error('Database error:', e.message);
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default exampleRoutes;
----- ./api/routes/manage/problems.ts -----
import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


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

type UploadProblemsInput = z.infer<typeof uploadProblemsBodySchema>;
type UpdateProblemInput = z.infer<typeof updateProblemBodySchema>;

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
