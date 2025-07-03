//file path : react-hono/api/db/schema.pg.ts
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
    jsonb,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// --- Enum 타입 정의 ---
export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);

// [핵심] 최종 결정된 시험 할당 상태 Enum
export const examAssignmentStatusEnum = pgEnum('exam_assignment_status_enum', [
    'not_started', 
    'in_progress', 
    'completed', 
    'graded', 
    'expired'
]);

export const examProblemStatusEnum = pgEnum('exam_problem_status_enum', ['A', 'B', 'C', 'D']);


// --- 사용자 프로필 및 학생 정보 테이블 ---
export const profilesTable = pgTable("profiles", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    position: text("position").notNull(),
    academy_name: text("academy_name").notNull(),
    region: text("region").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const studentsTable = pgTable("students", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tuition: integer("tuition"),
    admission_date: date("admission_date"),
    discharge_date: date("discharge_date"),
    principal_id: uuid("principal_id").references(() => profilesTable.id, { onDelete: 'set null' }),
    grade: text("grade").notNull(),
    student_phone: text("student_phone"),
    guardian_phone: text("guardian_phone"),
    school_name: text("school_name"),
    class_name: text("class_name"),
    student_name: text("student_name").notNull(),
    teacher: text("teacher"),
    status: studentStatusEnum("status").notNull(),
    subject: text("subject").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

// --- 문제집 및 문제 관련 테이블 ---
export const problemSetTable = pgTable("problem_set", {
    problem_set_id: uuid("problem_set_id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    grade: text("grade"),
    semester: text("semester"),
    avg_difficulty: text("avg_difficulty"),
    cover_image: text("cover_image"),
    description: text("description"),
    published_year: integer("published_year"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const majorChaptersTable = pgTable("major_chapters", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const middleChaptersTable = pgTable("middle_chapters", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    major_chapter_id: uuid("major_chapter_id").notNull().references(() => majorChaptersTable.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const coreConceptsTable = pgTable("core_concepts", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemTable = pgTable("problem", {
    problem_id: uuid("problem_id").primaryKey().default(sql`gen_random_uuid()`),
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'set null' }),
    source: text("source"),
    page: integer("page"),
    question_number: real("question_number"),
    answer: text("answer"),
    problem_type: text("problem_type"),
    grade: text("grade"),
    semester: text("semester"),
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'restrict' }),
    major_chapter_id: uuid("major_chapter_id").references(() => majorChaptersTable.id, { onDelete: 'set null' }),
    middle_chapter_id: uuid("middle_chapter_id").references(() => middleChaptersTable.id, { onDelete: 'set null' }),
    core_concept_id: uuid("core_concept_id").references(() => coreConceptsTable.id, { onDelete: 'set null' }),
    problem_category: text("problem_category"),
    difficulty: text("difficulty"),
    score: text("score"),
    question_text: text("question_text"),
    solution_text: text("solution_text"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemRelations = relations(problemTable, ({ one }) => ({
    majorChapter: one(majorChaptersTable, { fields: [problemTable.major_chapter_id], references: [majorChaptersTable.id] }),
    middleChapter: one(middleChaptersTable, { fields: [problemTable.middle_chapter_id], references: [middleChaptersTable.id] }),
    coreConcept: one(coreConceptsTable, { fields: [problemTable.core_concept_id], references: [coreConceptsTable.id] }),
    creator: one(profilesTable, { fields: [problemTable.creator_id], references: [profilesTable.id] }),
}));

export const tagTable = pgTable("tag", {
    tag_id: uuid("tag_id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(),
    tag_type: text("tag_type"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemTagTable = pgTable("problem_tag", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    tag_id: uuid("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({ unqProblemTag: sql`UNIQUE (${table.problem_id}, ${table.tag_id})` }));

export const userPurchaseTable = pgTable("user_purchase", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'set null' }),
    purchase_date: timestamp("purchase_date", { mode: "date", withTimezone: true }),
    purchase_price: integer("purchase_price"),
    license_period: integer("license_period"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const userProblemLogTable = pgTable("user_problem_log", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    problem_id: uuid("problem_id").references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    is_correct: boolean("is_correct"),
    a_solved: boolean("a_solved").default(false).notNull(),
    q_unknown: boolean("q_unknown").default(false).notNull(),
    t_think: boolean("t_think").default(false).notNull(),
    qt_failed: boolean("qt_failed").default(false).notNull(),
    time_taken: integer("time_taken"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemStatsTable = pgTable("problem_stats", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    attempt_count: integer("attempt_count").default(0).notNull(),
    correct_count: integer("correct_count").default(0).notNull(),
    wrong_rate: real("wrong_rate"),
    avg_time: integer("avg_time"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({ unqProblemStats: sql`UNIQUE (${table.problem_id})` }));


// =========================================================================
// --- 시험지 출제, 할당, 풀이 로그 관련 테이블 (최종) ---
// =========================================================================

export const examSetsTable = pgTable("exam_sets", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    title: text("title").notNull(),
    problem_ids: jsonb("problem_ids").$type<string[]>().notNull(),
    header_info: jsonb("header_info"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const examAssignmentsTable = pgTable("exam_assignments", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    exam_set_id: uuid("exam_set_id").notNull().references(() => examSetsTable.id, { onDelete: 'cascade' }),
    student_id: uuid("student_id").notNull().references(() => studentsTable.id, { onDelete: 'cascade' }),
    status: examAssignmentStatusEnum("status").default('not_started').notNull(),
    correct_rate: real("correct_rate"),
    assigned_at: timestamp("assigned_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    started_at: timestamp("started_at", { mode: "date", withTimezone: true }),
    completed_at: timestamp("completed_at", { mode: "date", withTimezone: true }),
    total_pure_time_seconds: integer("total_pure_time_seconds"),
}, (table) => ({
    unqExamStudent: sql`UNIQUE (${table.exam_set_id}, ${table.student_id})`,
}));

export const examProblemLogsTable = pgTable("exam_problem_logs", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    assignment_id: uuid("assignment_id").notNull().references(() => examAssignmentsTable.id, { onDelete: 'cascade' }),
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    time_taken_seconds: integer("time_taken_seconds"),
    final_answer: jsonb("final_answer"),
    final_status: examProblemStatusEnum("final_status"),
    is_modified: boolean("is_modified").default(false),
    answer_history: jsonb("answer_history"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
    unqAssignmentProblem: sql`UNIQUE (${table.assignment_id}, ${table.problem_id})`,
}));


// --- Drizzle ORM 관계 정의 ---
export const examAssignmentsRelations = relations(examAssignmentsTable, ({ one, many }) => ({
    examSet: one(examSetsTable, {
        fields: [examAssignmentsTable.exam_set_id],
        references: [examSetsTable.id],
    }),
    student: one(studentsTable, {
        fields: [examAssignmentsTable.student_id],
        references: [studentsTable.id],
    }),
    problemLogs: many(examProblemLogsTable),
}));

export const examProblemLogsRelations = relations(examProblemLogsTable, ({ one }) => ({
    assignment: one(examAssignmentsTable, {
        fields: [examProblemLogsTable.assignment_id],
        references: [examAssignmentsTable.id],
    }),
    problem: one(problemTable, {
        fields: [examProblemLogsTable.problem_id],
        references: [problemTable.problem_id],
    }),
}));


// --- 타입 정의 (Select 시 타입 추론용) ---
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
export type DbExamSet = typeof examSetsTable.$inferSelect;
export type DbExamAssignment = typeof examAssignmentsTable.$inferSelect;
export type DbExamProblemLog = typeof examProblemLogsTable.$inferSelect;