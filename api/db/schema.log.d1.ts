import {
    integer,
    sqliteTable,
    text,
    primaryKey,
    index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * 학생의 문제별 풀이 결과를 저장하는 테이블 (Cloudflare D1 - Log DB)
 * 이 테이블은 쓰기 작업이 매우 빈번하며, 대량의 데이터가 쌓입니다.
 * Supabase PG의 exam_assignments, profiles 테이블과 D1의 problem 테이블을 참조합니다.
 */
export const studentProblemResultsTable = sqliteTable("student_problem_results", {
    /**
     * 한 시험(assignment)에서 한 학생이 푼 문제 결과는 유일해야 합니다.
     * 따라서 assignment_id와 problem_id를 복합 기본 키로 사용합니다.
     * 이 값들은 PostgreSQL 및 다른 D1 데이터베이스의 UUID를 참조합니다.
     */
    assignment_id: text("assignment_id").notNull(),
    problem_id: text("problem_id").notNull(),
    
    /**
     * 어떤 학생의 결과인지 식별하기 위한 ID. PostgreSQL의 profiles.id를 참조합니다.
     * 데이터 조회의 핵심 키이므로 인덱싱을 고려해야 합니다. (D1은 자동 인덱싱 지원)
     */
    student_id: text("student_id").notNull(),

    /**
     * 문제 풀이 결과에 대한 핵심 지표들
     */
    // [핵심 수정] is_correct 컬럼을 boolean 모드의 integer로 변경합니다.
    // DB에는 0 또는 1로 저장되지만, 코드에서는 true/false로 다룰 수 있습니다.
    is_correct: integer("is_correct", { mode: 'boolean' }), 
    
    // 해당 문제를 푸는 데 순수하게 소요된 시간 (초)
    time_taken_seconds: integer("time_taken_seconds").notNull(),
    // 학생이 최종적으로 제출한 답안. (객관식: '①', '②' / 서답형: 'x=5' 등)
    submitted_answer: text("submitted_answer"),
    // 학생의 메타인지 상태 ('A', 'B', 'C', 'D')
    meta_cognition_status: text("meta_cognition_status", { enum: ['A', 'B', 'C', 'D'] }),
    // 학생이 답을 변경한 횟수
    answer_change_count: integer("answer_change_count").notNull().default(0),

    // 이 로그 레코드가 D1에 기록된 시각
    created_at: text("created_at").default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),

}, (table) => ({
    // 복합 기본 키 설정
    pk: primaryKey({ columns: [table.assignment_id, table.problem_id] }),
    studentIdx: index("student_id_idx").on(table.student_id),
}));


/**
 * Drizzle ORM에서 사용할 타입 추론
 */
export type StudentProblemResult = typeof studentProblemResultsTable.$inferSelect;
export type NewStudentProblemResult = typeof studentProblemResultsTable.$inferInsert;