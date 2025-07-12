// file: api/db/schema.d1.ts
import {
    integer,
    real,
    sqliteTable,
    text,
    primaryKey,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// --- Enum Definitions ---

export const problemTypeEnum = ["객관식", "서답형", "논술형", "OX"] as const;
export const problemSetTypeEnum = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const problemSetStatusEnum = ["published", "private", "deleted"] as const; // 소프트 삭제를 위한 'deleted' 상태 추가
export const copyrightTypeEnum = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;

// --- Table Definitions ---

/**
 * 문제 원본 데이터 테이블 (Cloudflare D1)
 */
export const problemTable = sqliteTable("problem", {
    problem_id: text("problem_id").primaryKey(),
    source: text("source"),
    page: integer("page"),
    question_number: real("question_number"),
    answer: text("answer"),
    problem_type: text("problem_type", { enum: problemTypeEnum }),
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
    creator_id: text("creator_id").notNull(), // PG의 profile.id 참조
    type: text("type", { enum: problemSetTypeEnum }).notNull().default("PRIVATE_USER"),
    status: text("status", { enum: problemSetStatusEnum }).notNull().default("private"),
    copyright_type: text("copyright_type", { enum: copyrightTypeEnum }).notNull().default("ORIGINAL_CREATION"),
    copyright_source: text("copyright_source"),
    description: text("description"),
    cover_image: text("cover_image"),
    published_year: integer("published_year"),
    grade: text("grade"),
    semester: text("semester"),
    avg_difficulty: text("avg_difficulty"),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});

/**
 * 문제-문제집 연결 테이블 (Cloudflare D1)
 */
export const problemSetProblemsTable = sqliteTable("problem_set_problems", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    order: integer("order").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_set_id, table.problem_id] }),
}));

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
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    tag_id: text("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_id, table.tag_id] }),
}));


// --- Relations ---

export const problemRelations = relations(problemTable, ({ one, many }) => ({
    majorChapter: one(majorChaptersTable, { fields: [problemTable.major_chapter_id], references: [majorChaptersTable.id] }),
    middleChapter: one(middleChaptersTable, { fields: [problemTable.middle_chapter_id], references: [middleChaptersTable.id] }),
    coreConcept: one(coreConceptsTable, { fields: [problemTable.core_concept_id], references: [coreConceptsTable.id] }),
    problemTags: many(problemTagTable),
    problemSetProblems: many(problemSetProblemsTable),
}));

export const problemSetRelations = relations(problemSetTable, ({ many }) => ({
    problemSetProblems: many(problemSetProblemsTable),
}));

export const problemSetProblemsRelations = relations(problemSetProblemsTable, ({ one }) => ({
    problemSet: one(problemSetTable, { fields: [problemSetProblemsTable.problem_set_id], references: [problemSetTable.problem_set_id] }),
    problem: one(problemTable, { fields: [problemSetProblemsTable.problem_id], references: [problemTable.problem_id] }),
}));

export const majorChaptersRelations = relations(majorChaptersTable, ({ many }) => ({
    middleChapters: many(middleChaptersTable),
    problems: many(problemTable),
}));

export const middleChaptersRelations = relations(middleChaptersTable, ({ one, many }) => ({
    majorChapter: one(majorChaptersTable, { fields: [middleChaptersTable.major_chapter_id], references: [majorChaptersTable.id] }),
    problems: many(problemTable),
}));

export const coreConceptsRelations = relations(coreConceptsTable, ({ many }) => ({
    problems: many(problemTable),
}));

export const tagRelations = relations(tagTable, ({ many }) => ({
    problemTags: many(problemTagTable),
}));

export const problemTagRelations = relations(problemTagTable, ({ one }) => ({
    problem: one(problemTable, { fields: [problemTagTable.problem_id], references: [problemTable.problem_id] }),
    tag: one(tagTable, { fields: [problemTagTable.tag_id], references: [tagTable.tag_id] }),
}));


// --- Type Exports ---

export type DbProblem = typeof problemTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbProblemSetProblems = typeof problemSetProblemsTable.$inferSelect;
export type DbMajorChapter = typeof majorChaptersTable.$inferSelect;
export type DbMiddleChapter = typeof middleChaptersTable.$inferSelect;
export type DbCoreConcept = typeof coreConceptsTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;