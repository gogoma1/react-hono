import {
    integer,
    real,
    sqliteTable,
    text,
    primaryKey,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// --- Enums ---
export const problemTypeEnum = ["객관식", "서답형", "논술형", "OX"] as const;
export const problemSetTypeEnum = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const problemSetStatusEnum = ["published", "private", "deleted"] as const;
export const copyrightTypeEnum = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;


// --- 마스터 데이터 테이블 ---

/**
 * [신규] 학년 정보 마스터 테이블
 * 모든 학년 정보를 고유 ID와 정렬 순서로 관리합니다. (예: '고1', '중3')
 * 이 테이블의 데이터는 거의 변경되지 않는 Seeding 데이터입니다.
 */
export const gradesTable = sqliteTable("grades", {
    id: text("id").primaryKey(), // 예: 'g10' (고1), 'm7' (중1)
    name: text("name").notNull().unique(), // 예: '고1', '중1'
    order: integer("order").notNull(), // 정렬을 위한 순서 (예: 초1=1, ..., 고3=12)
});

/**
 * [역할 재정의] 소제목(구: 출처) 정보 마스터 테이블
 * 
 * [사용 목적]
 * 이 테이블은 문제의 구체적인 출처나 시리즈명을 저장하는 '소제목' 역할을 합니다.
 * 'problem_set'이 '쎈'이라는 브랜드를 나타낸다면, 이 테이블의 'name'은 '쎈 중등수학 2-2'와 같은 구체적인 시리즈명이 됩니다.
 * 
 * [주의]
 * - 이 테이블의 레코드는 다른 문제에서 참조될 수 있으므로 **삭제에 매우 신중해야 합니다.** (현재 스키마에서는 cascade 삭제 미적용)
 * - 이름(name)은 UNIQUE가 아니므로, 다른 사용자가 같은 이름의 소제목을 생성할 수 있습니다.
 */
export const sourcesTable = sqliteTable("sources", {
    id: text("id").primaryKey(), // 예: `src_${crypto.randomUUID()}`
    name: text("name").notNull(), 
});


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


// --- 핵심 데이터 테이블 ---

/**
 * [수정] 문제 원본 데이터 테이블
 * 'grade' 텍스트 필드를 'grade_id' 외래 키로 변경합니다.
 * 'source_id'는 이제 '소제목'을 참조하는 ID가 됩니다.
 */
export const problemTable = sqliteTable("problem", {
    problem_id: text("problem_id").primaryKey(),
    source_id: text("source_id").references(() => sourcesTable.id), // 소제목 ID
    page: integer("page"),
    question_number: real("question_number"),
    answer: text("answer"),
    problem_type: text("problem_type", { enum: problemTypeEnum }),
    grade_id: text("grade_id").references(() => gradesTable.id), // [수정] grade(text) -> grade_id(fk)
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
 * 
 * [사용 목적]
 * 이 테이블의 레코드는 '쎈', '자이스토리'와 같은 **콘텐츠 브랜드** 또는 '내신대비 기출'과 같은 **최상위 프로젝트**를 의미합니다.
 * 
 * [수정 사항]
 * - 대표 학년 'grade' 텍스트 필드를 'grade_id' 외래 키로 변경합니다.
 */
export const problemSetTable = sqliteTable("problem_set", {
    problem_set_id: text("problem_set_id").primaryKey(),
    name: text("name").notNull(), // 브랜드 또는 프로젝트 이름
    creator_id: text("creator_id").notNull(),
    type: text("type", { enum: problemSetTypeEnum }).notNull().default("PRIVATE_USER"),
    status: text("status", { enum: problemSetStatusEnum }).notNull().default("private"),
    copyright_type: text("copyright_type", { enum: copyrightTypeEnum }).notNull().default("ORIGINAL_CREATION"),
    copyright_source: text("copyright_source"),
    description: text("description"),
    cover_image: text("cover_image"),
    published_year: integer("published_year"),
    grade_id: text("grade_id").references(() => gradesTable.id), // [수정] 대표 학년 ID
    semester: text("semester"),
    avg_difficulty: text("avg_difficulty"),
    problem_count: integer("problem_count").notNull().default(0),
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
    updated_at: text("updated_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
});


// --- 연결 테이블 ---

/**
 * 문제-문제집 연결 테이블
 * 어떤 '브랜드/프로젝트'(problem_set)에 어떤 '문제'(problem)가 속하는지 정의합니다.
 */
export const problemSetProblemsTable = sqliteTable("problem_set_problems", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }),
    order: integer("order").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_set_id, table.problem_id] }),
}));

/**
 * 문제집-소제목 연결 테이블
 * 어떤 '브랜드/프로젝트'(problem_set)에 어떤 '소제목'(source)의 문제가 몇 개 있는지 저장하는 카운팅 테이블입니다.
 */
export const problemSetSourcesTable = sqliteTable("problem_set_sources", {
    problem_set_id: text("problem_set_id").notNull().references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }),
    source_id: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: 'cascade' }),
    count: integer("count").notNull().default(0),
}, (table) => ({
    pk: primaryKey({ columns: [table.problem_set_id, table.source_id] }),
}));

// --- 기타 테이블 (기존과 동일) ---
export const calculationSkillsTable = sqliteTable("calculation_skills", { id: text("id").primaryKey(), name: text("name").notNull().unique(), skill_type: text("skill_type"), });
export const problemCalculationSkillsTable = sqliteTable("problem_calculation_skills", { problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), skill_id: text("skill_id").notNull().references(() => calculationSkillsTable.id, { onDelete: 'cascade' }), }, (table) => ({ pk: primaryKey({ columns: [table.problem_id, table.skill_id] }), }));
export const tagTable = sqliteTable("tag", { tag_id: text("tag_id").primaryKey(), name: text("name").notNull().unique(), tag_type: text("tag_type"), });
export const problemTagTable = sqliteTable("problem_tag", { problem_id: text("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), tag_id: text("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }), }, (table) => ({ pk: primaryKey({ columns: [table.problem_id, table.tag_id] }), }));


// -----------------------------------------------------------------------------
// --- RELATIONS (관계 정의) ---
// -----------------------------------------------------------------------------

export const gradesRelations = relations(gradesTable, ({ many }) => ({
    problems: many(problemTable),
    problemSets: many(problemSetTable),
}));

export const sourcesRelations = relations(sourcesTable, ({ many }) => ({
    problemSetSources: many(problemSetSourcesTable),
    problems: many(problemTable),
}));

export const problemRelations = relations(problemTable, ({ one, many }) => ({
    source: one(sourcesTable, { fields: [problemTable.source_id], references: [sourcesTable.id] }),
    grade: one(gradesTable, { fields: [problemTable.grade_id], references: [gradesTable.id] }),
    majorChapter: one(majorChaptersTable, { fields: [problemTable.major_chapter_id], references: [majorChaptersTable.id] }),
    middleChapter: one(middleChaptersTable, { fields: [problemTable.middle_chapter_id], references: [middleChaptersTable.id] }),
    coreConcept: one(coreConceptsTable, { fields: [problemTable.core_concept_id], references: [coreConceptsTable.id] }),
    problemCalculationSkills: many(problemCalculationSkillsTable),
    problemTags: many(problemTagTable),
    problemSetProblems: many(problemSetProblemsTable),
}));

export const problemSetRelations = relations(problemSetTable, ({ one, many }) => ({
    grade: one(gradesTable, { fields: [problemSetTable.grade_id], references: [gradesTable.id] }),
    problemSetProblems: many(problemSetProblemsTable),
    sources: many(problemSetSourcesTable), 
}));

export const problemSetProblemsRelations = relations(problemSetProblemsTable, ({ one }) => ({
    problemSet: one(problemSetTable, { fields: [problemSetProblemsTable.problem_set_id], references: [problemSetTable.problem_set_id] }),
    problem: one(problemTable, { fields: [problemSetProblemsTable.problem_id], references: [problemTable.problem_id] }),
}));

export const problemSetSourcesRelations = relations(problemSetSourcesTable, ({ one }) => ({
    problemSet: one(problemSetTable, { fields: [problemSetSourcesTable.problem_set_id], references: [problemSetTable.problem_set_id] }),
    source: one(sourcesTable, { fields: [problemSetSourcesTable.source_id], references: [sourcesTable.id] }),
}));

export const majorChaptersRelations = relations(majorChaptersTable, ({ many }) => ({ middleChapters: many(middleChaptersTable), problems: many(problemTable), }));
export const middleChaptersRelations = relations(middleChaptersTable, ({ one, many }) => ({ majorChapter: one(majorChaptersTable, { fields: [middleChaptersTable.major_chapter_id], references: [majorChaptersTable.id] }), problems: many(problemTable), }));
export const coreConceptsRelations = relations(coreConceptsTable, ({ many }) => ({ problems: many(problemTable), }));
export const calculationSkillsRelations = relations(calculationSkillsTable, ({ many }) => ({ problemCalculationSkills: many(problemCalculationSkillsTable), }));
export const problemCalculationSkillsRelations = relations(problemCalculationSkillsTable, ({ one }) => ({ problem: one(problemTable, { fields: [problemCalculationSkillsTable.problem_id], references: [problemTable.problem_id] }), skill: one(calculationSkillsTable, { fields: [problemCalculationSkillsTable.skill_id], references: [calculationSkillsTable.id] }), }));
export const tagRelations = relations(tagTable, ({ many }) => ({ problemTags: many(problemTagTable), }));
export const problemTagRelations = relations(problemTagTable, ({ one }) => ({ problem: one(problemTable, { fields: [problemTagTable.problem_id], references: [problemTable.problem_id] }), tag: one(tagTable, { fields: [problemTagTable.tag_id], references: [tagTable.tag_id] }), }));


// -----------------------------------------------------------------------------
// --- TYPE INFERENCE (타입 추론) ---
// -----------------------------------------------------------------------------

export type DbGrade = typeof gradesTable.$inferSelect;
export type DbProblem = typeof problemTable.$inferSelect;
export type DbProblemSet = typeof problemSetTable.$inferSelect;
export type DbProblemSetProblems = typeof problemSetProblemsTable.$inferSelect;
export type DbSource = typeof sourcesTable.$inferSelect; 
export type DbProblemSetSource = typeof problemSetSourcesTable.$inferSelect; 
export type DbMajorChapter = typeof majorChaptersTable.$inferSelect;
export type DbMiddleChapter = typeof middleChaptersTable.$inferSelect;
export type DbCoreConcept = typeof coreConceptsTable.$inferSelect;
export type DbCalculationSkill = typeof calculationSkillsTable.$inferSelect;
export type DbProblemCalculationSkill = typeof problemCalculationSkillsTable.$inferSelect;
export type DbTag = typeof tagTable.$inferSelect;
export type DbProblemTag = typeof problemTagTable.$inferSelect;