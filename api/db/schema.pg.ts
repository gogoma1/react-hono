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
    primaryKey, // problem_tag_table 복합 PK 예시용 (현재는 단일 uuid id 사용)
    // foreignKey, // 명시적 FK 정의가 필요하다면 (Drizzle은 references()로 처리)
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; // raw SQL 사용 및 default 값 설정용

// --- Enum 타입 정의 ---
// 데이터베이스에 'student_status_enum'이라는 이름으로 enum 타입 생성됨
export const studentStatusEnum = pgEnum('student_status_enum', ['재원', '휴원', '퇴원']);

// --- 사용자 프로필 및 학생 정보 테이블 ---

/**
 * 사용자 프로필 테이블.
 * id는 외부 인증 시스템(예: Supabase의 auth.users 테이블)의 사용자 ID를 참조합니다.
 * 이 테이블의 레코드는 사용자가 인증 시스템에 등록된 후, 추가 프로필 정보를 입력할 때 생성됩니다.
 */
export const profilesTable = pgTable("profiles", {
    // 이 id는 외부 인증 시스템(예: Supabase auth.users)의 id를 직접 값으로 가집니다.
    // 따라서 .default(sql`gen_random_uuid()`)를 사용하지 않습니다.
    // 데이터베이스 레벨에서 FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 제약조건 설정을 권장합니다.
    // Drizzle ORM 스키마 파일에서는 이 외부 스키마(auth)의 테이블을 직접 references()로 연결하기 어렵지만,
    // 마이그레이션 파일에서 raw SQL로 FK를 추가할 수 있습니다.
    id: uuid("id").primaryKey(),

    // email은 auth.users.email과 동기화되거나 동일한 값을 가져야 합니다.
    // auth.users 테이블에 이미 email에 대한 unique 제약이 있으므로,
    // 여기서는 unique 제약을 걸지 않거나, 혹은 중복 방지를 위해 걸 수도 있습니다.
    // 만약 auth.users.email이 변경될 때 동기화 로직이 없다면, 이 email은 최신이 아닐 수 있습니다.
    // 이메일은 auth 시스템에서 관리하고 여기서는 참조만 하는 것이 일반적일 수 있습니다.
    // 여기서는 스키마에 유지하며, unique 제약도 추가합니다 (애플리케이션 정책에 따라 조절).
    email: text("email").notNull().unique(),

    name: text("name").notNull(), // 사용자가 설정하는 프로필 이름
    position: text("position").notNull(), // 예: 학생, 원장, 강사, 학부모
    academy_name: text("academy_name").notNull(),
    region: text("region").notNull(),
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const studentsTable = pgTable("students", {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`), // 학생 고유 ID
    tuition: integer("tuition"), // 수강료
    admission_date: date("admission_date"), // 입학일 (YYYY-MM-DD)
    discharge_date: date("discharge_date"), // 퇴학일 (YYYY-MM-DD)
    // principal_id는 profilesTable의 id (즉, auth.users.id)를 참조. 원장/관리자 ID.
    principal_id: uuid("principal_id").references(() => profilesTable.id, { onDelete: 'set null' }),
    grade: text("grade").notNull(), // 학년
    student_phone: text("student_phone"), // 학생 연락처
    guardian_phone: text("guardian_phone"), // 보호자 연락처
    school_name: text("school_name"), // 학교명
    class_name: text("class_name"), // 반 이름 (SQL 예약어 'class' 회피)
    student_name: text("student_name").notNull(), // 학생 이름
    teacher: text("teacher"), // 담당 강사 (profilesTable.id 참조 가능 또는 텍스트)
    status: studentStatusEnum("status").notNull(), // 학생 상태 (재원, 휴원, 퇴원)
    subject: text("subject").notNull(), // 주요 과목
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

// --- 문제집 및 문제 관련 테이블 ---
export const problemSetTable = pgTable("problem_set", {
    problem_set_id: uuid("problem_set_id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    grade: text("grade"), // 대상 학년
    semester: text("semester"), // 대상 학기
    avg_difficulty: text("avg_difficulty"), // 평균 난이도 (텍스트 또는 numeric/real 타입 고려)
    cover_image: text("cover_image"), // 표지 이미지 URL
    description: text("description"), // 설명
    published_year: integer("published_year"), // 출판 연도
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const majorChaptersTable = pgTable("major_chapters", { // 대단원
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 대단원명
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const middleChaptersTable = pgTable("middle_chapters", { // 중단원
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    major_chapter_id: uuid("major_chapter_id").notNull().references(() => majorChaptersTable.id, { onDelete: 'cascade' }), // 대단원 ID 참조
    name: text("name").notNull(), // 중단원명 (대단원 내에서 unique할 수도 있음)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const coreConceptsTable = pgTable("core_concepts", { // 핵심 개념
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 핵심 개념명
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const problemTable = pgTable("problem", {
    problem_id: uuid("problem_id").primaryKey().default(sql`gen_random_uuid()`),
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'set null' }), // 문제집 ID 참조
    source: text("source"), // 출처 (예: 문제집명, 모의고사명)
    page: integer("page"), // 페이지 번호
    question_number: real("question_number"), // 문제 번호 (소수점 가능, 예: 3.1)
    answer: text("answer"), // 정답
    problem_type: text("problem_type"), // 문제 유형 (예: 객관식, 주관식)
    // creator_id는 profilesTable의 id (즉, auth.users.id)를 참조. 문제 출제자.
    creator_id: uuid("creator_id").notNull().references(() => profilesTable.id, { onDelete: 'restrict' }), // restrict: 출제자 프로필 삭제 시 문제 삭제 방지 (정책에 따라 cascade, set null 등)
    major_chapter_id: uuid("major_chapter_id").references(() => majorChaptersTable.id, { onDelete: 'set null' }), // 대단원 ID 참조
    middle_chapter_id: uuid("middle_chapter_id").references(() => middleChaptersTable.id, { onDelete: 'set null' }), // 중단원 ID 참조
    core_concept_id: uuid("core_concept_id").references(() => coreConceptsTable.id, { onDelete: 'set null' }), // 핵심 개념 ID 참조
    problem_category: text("problem_category"), // 문제 카테고리
    difficulty: text("difficulty"), // 난이도 (텍스트 또는 numeric/real 타입 고려)
    score: text("score"),           // 배점 (텍스트 또는 numeric/real 타입 고려)
    question_text: text("question_text"), // 문제 본문 (긴 텍스트)
    option_text: text("option_text"),   // 객관식 선택지 (JSONB 타입 고려 가능)
    solution_text: text("solution_text"), // 해설 (긴 텍스트)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

export const tagTable = pgTable("tag", {
    tag_id: uuid("tag_id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(), // 태그명
    tag_type: text("tag_type"), // 태그 유형 (예: 개념, 유형, 출처)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

// 문제와 태그의 다대다 관계를 위한 연결 테이블
export const problemTagTable = pgTable("problem_tag", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // 연결 테이블 자체의 고유 ID
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), // 문제 ID 참조
    tag_id: uuid("tag_id").notNull().references(() => tagTable.tag_id, { onDelete: 'cascade' }), // 태그 ID 참조
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => {
    return {
        // (problem_id, tag_id) 조합이 고유하도록 unique 제약 추가 (선택 사항, 중복 연결 방지)
        // pk: primaryKey({ columns: [table.problem_id, table.tag_id] }), // id 컬럼 대신 복합 PK 사용 시
        unqProblemTag: sql`UNIQUE (${table.problem_id}, ${table.tag_id})`,
    };
});

// 사용자 구매 정보 테이블
export const userPurchaseTable = pgTable("user_purchase", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // user_id는 profilesTable의 id (즉, auth.users.id)를 참조. 구매자.
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }), // 사용자 삭제 시 구매 내역도 삭제 (정책에 따라)
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'set null' }), // 구매한 문제집 ID (문제집 삭제 시 null로 설정)
    purchase_date: timestamp("purchase_date", { mode: "date", withTimezone: true }), // 구매일
    purchase_price: integer("purchase_price"), // 구매 가격
    license_period: integer("license_period"), // 라이선스 기간 (예: 일 단위)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

// 사용자 문제 풀이 로그 테이블
export const userProblemLogTable = pgTable("user_problem_log", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // user_id는 profilesTable의 id (즉, auth.users.id)를 참조. 문제 푼 사용자.
    user_id: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
    problem_id: uuid("problem_id").references(() => problemTable.problem_id, { onDelete: 'cascade' }), // 푼 문제 ID (문제 삭제 시 로그도 삭제)
    is_correct: boolean("is_correct"), // 정답 여부
    a_solved: boolean("a_solved").default(false).notNull(), // (분석용 플래그)
    q_unknown: boolean("q_unknown").default(false).notNull(), // (분석용 플래그)
    t_think: boolean("t_think").default(false).notNull(), // (분석용 플래그)
    qt_failed: boolean("qt_failed").default(false).notNull(), // (분석용 플래그)
    time_taken: integer("time_taken"), // 문제 풀이 시간 (예: 초 단위)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`), // 풀이 시점
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
});

// 문제 통계 테이블
export const problemStatsTable = pgTable("problem_stats", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // 통계 레코드 자체의 ID
    problem_set_id: uuid("problem_set_id").references(() => problemSetTable.problem_set_id, { onDelete: 'cascade' }), // 통계 대상 문제집 (선택적)
    problem_id: uuid("problem_id").notNull().references(() => problemTable.problem_id, { onDelete: 'cascade' }), // 통계 대상 문제 ID
    attempt_count: integer("attempt_count").default(0).notNull(), // 시도 횟수
    correct_count: integer("correct_count").default(0).notNull(), // 정답 횟수
    wrong_rate: real("wrong_rate"), // 오답률 (계산된 값, numeric(정밀도, 스케일) 타입 고려)
    avg_time: integer("avg_time"), // 평균 풀이 시간 (예: 초 단위)
    created_at: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
    updated_at: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`now()`),
}, (table) => {
    return {
        // (problem_id) 또는 (problem_set_id, problem_id) 조합이 고유하도록 unique 제약 추가
        unqProblemStats: sql`UNIQUE (${table.problem_id})`, // 문제별 통계는 하나만 존재
        // unqProblemSetProblemStats: sql`UNIQUE (${table.problem_set_id}, ${table.problem_id})`, // 문제집 내 문제별 통계
    };
});

// --- 타입 정의 (Select 시 타입 추론용) ---
// Drizzle 스키마에서 직접 추론하는 타입. 컬럼 타입과 동일.
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