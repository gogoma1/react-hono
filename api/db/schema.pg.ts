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

// --- Enum 타입 정의 ---
export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);
export const examAssignmentStatusEnum = pgEnum('exam_assignment_status_enum', ['not_started', 'in_progress', 'completed', 'graded', 'expired']);


// --- OLTP 핵심 데이터 테이블 ---

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
    // D1의 problem_set.id를 TEXT 타입으로 저장
    problem_set_id: text("problem_set_id"),
    purchase_date: timestamp("purchase_date", { mode: "date", withTimezone: true }),
    purchase_price: integer("purchase_price"),
    license_period: integer("license_period"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});


// --- Drizzle ORM 관계 정의 ---
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

// --- 타입 정의 ---
export type DbProfile = typeof profilesTable.$inferSelect;
export type DbStudent = typeof studentsTable.$inferSelect;
export type DbExamSet = typeof examSetsTable.$inferSelect;
export type DbExamAssignment = typeof examAssignmentsTable.$inferSelect;
export type DbUserPurchase = typeof userPurchaseTable.$inferSelect;