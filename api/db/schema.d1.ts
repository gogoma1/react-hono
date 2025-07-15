import {
    integer,
    real,
    sqliteTable,
    text,
    primaryKey,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";


export const problemTypeEnum = ["객관식", "서답형", "논술형", "OX"] as const;
export const problemSetTypeEnum = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const problemSetStatusEnum = ["published", "private", "deleted"] as const;
export const copyrightTypeEnum = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;


/**
 * [신규] 출처 정보 마스터 테이블
 * 모든 문제의 출처(source)를 고유한 ID로 관리합니다.
 * 이름(name)은 UNIQUE가 아니므로, 다른 사용자가 같은 이름의 출처를 생성할 수 있습니다.
 */
export const sourcesTable = sqliteTable("sources", {
    id: text("id").primaryKey(), // 예: `src_${crypto.randomUUID()}`
    name: text("name").notNull(), // '쎈 수학' 등. unique 제약 조건 없음.
    // creator_id: text("creator_id"), // 필요 시 출처를 생성한 사용자 ID를 기록할 수 있음
});


/**
 * [수정] 문제 원본 데이터 테이블
 * 기존의 'source' 텍스트 필드를 'source_id' 외래 키로 변경합니다.
 */
export const problemTable = sqliteTable("problem", {
    problem_id: text("problem_id").primaryKey(),
    source_id: text("source_id").references(() => sourcesTable.id), // [수정] source(text) -> source_id(fk)
    page: integer("page"),
    question_number: real("question_number"),
    answer: text("answer"),
    problem_type: text("problem_type", { enum: problemTypeEnum }),
    grade: text("grade"),
    semester: text("semester"),
    creator_id: text("creator_id").notNull(),
    major_chapter_id: text("major_chapter_id").references(() => majorChaptersTable.id),
    middle_chapter_id: text("middle_chapter_id").references(() => middleChaptersTable.id),
    core_concept_id: text("core_concept_id").references(() => coreConceptsTable.id),
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
 * 출처 관련 정보를 저장하는 JSON 컬럼 대신, 총 문제 수를 저장하는 `problem_count` 컬럼만 추가합니다.
 */
export const problemSetTable = sqliteTable("problem_set", {
    problem_set_id: text("problem_set_id").primaryKey(),
    name: text("name").notNull(),
    creator_id: text("creator_id").notNull(),
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
    problem_count: integer("problem_count").notNull().default(0), // [수정] 총 문제 수 컬럼
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});

/**
 * 문제-문제집 연결 테이블 (기존과 동일)
 */
export const problemSetProblemsTable = sqliteTable("problem_set_problems", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    order: integer("order").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_set_id, table.problem_id] }),
}));

/**
 * [신규] 문제집-출처 연결 테이블
 * 어떤 문제집(problem_set_id)에 어떤 출처(source_id)의 문제가 몇 개(count) 있는지 저장합니다.
 */
export const problemSetSourcesTable = sqliteTable("problem_set_sources", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    source_id: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: 'cascade' }),
    count: integer("count").notNull().default(0),
}, (table) => ({
    // 한 문제집 내에서는 같은 source_id가 중복될 수 없습니다.
    pk: primaryKey({ columns: [table.problem_set_id, table.source_id] }),
}));


/**
 * 대단원 정보 테이블 (기존과 동일)
 */
export const majorChaptersTable = sqliteTable("major_chapters", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
});

/**
 * 중단원(소단원) 정보 테이블 (기존과 동일)
 */
export const middleChaptersTable = sqliteTable("middle_chapters", {
    id: text("id").primaryKey(),
    major_chapter_id: text("major_chapter_id").notNull().references(() => majorChaptersTable.id),
    name: text("name").notNull(),
}, (table) => ({
    unq: uniqueIndex('middle_chapters_major_id_name_unq').on(table.major_chapter_id, table.name),
}));

/**
 * 핵심 개념/유형 정보 테이블 (기존과 동일)
 */
export const coreConceptsTable = sqliteTable("core_concepts", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
});

/**
 * 계산 및 풀이 스킬 정보 테이블 (기존과 동일)
 */
export const calculationSkillsTable = sqliteTable("calculation_skills", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    skill_type: text("skill_type"),
});

/**
 * 문제와 계산 스킬의 다대다 관계를 위한 연결 테이블 (기존과 동일)
 */
export const problemCalculationSkillsTable = sqliteTable("problem_calculation_skills", {
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    skill_id: text("skill_id").notNull().references(() => calculationSkillsTable.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_id, table.skill_id] }),
}));

/**
 * 태그 정보 테이블 (기존과 동일)
 */
export const tagTable = sqliteTable("tag", {
    tag_id: text("tag_id").primaryKey(),
    name: text("name").notNull().unique(),
    tag_type: text("tag_type"),
});

/**
 * 문제와 태그의 다대다 관계를 위한 연결 테이블 (기존과 동일)
 */
export const problemTagTable = sqliteTable("problem_tag", {
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    tag_id: text("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_id, table.tag_id] }),
}));


// ------------------ RELATIONS (관계 정의) ------------------

/**
 * [신규] sources 테이블 관계
 */
export const sourcesRelations = relations(sourcesTable, ({ many }) => ({
    problemSetSources: many(problemSetSourcesTable),
    problems: many(problemTable),
}));

/**
 * [수정] problem 테이블 관계
 */
export const problemRelations = relations(problemTable, ({ one, many }) => ({
    source: one(sourcesTable, { // [수정] source(text) -> source(relation to sourcesTable)
        fields: [problemTable.source_id],
        references: [sourcesTable.id],
    }),
    majorChapter: one(majorChaptersTable, { fields: [problemTable.major_chapter_id], references: [majorChaptersTable.id] }),
    middleChapter: one(middleChaptersTable, { fields: [problemTable.middle_chapter_id], references: [middleChaptersTable.id] }),
    coreConcept: one(coreConceptsTable, { fields: [problemTable.core_concept_id], references: [coreConceptsTable.id] }),
    problemCalculationSkills: many(problemCalculationSkillsTable),
    problemTags: many(problemTagTable),
    problemSetProblems: many(problemSetProblemsTable),
}));

/**
 * [수정] problemSet 테이블 관계
 */
export const problemSetRelations = relations(problemSetTable, ({ many }) => ({
    problemSetProblems: many(problemSetProblemsTable),
    sources: many(problemSetSourcesTable), // [수정] 문제집이 여러 출처 정보를 가짐 (연결 테이블을 통해)
}));

/**
 * problemSetProblems 테이블 관계 (기존과 동일)
 */
export const problemSetProblemsRelations = relations(problemSetProblemsTable, ({ one }) => ({
    problemSet: one(problemSetTable, { fields: [problemSetProblemsTable.problem_set_id], references: [problemSetTable.problem_set_id] }),
    problem: one(problemTable, { fields: [problemSetProblemsTable.problem_id], references: [problemTable.problem_id] }),
}));

/**
 * [신규] problemSetSources 테이블 관계
 */
export const problemSetSourcesRelations = relations(problemSetSourcesTable, ({ one }) => ({
    problemSet: one(problemSetTable, {
        fields: [problemSetSourcesTable.problem_set_id],
        references: [problemSetTable.problem_set_id],
    }),
    source: one(sourcesTable, {
        fields: [problemSetSourcesTable.source_id],
        references: [sourcesTable.id],
    }),
}));


// --- 나머지 관계 정의 (기존과 동일) ---

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

export const calculationSkillsRelations = relations(calculationSkillsTable, ({ many }) => ({
    problemCalculationSkills: many(problemCalculationSkillsTable),
}));

export const problemCalculationSkillsRelations = relations(problemCalculationSkillsTable, ({ one }) => ({
    problem: one(problemTable, { fields: [problemCalculationSkillsTable.problem_id], references: [problemTable.problem_id] }),
    skill: one(calculationSkillsTable, { fields: [problemCalculationSkillsTable.skill_id], references: [calculationSkillsTable.id] }),
}));

export const tagRelations = relations(tagTable, ({ many }) => ({
    problemTags: many(problemTagTable),
}));

export const problemTagRelations = relations(problemTagTable, ({ one }) => ({
    problem: one(problemTable, { fields: [problemTagTable.problem_id], references: [problemTable.problem_id] }),
    tag: one(tagTable, { fields: [problemTagTable.tag_id], references: [tagTable.tag_id] }),
}));


// ------------------ TYPE INFERENCE (타입 추론) ------------------

export type DbProblem = typeof problemTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbProblemSetProblems = typeof problemSetProblemsTable.$inferSelect;
export type DbSource = typeof sourcesTable.$inferSelect; // [신규]
export type DbProblemSetSource = typeof problemSetSourcesTable.$inferSelect; // [신규]
export type DbMajorChapter = typeof majorChaptersTable.$inferSelect;
export type DbMiddleChapter = typeof middleChaptersTable.$inferSelect;
export type DbCoreConcept = typeof coreConceptsTable.$inferSelect;
export type DbCalculationSkill = typeof calculationSkillsTable.$inferSelect;
export type DbProblemCalculationSkill = typeof problemCalculationSkillsTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;