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
import { sql } from "drizzle-orm"; // raw SQL 사용 및 default 값 설정용

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
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'restrict' }), // restrict: 출제자 프로필 삭제 시 문제 삭제 방지 (정책에 따라 cascade, set null 등)
    major_chapter_id: uuid("major_chapter_id").references(() => majorChaptersTable.id, { onDelete: 'set null' }), // 대단원 ID 참조
    middle_chapter_id: uuid("middle_chapter_id").references(() => middleChaptersTable.id, { onDelete: 'set null' }), // 중단원 ID 참조
    core_concept_id: uuid("core_concept_id").references(() => coreConceptsTable.id, { onDelete: 'set null' }), // 핵심 개념 ID 참조
    problem_category: text("problem_category"), // 문제 카테고리
    difficulty: text("difficulty"), // 난이도 (텍스트 또는 numeric/real 타입 고려)
    score: text("score"),           // 배점 (텍스트 또는 numeric/real 타입 고려)
    question_text: text("question_text"), // 문제 본문 (긴 텍스트)
    option_text: text("option_text"),   // 객관식 선택지 (JSONB 타입 고려 가능)
    solution_text: text("solution_text"), // 해설 (긴 텍스트)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

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

export type AppEnv = {
    Bindings: {
        HYPERDRIVE: Hyperdrive;
        SUPABASE_URL: string;
        SUPABASE_ANON_KEY: string;
    },
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
