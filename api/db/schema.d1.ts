// ./api/db/schema.d1.ts

import {
    integer,
    real,
    sqliteTable,
    text,
    primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

export const problemTypeEnum = ["객관식", "서답형", "논술형", "OX"] as const;
export const problemSetTypeEnum = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const problemSetStatusEnum = ["published", "private", "deleted"] as const;
export const copyrightTypeEnum = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;

/**
 * [최종 수정] 폴더(소제목 그룹) 정보 마스터 테이블
 * 특정 문제집의 특정 학년 아래에 소제목들을 그룹화하는 폴더입니다.
 */
export const foldersTable = sqliteTable("folders", {
    id: text("id").primaryKey(), // 예: `fld_${crypto.randomUUID()}`
    name: text("name").notNull(),
    creator_id: text("creator_id").notNull(),
    // [핵심] 어떤 문제집에 속한 폴더인지 명시
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    // [핵심] 어떤 학년 아래에 속한 폴더인지 명시 (null일 수 없음)
    grade_id: text("grade_id").notNull(),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});


/**
 * [수정] 소제목(Subtitle) 정보 마스터 테이블
 * folder_id 필드는 폴더(소제목 그룹)에 속할 수 있음을 의미합니다.
 */
export const subtitlesTable = sqliteTable("subtitles", {
    id: text("id").primaryKey(), // 예: `sub_${crypto.randomUUID()}`
    name: text("name").notNull(),
    folder_id: text("folder_id").references(() => foldersTable.id, { onDelete: 'set null' }),
});

/**
 * [최종] 문제 원본 데이터 테이블
 */
export const problemTable = sqliteTable("problem", {
    problem_id: text("problem_id").primaryKey(),
    subtitle_id: text("subtitle_id").references(() => subtitlesTable.id, { onDelete: 'set null' }),
    page: integer("page"),
    question_number: real("question_number"),
    answer: text("answer"),
    problem_type: text("problem_type", { enum: problemTypeEnum }),
    grade_id: text("grade_id"),
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
 * [수정] 문제집 정보 테이블
 * 최상위 폴더 개념이 없으므로 folder_id 필드를 제거합니다.
 */
export const problemSetTable = sqliteTable("problem_set", {
    problem_set_id: text("problem_set_id").primaryKey(),
    // folder_id: text("folder_id").references(() => foldersTable.id, { onDelete: 'set null' }), // [제거]
    name: text("name").notNull(),
    creator_id: text("creator_id").notNull(),
    type: text("type", { enum: problemSetTypeEnum }).notNull().default("PRIVATE_USER"),
    status: text("status", { enum: problemSetStatusEnum }).notNull().default("private"),
    copyright_type: text("copyright_type", { enum: copyrightTypeEnum }).notNull().default("ORIGINAL_CREATION"),
    copyright_source: text("copyright_source"),
    description: text("description"),
    cover_image: text("cover_image"),
    published_year: integer("published_year"),
    grade_id: text("grade_id"),
    semester: text("semester"),
    avg_difficulty: text("avg_difficulty"),
    problem_count: integer("problem_count").notNull().default(0),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});

export const problemSetProblemsTable = sqliteTable("problem_set_problems", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    order: integer("order").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_set_id, table.problem_id] }),
}));

/**
 * [신규] 문제-이미지 연결 테이블
 */
export const problemImagesTable = sqliteTable("problem_images", {
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    image_key: text("image_key").notNull(),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_id, table.image_key] }),
}));

/**
 * [수정] 문제집-소제목 연결 테이블
 */
export const problemSetSubtitlesTable = sqliteTable("problem_set_subtitles", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    subtitle_id: text("subtitle_id").notNull().references(() => subtitlesTable.id, { onDelete: 'cascade' }),
    count: integer("count").notNull().default(0),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_set_id, table.subtitle_id] }),
}));

export const problemCalculationSkillsTable = sqliteTable("problem_calculation_skills", {
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    skill_id: text("skill_id").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_id, table.skill_id] }),
}));

export const tagTable = sqliteTable("tag", { tag_id: text("tag_id").primaryKey(), name: text("name").notNull().unique(), tag_type: text("tag_type"), });
export const problemTagTable = sqliteTable("problem_tag", { problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), tag_id: text("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }), }, (table) => ({ pk: primaryKey({ columns: [table.problem_id, table.tag_id] }), }));


export const foldersRelations = relations(foldersTable, ({ one, many }) => ({
    subtitles: many(subtitlesTable),
    problemSet: one(problemSetTable, {
        fields: [foldersTable.problem_set_id],
        references: [problemSetTable.problem_set_id]
    }),
}));

export const subtitlesRelations = relations(subtitlesTable, ({ one, many }) => ({
    folder: one(foldersTable, { fields: [subtitlesTable.folder_id], references: [foldersTable.id] }),
    problemSetSubtitles: many(problemSetSubtitlesTable),
    problems: many(problemTable),
}));

export const problemRelations = relations(problemTable, ({ one, many }) => ({
    subtitle: one(subtitlesTable, { fields: [problemTable.subtitle_id], references: [subtitlesTable.id] }),
    problemCalculationSkills: many(problemCalculationSkillsTable),
    problemTags: many(problemTagTable),
    problemSetProblems: many(problemSetProblemsTable),
    images: many(problemImagesTable),
}));

export const problemSetRelations = relations(problemSetTable, ({ many }) => ({
    problemSetProblems: many(problemSetProblemsTable),
    subtitles: many(problemSetSubtitlesTable),
    folders: many(foldersTable),
}));

export const problemSetProblemsRelations = relations(problemSetProblemsTable, ({ one }) => ({
    problemSet: one(problemSetTable, { fields: [problemSetProblemsTable.problem_set_id], references: [problemSetTable.problem_set_id] }),
    problem: one(problemTable, { fields: [problemSetProblemsTable.problem_id], references: [problemTable.problem_id] }),
}));

export const problemImagesRelations = relations(problemImagesTable, ({ one }) => ({
    problem: one(problemTable, {
        fields: [problemImagesTable.problem_id],
        references: [problemTable.problem_id],
    }),
}));

export const problemSetSubtitlesRelations = relations(problemSetSubtitlesTable, ({ one }) => ({
    problemSet: one(problemSetTable, { fields: [problemSetSubtitlesTable.problem_set_id], references: [problemSetTable.problem_set_id] }),
    subtitle: one(subtitlesTable, { fields: [problemSetSubtitlesTable.subtitle_id], references: [subtitlesTable.id] }),
}));

export const problemCalculationSkillsRelations = relations(problemCalculationSkillsTable, ({ one }) => ({
    problem: one(problemTable, { fields: [problemCalculationSkillsTable.problem_id], references: [problemTable.problem_id] }),
}));

export const tagRelations = relations(tagTable, ({ many }) => ({ problemTags: many(problemTagTable), }));
export const problemTagRelations = relations(problemTagTable, ({ one }) => ({ problem: one(problemTable, { fields: [problemTagTable.problem_id], references: [problemTable.problem_id] }), tag: one(tagTable, { fields: [problemTagTable.tag_id], references: [tagTable.tag_id] }), }));


export type DbFolder = typeof foldersTable.$inferSelect;
export type DbProblem = typeof problemTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbProblemSetProblems = typeof problemSetProblemsTable.$inferSelect;
export type DbSubtitle = typeof subtitlesTable.$inferSelect;
export type DbProblemSetSubtitle = typeof problemSetSubtitlesTable.$inferSelect;
export type DbProblemImage = typeof problemImagesTable.$inferSelect;
export type DbProblemCalculationSkill = typeof problemCalculationSkillsTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;