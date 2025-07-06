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