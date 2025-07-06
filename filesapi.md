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
    primaryKey,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);
export const examAssignmentStatusEnum = pgEnum('exam_assignment_status_enum', ['not_started', 'in_progress', 'completed', 'graded', 'expired']);
export const academyStatusEnum = pgEnum('academy_status_enum', ['운영중', '휴업', '폐업']);


/**
 * 역할 정보 테이블 (신규)
 * 시스템에 존재하는 모든 역할 목록을 관리합니다.
 */
export const rolesTable = pgTable("roles", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 예: '원장', '강사', '학생', '학부모', '과외선생님'
    description: text("description"),
});

/**
 * 사용자 프로필 테이블 (수정)
 * 역할(position) 컬럼을 제거하고, 순수 사용자 정보(이름, 전화번호 등)만 관리합니다.
 */
export const profilesTable = pgTable("profiles", {
    id: uuid("id").primaryKey(), // Supabase auth.users.id 참조
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 사용자-역할 연결 테이블 (신규, 다대다 관계)
 */
export const userRolesTable = pgTable("user_roles", {
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    role_id: uuid("role_id").notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.role_id] }),
}));

/**
 * 학원 정보 테이블 (신규)
 */
export const academiesTable = pgTable("academies", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    principal_id: uuid("principal_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }), // 원장 프로필 ID
    name: text("name").notNull(),
    region: text("region").notNull(),
    status: academyStatusEnum("status").default('운영중').notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 학생 재원 정보 테이블 (신규)
 * 기존 studentsTable을 대체하며, 한 학생이 여러 학원에 등록될 수 있도록 합니다.
 */
export const enrollmentsTable = pgTable("enrollments", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    academy_id: uuid("academy_id").notNull().references(() => academiesTable.id, { onDelete: 'cascade' }),
    student_profile_id: uuid("student_profile_id").references(() => profilesTable.id, { onDelete: 'set null' }).unique(),
    student_name: text("student_name").notNull(),
    student_phone: text("student_phone"),
    guardian_phone: text("guardian_phone"),
    grade: text("grade").notNull(),
    subject: text("subject").notNull(),
    status: studentStatusEnum("status").notNull(),
    tuition: integer("tuition"),
    admission_date: date("admission_date"),
    discharge_date: date("discharge_date"),
    school_name: text("school_name"),
    class_name: text("class_name"),
    teacher: text("teacher"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 시험지 세트 정보 테이블
 */
export const examSetsTable = pgTable("exam_sets", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    title: text("title").notNull(),
    problem_ids: jsonb("problem_ids").$type<string[]>().notNull(),
    header_info: jsonb("header_info"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 시험지 할당 정보 테이블
 * [요청사항 반영] 학생을 식별할 때, 학원 재원 정보(enrollment) 대신 학생의 프로필(profile)을 직접 참조합니다.
 * 이는 어떤 학원에 소속되어 있든, 학생의 통합 계정으로 시험을 관리하겠다는 의미입니다.
 */
export const examAssignmentsTable = pgTable("exam_assignments", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    exam_set_id: uuid("exam_set_id").notNull().references(() => examSetsTable.id, { onDelete: 'cascade' }),
    student_id: uuid("student_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }), // 학생 프로필 ID 참조
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
 * [요청사항 반영] 사용자 구매 정보 테이블
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


export const profileRelations = relations(profilesTable, ({ many }) => ({
    userRoles: many(userRolesTable),
    ownedAcademies: many(academiesTable, { relationName: 'ownedAcademies' }),
    enrollmentsAsStudent: many(enrollmentsTable, { relationName: 'enrollmentsAsStudent' }),
    examAssignments: many(examAssignmentsTable),
    purchases: many(userPurchaseTable),
}));

export const roleRelations = relations(rolesTable, ({ many }) => ({
    userRoles: many(userRolesTable),
}));

export const userRolesRelations = relations(userRolesTable, ({ one }) => ({
    profile: one(profilesTable, { fields: [userRolesTable.user_id], references: [profilesTable.id] }),
    role: one(rolesTable, { fields: [userRolesTable.role_id], references: [rolesTable.id] }),
}));

export const academyRelations = relations(academiesTable, ({ one, many }) => ({
    principal: one(profilesTable, { fields: [academiesTable.principal_id], references: [profilesTable.id], relationName: 'ownedAcademies' }),
    enrollments: many(enrollmentsTable),
}));

export const enrollmentRelations = relations(enrollmentsTable, ({ one }) => ({
    academy: one(academiesTable, { fields: [enrollmentsTable.academy_id], references: [academiesTable.id] }),
    studentProfile: one(profilesTable, { fields: [enrollmentsTable.student_profile_id], references: [profilesTable.id], relationName: 'enrollmentsAsStudent' }),
}));

export const examSetRelations = relations(examSetsTable, ({ one, many }) => ({
    creator: one(profilesTable, { fields: [examSetsTable.creator_id], references: [profilesTable.id] }),
    assignments: many(examAssignmentsTable),
}));

export const examAssignmentsRelations = relations(examAssignmentsTable, ({ one }) => ({
    examSet: one(examSetsTable, { fields: [examAssignmentsTable.exam_set_id], references: [examSetsTable.id] }),
    student: one(profilesTable, { fields: [examAssignmentsTable.student_id], references: [profilesTable.id] }),
}));

export const userPurchaseRelations = relations(userPurchaseTable, ({ one }) => ({
    user: one(profilesTable, { fields: [userPurchaseTable.user_id], references: [profilesTable.id] }),
}));


export type DbRole = typeof rolesTable.$inferSelect;
export type DbProfile = typeof profilesTable.$inferSelect;
export type DbUserRole = typeof userRolesTable.$inferSelect;
export type DbAcademy = typeof academiesTable.$inferSelect;
export type DbEnrollment = typeof enrollmentsTable.$inferSelect;
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
import academyRoutes from './routes/manage/academies';

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
app.route('/academies', academyRoutes);

app.route('/exam/mobile', mobileExamRoutes); 



app.get('/', (c) => c.text('Hono API is running!'));

export default app;
----- ./api/routes/exam/exam.mobile.ts -----
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const publishExamSetSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.'),
  problem_ids: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  student_ids: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  header_info: z.record(z.any()).nullable().optional(),
});

const mobileExamRoutes = new Hono<AppEnv>();

/**
 * GET /api/exam/mobile/my-assignment - 로그인한 학생에게 할당된 최신 시험지 조회
 * Supabase 미들웨어를 통해 인증된 사용자의 ID를 기반으로 동작합니다.
 */
mobileExamRoutes.get('/my-assignment', async (c) => {
    const user = c.get('user');
    
    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const assignment = await db.query.examAssignmentsTable.findFirst({
            where: eq(schema.examAssignmentsTable.student_id, user.id),
            orderBy: [desc(schema.examAssignmentsTable.assigned_at)],
            with: {
                examSet: true,
            },
        });

        if (!assignment) {
            return c.json({ error: '할당된 시험지를 찾을 수 없습니다.' }, 404);
        }

        return c.json(assignment);

    } catch (error: any) {
        console.error('Failed to fetch student assignment from Supabase:', error);
        return c.json({ error: '시험지 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * POST /api/exam/mobile/sets - 새로운 모바일 시험지 세트 생성 및 학생들에게 할당
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
          problem_ids: body.problem_ids,
          header_info: body.header_info,
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        const assignments = body.student_ids.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { exam_set_id: newExamSet.id, assigned_count: assignments.length };
      });

      return c.json({ 
        message: `${result.assigned_count}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
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
  problem_ids: z.array(z.string()).min(1, '문제는 하나 이상 포함되어야 합니다.'),
  student_ids: z.array(z.string().uuid()).min(1, '학생은 한 명 이상 선택되어야 합니다.'),
  header_info: z.record(z.any()).optional(),
});

const submitAssignmentSchema = z.object({
  exam_start_time: z.string().datetime(),
  exam_end_time: z.string().datetime(),
  total_pure_time_seconds: z.number().int().nonnegative(),
  correct_rate: z.number().min(0).max(100).nullable(),
  problem_logs: z.array(z.object({
    problem_id: z.string(),
    time_taken_seconds: z.number().int().nonnegative(),
    final_answer: z.any().optional(),
    final_status: z.enum(['A', 'B', 'C', 'D']).optional(), 
    is_modified: z.boolean(),
    answer_history: z.array(z.any()),
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
          problem_ids: body.problem_ids,
          header_info: body.header_info,
        }).returning();

        if (!newExamSet) {
          throw new Error("시험지 세트 생성에 실패했습니다.");
        }

        const assignments = body.student_ids.map(studentId => ({
          exam_set_id: newExamSet.id,
          student_id: studentId,
        }));
        
        await tx.insert(schema.examAssignmentsTable).values(assignments);

        return { exam_set_id: newExamSet.id, assigned_count: assignments.length };
      });

      return c.json({ 
        message: `${result.assigned_count}명의 학생에게 시험지가 성공적으로 할당되었습니다.`,
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
                status: body.correct_rate === null ? 'completed' : 'graded',
                started_at: new Date(body.exam_start_time),
                completed_at: new Date(body.exam_end_time),
                total_pure_time_seconds: body.total_pure_time_seconds,
                correct_rate: body.correct_rate,
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
            const bucket = logBucket;

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
----- ./api/routes/manage/academies.ts -----
import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const academyRoutes = new Hono<AppEnv>();

/**
 * GET /my - 로그인한 원장이 소유한 학원 목록을 조회합니다.
 * Supabase 미들웨어를 통해 인증된 사용자의 ID를 기반으로 동작합니다.
 */
academyRoutes.get('/my', async (c) => {
    const user = c.get('user');

    if (!user || !user.id) {
        return c.json({ error: '인증 정보가 필요합니다.' }, 401);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const myAcademies = await db.query.academiesTable.findMany({
            where: eq(schema.academiesTable.principal_id, user.id),
            orderBy: (academies, { asc }) => [asc(academies.created_at)],
        });

        return c.json(myAcademies);

    } catch (error: any) {
        console.error('Failed to fetch my academies:', error.message);
        return c.json({ error: '내 학원 목록을 조회하는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default academyRoutes;
----- ./api/routes/manage/problems.ts -----
import { Hono } from 'hono';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, inArray, sql } from 'drizzle-orm';
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

const getProblemsByIdsSchema = z.object({
    problemIds: z.array(z.string()).min(1, "problemIds 배열은 비어있을 수 없습니다."),
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
 * 학생이 시험지를 볼 때 필요한 문제 데이터를 한 번에 가져오기 위해 사용합니다.
 * POST를 사용하는 이유는 GET 요청의 URL 길이 제한을 피하기 위함입니다.
 */
problemRoutes.post('/by-ids', zValidator('json', getProblemsByIdsSchema), async (c) => {
    const { problemIds } = c.req.valid('json');
    const d1 = c.env.D1_DATABASE;
    const db = drizzle(d1, { schema });

    try {
        if (problemIds.length === 0) {
            return c.json([]);
        }

        const problemsData = await db.query.problemTable.findMany({
            where: inArray(schema.problemTable.problem_id, problemIds),
            with: {
                majorChapter: { columns: { name: true } },
                middleChapter: { columns: { name: true } },
                coreConcept: { columns: { name: true } },
            }
        });

        const problemsMap = new Map(problemsData.map(p => [p.problem_id, p]));
        const orderedProblems = problemIds
            .map(id => problemsMap.get(id))
            .filter((p): p is schema.DbProblem & { majorChapter: any; middleChapter: any; coreConcept: any; } => !!p);
        
        const transformedProblems = orderedProblems.map(p => ({
            ...p,
            major_chapter_id: p.majorChapter?.name ?? p.major_chapter_id,
            middle_chapter_id: p.middleChapter?.name ?? p.middle_chapter_id,
            core_concept_id: p.coreConcept?.name ?? p.core_concept_id,
        }));

        return c.json(transformedProblems, 200);
    } catch (error: any) {
        console.error('Failed to fetch problems by IDs from D1:', error);
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
        
        newMajorValues.forEach(val => majorMap.set(val.name, val.id));

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

            if (problem.problem_id && !problem.problem_id.startsWith('new-')) {
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
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';


const enrollmentSchemaBase = z.object({
  student_name: z.string().min(1, "학생 이름은 필수입니다."),
  grade: z.string().min(1, "학년은 필수입니다."),
  subject: z.string().min(1, "과목은 필수입니다."),
  status: z.enum(schema.studentStatusEnum.enumValues),
  tuition: z.number().nonnegative().optional().nullable(),
  admission_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
  student_phone: z.string().optional().nullable(),
  school_name: z.string().optional().nullable(),
  class_name: z.string().optional().nullable(),
  teacher: z.string().optional().nullable(),
  student_profile_id: z.string().uuid().optional().nullable(),
});

const createEnrollmentSchema = enrollmentSchemaBase.extend({
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
});

const updateEnrollmentSchema = enrollmentSchemaBase.partial().extend({
    discharge_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
});

const bulkUpdateStatusSchema = z.object({
    enrollment_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    status: z.enum(schema.studentStatusEnum.enumValues),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."), // 권한 확인용
});

const bulkDeleteSchema = z.object({
    enrollment_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."), // 권한 확인용
});


const studentRoutes = new Hono<AppEnv>();


/**
 * GET /:academyId - 특정 학원의 모든 재원생 목록 조회
 * 원장은 자신이 소유한 학원의 학생 목록만 조회할 수 있습니다.
 */
studentRoutes.get('/:academyId', async (c) => {
    const user = c.get('user')!;
    const academyId = c.req.param('academyId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academyId),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '학원을 찾을 수 없거나 조회 권한이 없습니다.' }, 404);
        }

        const enrollments = await db.query.enrollmentsTable.findMany({
            where: eq(schema.enrollmentsTable.academy_id, academyId),
            orderBy: desc(schema.enrollmentsTable.created_at),
        });
        return c.json(enrollments);
    } catch (error: any) {
        console.error('Failed to fetch enrollments:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * POST / - 특정 학원에 새로운 재원생 등록
 */
studentRoutes.post('/', zValidator('json', createEnrollmentSchema), async (c) => {
    const user = c.get('user')!;
    const { academy_id, ...enrollmentData } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '학생을 등록할 학원을 찾을 수 없거나 권한이 없습니다.' }, 403);
        }

        const [newEnrollment] = await db.insert(schema.enrollmentsTable)
            .values({ ...enrollmentData, academy_id })
            .returning();
            
        return c.json(newEnrollment, 201);
    } catch (error: any) {
        console.error('Failed to create enrollment:', error.message);
        return c.json({ error: '데이터베이스 오류로 학생 등록에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * PUT /:enrollmentId - 특정 재원생 정보 수정
 */
studentRoutes.put('/:enrollmentId', zValidator('json', updateEnrollmentSchema), async (c) => {
    const user = c.get('user')!;
    const enrollmentId = c.req.param('enrollmentId');
    const validatedData = c.req.valid('json');
    
    if (Object.keys(validatedData).length === 0) {
        return c.json({ error: '수정할 내용이 없습니다.' }, 400);
    }

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const enrollment = await db.query.enrollmentsTable.findFirst({
            where: eq(schema.enrollmentsTable.id, enrollmentId),
            with: { academy: { columns: { principal_id: true } } }
        });

        if (!enrollment || enrollment.academy.principal_id !== user.id) {
            return c.json({ error: '수정할 학생 정보를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }

        const [updatedEnrollment] = await db.update(schema.enrollmentsTable)
            .set({ ...validatedData, updated_at: new Date() })
            .where(eq(schema.enrollmentsTable.id, enrollmentId))
            .returning();

        return c.json(updatedEnrollment);
    } catch (error: any) {
        console.error(`Failed to update enrollment ${enrollmentId}:`, error);
        return c.json({ error: '데이터베이스 오류로 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * DELETE /:enrollmentId - 특정 재원생 퇴원 처리 (Soft Delete)
 */
studentRoutes.delete('/:enrollmentId', async (c) => {
    const user = c.get('user')!;
    const enrollmentId = c.req.param('enrollmentId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const enrollment = await db.query.enrollmentsTable.findFirst({
            where: eq(schema.enrollmentsTable.id, enrollmentId),
            with: { academy: { columns: { principal_id: true } } }
        });

        if (!enrollment || enrollment.academy.principal_id !== user.id) {
            return c.json({ error: '퇴원 처리할 학생 정보를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const [softDeleted] = await db.update(schema.enrollmentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(eq(schema.enrollmentsTable.id, enrollmentId))
            .returning({ id: schema.enrollmentsTable.id });

        return c.json({ message: '퇴원 처리가 완료되었습니다.', id: softDeleted.id });

    } catch (error: any) {
        console.error(`Failed to soft-delete enrollment ${enrollmentId}:`, error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

/**
 * POST /bulk-update-status - 여러 재원생 상태 일괄 변경
 */
studentRoutes.post('/bulk-update-status', zValidator('json', bulkUpdateStatusSchema), async (c) => {
    const user = c.get('user')!;
    const { enrollment_ids, status, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        }

        const result = await db.update(schema.enrollmentsTable)
            .set({ status: status, updated_at: new Date() })
            .where(and(
                inArray(schema.enrollmentsTable.id, enrollment_ids),
                eq(schema.enrollmentsTable.academy_id, academy_id) // 재확인
            ))
            .returning();
        
        return c.json({ message: `${result.length}명의 학생 상태가 변경되었습니다.`, updated: result });
    } catch (error: any) {
        console.error('Failed to bulk update student status:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


/**
 * POST /bulk-delete - 여러 재원생 일괄 퇴원 처리 (Soft Delete)
 */
studentRoutes.post('/bulk-delete', zValidator('json', bulkDeleteSchema), async (c) => {
    const user = c.get('user')!;
    const { enrollment_ids, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    
    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(
                eq(schema.academiesTable.id, academy_id),
                eq(schema.academiesTable.principal_id, user.id)
            )
        });

        if (!academy) {
            return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        }

        const today = new Date().toISOString().split('T')[0];
        const result = await db.update(schema.enrollmentsTable)
            .set({ 
                status: '퇴원', 
                discharge_date: today,
                updated_at: new Date() 
            })
            .where(and(
                inArray(schema.enrollmentsTable.id, enrollment_ids),
                eq(schema.enrollmentsTable.academy_id, academy_id)
            ))
            .returning({ id: schema.enrollmentsTable.id });
            
        return c.json({ message: `${result.length}명의 학생이 퇴원 처리되었습니다.`, deletedIds: result.map(s => s.id) });
    } catch (error: any) {
        console.error('Failed to bulk delete students:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
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
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  phone: z.string().optional(),
  role_name: z.enum(['원장', '학생', '강사', '학부모', '과외 선생님']), 
  academy_name: z.string().optional(),
  region: z.string().optional(),
  academy_id: z.string().uuid().optional(),
}).refine(data => {
    if (data.role_name === '원장') {
        return !!data.academy_name && !!data.region;
    }
    if (['강사', '학생', '학부모'].includes(data.role_name)) {
        return !!data.academy_id;
    }
    return true;
}, {
    message: "원장은 학원/지역, 그 외 학원 소속원은 학원 ID가 필수입니다.",
    path: ["academy_name", "region", "academy_id"],
});

const profileRoutes = new Hono<AppEnv>();

profileRoutes.get('/academies', async (c) => {
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academies = await db.query.academiesTable.findMany({
            where: eq(schema.academiesTable.status, '운영중'),
            orderBy: (academies, { asc }) => [asc(academies.name)],
        });
        
        const result = academies.map(a => ({
            id: a.id,
            name: a.name,
            region: a.region,
            status: a.status,
        }));
        
        return c.json(result);

    } catch (error: any) {
        console.error('Failed to fetch academies:', error.message);
        return c.json({ error: '학원 목록 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

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
    zValidator('json', profileSetupSchema),
    async (c) => {
        const user = c.get('user');
        const { name, phone, role_name, academy_name, region, academy_id } = c.req.valid('json');

        if (!user?.id || !user?.email) {
            return c.json({ error: '인증이 필요합니다.' }, 401);
        }
        
        const sql = postgres(c.env.HYPERDRIVE.connectionString);
        const db = drizzle(sql, { schema });

        const sanitizedPhone = phone ? phone.replace(/-/g, '') : undefined;

        try {
            const result = await db.transaction(async (tx) => {
                const existingProfile = await tx.query.profilesTable.findFirst({
                    where: eq(schema.profilesTable.id, user.id)
                });

                if (existingProfile) {
                    throw new Error('Profile for this user already exists.');
                }
                
                let enrollmentRecord: schema.DbEnrollment | undefined;
                if (['학생', '강사', '학부모'].includes(role_name)) {
                    if (!academy_id || !sanitizedPhone) {
                        throw new Error("학원 소속원은 학원 ID와 전화번호가 모두 필요합니다.");
                    }

                    enrollmentRecord = await tx.query.enrollmentsTable.findFirst({
                        where: and(
                            eq(schema.enrollmentsTable.academy_id, academy_id),
                            eq(schema.enrollmentsTable.student_phone, sanitizedPhone)
                        )
                    });

                    if (!enrollmentRecord) {
                        throw new Error('Enrollment not found'); 
                    }
                }
                
                const [newProfile] = await tx.insert(schema.profilesTable).values({
                    id: user.id,
                    email: user.email!,
                    name: name,
                    phone: sanitizedPhone, // DB에는 정제된 번호를 저장합니다.
                }).returning();

                const role = await tx.query.rolesTable.findFirst({
                    where: eq(schema.rolesTable.name, role_name)
                });

                if (!role) {
                    throw new Error(`'${role_name}' 역할을 찾을 수 없습니다.`);
                }

                await tx.insert(schema.userRolesTable).values({
                    user_id: newProfile.id,
                    role_id: role.id,
                });

                if (role_name === '원장') {
                    if (!academy_name || !region) {
                         throw new Error('원장은 학원 이름과 지역 정보가 필수입니다.');
                    }
                    await tx.insert(schema.academiesTable).values({
                        name: academy_name,
                        region: region,
                        principal_id: newProfile.id,
                        status: '운영중',
                    });
                }
                
                if (['학생', '강사', '학부모'].includes(role_name) && enrollmentRecord) {
                    await tx.update(schema.enrollmentsTable)
                        .set({
                            student_profile_id: newProfile.id,
                            updated_at: new Date()
                        })
                        .where(eq(schema.enrollmentsTable.id, enrollmentRecord.id));
                }
                
                return { profileId: newProfile.id };
            });

            return c.json({ success: true, ...result }, 201);

        } catch (error: any) {
            console.error('Failed to create profile:', error.message);

            if (error.message === 'Enrollment not found') {
                return c.json({ error: 'Enrollment not found' }, 404);
            }
            if (error.message.includes('already exists')) {
                return c.json({ error: '이미 존재하는 프로필입니다.' }, 409);
            }
            return c.json({ error: '프로필 생성 중 데이터베이스 오류가 발생했습니다.', details: error.message }, 500);
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
