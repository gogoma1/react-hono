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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const profileStatusEnum = pgEnum('profile_status_enum', ['active', 'inactive', 'deleted']);
export const examAssignmentStatusEnum = pgEnum('exam_assignment_status_enum', ['assigned', 'not_started', 'in_progress', 'completed', 'graded', 'expired']);
export const academyStatusEnum = pgEnum('academy_status_enum', ['운영중', '휴업', '폐업']);
export const subscriptionStatusEnum = pgEnum('subscription_status_enum', ['active', 'canceled', 'past_due', 'incomplete']);
export const billingIntervalEnum = pgEnum('billing_interval_enum', ['month', 'year']);

export const memberStatusEnum = pgEnum('member_status_enum', ['active', 'inactive', 'resigned']);
export const memberTypeEnum = pgEnum('member_type_enum', ['student', 'teacher', 'parent', 'staff']);


export const rolesTable = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  status: profileStatusEnum("status").default('active').notNull(),
  deleted_at: timestamp("deleted_at", { mode: "date", withTimezone: true }),
  created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const userRolesTable = pgTable("user_roles", {
  user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
  role_id: uuid("role_id").notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.role_id] }),
}));

export const academiesTable = pgTable("academies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  principal_id: uuid("principal_id").notNull().references(() => profilesTable.id),
  name: text("name").notNull(),
  region: text("region").notNull(),
  status: academyStatusEnum("status").default('운영중').notNull(),
  created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const academyMembersTable = pgTable("academy_members", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  academy_id: uuid("academy_id").notNull().references(() => academiesTable.id, { onDelete: 'cascade' }),
  profile_id: uuid("profile_id").references(() => profilesTable.id, { onDelete: 'set null' }),
  member_type: memberTypeEnum("member_type").notNull(),
  status: memberStatusEnum("status").notNull().default('active'),
  start_date: date("start_date"),
  end_date: date("end_date"),
  
  // managed_by_member_id 컬럼은 여기서 제거합니다.

  details: jsonb("details").$type<{
    student_name?: string;
    student_phone?: string;
    guardian_phone?: string;
    grade?: string;
    school_name?: string;
    class_name?: string;
    subject?: string;
    teacher?: string; 
    tuition?: number;
  }>(),

  created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  unq_academy_member: uniqueIndex('unq_academy_member_idx').on(table.academy_id, table.profile_id, table.member_type).where(sql`${table.profile_id} IS NOT NULL`),
  details_idx: sql`CREATE INDEX IF NOT EXISTS "details_gin_idx" ON "academy_members" USING GIN ("details")`,
}));


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
  student_member_id: uuid("student_member_id").notNull().references(() => academyMembersTable.id, { onDelete: 'cascade' }),
  status: examAssignmentStatusEnum("status").default('assigned').notNull(),
  correct_rate: real("correct_rate"),
  total_pure_time_seconds: integer("total_pure_time_seconds"),
  assigned_at: timestamp("assigned_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
  started_at: timestamp("started_at", { mode: "date", withTimezone: true }),
  completed_at: timestamp("completed_at", { mode: "date", withTimezone: true }),
}, (table) => ({
  unqExamStudent: sql`UNIQUE (${table.exam_set_id}, ${table.student_member_id})`
}));

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  active: boolean("active").default(true).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price"),
  billing_interval: billingIntervalEnum("billing_interval"),
  created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

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

export const problemSetEntitlementsTable = pgTable("problem_set_entitlements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
  problem_set_id: text("problem_set_id").notNull(),
  access_granted_by: uuid("access_granted_by").references(() => subscriptionsTable.id),
  access_expires_at: timestamp("access_expires_at", { mode: "date", withTimezone: true }),
  created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const profileRelations = relations(profilesTable, ({ many }) => ({
  userRoles: many(userRolesTable),
  ownedAcademies: many(academiesTable, { relationName: 'ownedAcademies' }),
  academyMemberships: many(academyMembersTable),
  subscriptions: many(subscriptionsTable),
  entitlements: many(problemSetEntitlementsTable),
}));

export const roleRelations = relations(rolesTable, ({ many }) => ({
  userRoles: many(userRolesTable)
}));

export const userRolesRelations = relations(userRolesTable, ({ one }) => ({
  profile: one(profilesTable, { fields: [userRolesTable.user_id], references: [profilesTable.id] }),
  role: one(rolesTable, { fields: [userRolesTable.role_id], references: [rolesTable.id] }),
}));

export const academyRelations = relations(academiesTable, ({ one, many }) => ({
  principal: one(profilesTable, { fields: [academiesTable.principal_id], references: [profilesTable.id], relationName: 'ownedAcademies' }),
  members: many(academyMembersTable),
}));

export const studentManagerLinksTable = pgTable("student_manager_links", {
    // 관리 대상이 되는 학생의 member id
    student_member_id: uuid("student_member_id").notNull().references(() => academyMembersTable.id, { onDelete: 'cascade' }),
    // 관리 주체인 강사/직원의 member id
    manager_member_id: uuid("manager_member_id").notNull().references(() => academyMembersTable.id, { onDelete: 'cascade' }),
    // (선택적 확장) 담당 과목 등 관계에 대한 추가 정보
    context: text("context"), 
}, (table) => ({
    // 학생과 담당자의 조합은 유일해야 합니다.
    pk: primaryKey({ columns: [table.student_member_id, table.manager_member_id] }),
}));

export const academyMembersRelations = relations(academyMembersTable, ({ one, many }) => ({
  academy: one(academiesTable, { fields: [academyMembersTable.academy_id], references: [academiesTable.id] }),
  profile: one(profilesTable, { fields: [academyMembersTable.profile_id], references: [profilesTable.id] }),
  examAssignments: many(examAssignmentsTable),

  /**
   * [수정] 학생 입장에서 자신의 담당자 목록을 조회하기 위한 관계
   */
  managerLinks: many(studentManagerLinksTable, { relationName: 'studentLinks' }),
  /**
   * [수정] 담당자 입장에서 자신이 관리하는 학생 목록을 조회하기 위한 관계
   */
  managingStudentLinks: many(studentManagerLinksTable, { relationName: 'managerLinks' }),
}));

export const studentManagerLinksRelations = relations(studentManagerLinksTable, ({ one }) => ({
    // 링크의 학생 정보를 가져오기 위함
    student: one(academyMembersTable, {
        fields: [studentManagerLinksTable.student_member_id],
        references: [academyMembersTable.id],
        relationName: 'studentLinks',
    }),
    // 링크의 담당자 정보를 가져오기 위함
    manager: one(academyMembersTable, {
        fields: [studentManagerLinksTable.manager_member_id],
        references: [academyMembersTable.id],
        relationName: 'managerLinks',
    }),
}));

export const examSetRelations = relations(examSetsTable, ({ one, many }) => ({
  creator: one(profilesTable, { fields: [examSetsTable.creator_id], references: [profilesTable.id] }),
  assignments: many(examAssignmentsTable),
}));

export const examAssignmentsRelations = relations(examAssignmentsTable, ({ one }) => ({
  examSet: one(examSetsTable, { fields: [examAssignmentsTable.exam_set_id], references: [examSetsTable.id] }),
  studentMember: one(academyMembersTable, { fields: [examAssignmentsTable.student_member_id], references: [academyMembersTable.id] }),
}));

export const productRelations = relations(productsTable, ({ many }) => ({
  subscriptions: many(subscriptionsTable)
}));

export const subscriptionRelations = relations(subscriptionsTable, ({ one }) => ({
  user: one(profilesTable, { fields: [subscriptionsTable.user_id], references: [profilesTable.id] }),
  product: one(productsTable, { fields: [subscriptionsTable.product_id], references: [productsTable.id] }),
}));

export const problemSetEntitlementRelations = relations(problemSetEntitlementsTable, ({ one }) => ({
  user: one(profilesTable, { fields: [problemSetEntitlementsTable.user_id], references: [profilesTable.id] }),
  subscription: one(subscriptionsTable, { fields: [problemSetEntitlementsTable.access_granted_by], references: [subscriptionsTable.id] }),
}));

export type DbRole = typeof rolesTable.$inferSelect;
export type DbProfile = typeof profilesTable.$inferSelect;
export type DbUserRole = typeof userRolesTable.$inferSelect;
export type DbAcademy = typeof academiesTable.$inferSelect;
export type DbExamSet = typeof examSetsTable.$inferSelect;
export type DbExamAssignment = typeof examAssignmentsTable.$inferSelect;
export type DbProduct = typeof productsTable.$inferSelect;
export type DbSubscription = typeof subscriptionsTable.$inferSelect;
export type DbProblemSetEntitlement = typeof problemSetEntitlementsTable.$inferSelect;
export type DbAcademyMember = typeof academyMembersTable.$inferSelect;