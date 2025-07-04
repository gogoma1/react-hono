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
    // ✅ 올바른 방법: (major_chapter_id, name) 조합이 유일하도록 설정
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


// --- Drizzle ORM 관계 정의 (D1 내에서) ---
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


// --- 타입 정의 ---
export type DbProblem = typeof problemTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbMajorChapter = typeof majorChaptersTable.$inferSelect;
export type DbMiddleChapter = typeof middleChaptersTable.$inferSelect;
export type DbCoreConcept = typeof coreConceptsTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;