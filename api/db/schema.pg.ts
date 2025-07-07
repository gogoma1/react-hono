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
    boolean,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// --- Enums: 재사용 가능한 상태 값들 ---

export const profileStatusEnum = pgEnum('profile_status_enum', ['active', 'inactive', 'deleted']);
export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);
export const examAssignmentStatusEnum = pgEnum('exam_assignment_status_enum', ['not_started', 'in_progress', 'completed', 'graded', 'expired']);
export const academyStatusEnum = pgEnum('academy_status_enum', ['운영중', '휴업', '폐업']);
export const subscriptionStatusEnum = pgEnum('subscription_status_enum', ['active', 'canceled', 'past_due', 'incomplete']);
export const billingIntervalEnum = pgEnum('billing_interval_enum', ['month', 'year']);


// --- 테이블 정의 ---

/**
 * 역할 정보 테이블
 * 시스템에 존재하는 모든 역할 목록을 관리합니다.
 */
export const rolesTable = pgTable("roles", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 예: '원장', '강사', '학생', '학부모', '과외 선생님'
    description: text("description"),
});

/**
 * 사용자 프로필 테이블
 * [수정] Soft Delete를 위한 status 및 deleted_at 컬럼 추가.
 */
export const profilesTable = pgTable("profiles", {
    id: uuid("id").primaryKey(), // Supabase auth.users.id 참조
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone"),
    status: profileStatusEnum("status").default('active').notNull(),
    deleted_at: timestamp("deleted_at", { mode: "date", withTimezone: true }),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 사용자-역할 연결 테이블 (다대다 관계)
 */
export const userRolesTable = pgTable("user_roles", {
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    role_id: uuid("role_id").notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.role_id] }),
}));

/**
 * 학원 정보 테이블
 */
export const academiesTable = pgTable("academies", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    principal_id: uuid("principal_id").notNull().references(() => profilesTable.id), // 원장 프로필 ID
    name: text("name").notNull(),
    region: text("region").notNull(),
    status: academyStatusEnum("status").default('운영중').notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 학생 재원 정보 테이블
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
 * 시험지 세트 정보 테이블 (선생님이 학생에게 할당하는 '시험지')
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
 */
export const examAssignmentsTable = pgTable("exam_assignments", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    exam_set_id: uuid("exam_set_id").notNull().references(() => examSetsTable.id, { onDelete: 'cascade' }),
    student_id: uuid("student_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    status: examAssignmentStatusEnum("status").default('not_started').notNull(),
    correct_rate: real("correct_rate"),
    total_pure_time_seconds: integer("total_pure_time_seconds"),
    assigned_at: timestamp("assigned_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    started_at: timestamp("started_at", { mode: "date", withTimezone: true }),
    completed_at: timestamp("completed_at", { mode: "date", withTimezone: true }),
}, (table) => ({
    unqExamStudent: sql`UNIQUE (${table.exam_set_id}, ${table.student_id})`,
}));


// --- [신규] 구독 및 권한 관련 테이블 ---

/**
 * 판매 상품(플랜) 정보 테이블
 */
export const productsTable = pgTable("products", {
    id: text("id").primaryKey(), // 예: "basic_monthly_plan"
    active: boolean("active").default(true).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price"),
    billing_interval: billingIntervalEnum("billing_interval"),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 사용자 구독 정보 테이블
 */
export const subscriptionsTable = pgTable("subscriptions", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    product_id: text("product_id").notNull().references(() => productsTable.id),
    status: subscriptionStatusEnum("status").notNull(),
    current_period_start: timestamp("current_period_start", { mode: "date", withTimezone: true }).notNull(),
    current_period_end: timestamp("current_period_end", { mode: "date", withTimezone: true }).notNull(),
    canceled_at: timestamp("canceled_at", { mode: "date", withTimezone: true }),
    payment_gateway: text("payment_gateway").notNull(),
    payment_gateway_subscription_id: text("payment_gateway_subscription_id").notNull().unique(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * 문제집 접근 권한 테이블
 */
export const problemSetEntitlementsTable = pgTable("problem_set_entitlements", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    problem_set_id: text("problem_set_id").notNull(), // D1의 problem_set_id 참조
    access_granted_by: uuid("access_granted_by").references(() => subscriptionsTable.id),
    access_expires_at: timestamp("access_expires_at", { mode: "date", withTimezone: true }),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});


// --- Relations: 테이블 관계 정의 ---

export const profileRelations = relations(profilesTable, ({ many }) => ({
    userRoles: many(userRolesTable),
    ownedAcademies: many(academiesTable, { relationName: 'ownedAcademies' }),
    enrollmentsAsStudent: many(enrollmentsTable, { relationName: 'enrollmentsAsStudent' }),
    examAssignments: many(examAssignmentsTable),
    subscriptions: many(subscriptionsTable),
    entitlements: many(problemSetEntitlementsTable),
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

export const productRelations = relations(productsTable, ({ many }) => ({
    subscriptions: many(subscriptionsTable),
}));

export const subscriptionRelations = relations(subscriptionsTable, ({ one }) => ({
    user: one(profilesTable, { fields: [subscriptionsTable.user_id], references: [profilesTable.id] }),
    product: one(productsTable, { fields: [subscriptionsTable.product_id], references: [productsTable.id] }),
}));

export const problemSetEntitlementRelations = relations(problemSetEntitlementsTable, ({ one }) => ({
    user: one(profilesTable, { fields: [problemSetEntitlementsTable.user_id], references: [profilesTable.id] }),
    subscription: one(subscriptionsTable, { fields: [problemSetEntitlementsTable.access_granted_by], references: [subscriptionsTable.id] }),
}));


// --- Types: Drizzle ORM 타입 추론 ---

export type DbRole = typeof rolesTable.$inferSelect;
export type DbProfile = typeof profilesTable.$inferSelect;
export type DbUserRole = typeof userRolesTable.$inferSelect;
export type DbAcademy = typeof academiesTable.$inferSelect;
export type DbEnrollment = typeof enrollmentsTable.$inferSelect;
export type DbExamSet = typeof examSetsTable.$inferSelect;
export type DbExamAssignment = typeof examAssignmentsTable.$inferSelect;
export type DbProduct = typeof productsTable.$inferSelect;
export type DbSubscription = typeof subscriptionsTable.$inferSelect;
export type DbProblemSetEntitlement = typeof problemSetEntitlementsTable.$inferSelect;