import type { ProblemType } from '../../problem/model/types';

/**
 * 리포트의 종합 분석 정보를 나타내는 타입
 */
export interface ReportSummary {
    assignment_id: string;
    student_name: string;
    exam_title: string;
    correct_rate: number | null;
    total_duration_seconds: number | null;
    total_pure_time_seconds: number | null;
    completed_at: string;
    total_problems: number;
    attempted_problems: number;
    answer_change_total_count: number; // [추가] 이 필드가 누락되었습니다.
}

/**
 * 리포트의 시각적 분석 데이터를 나타내는 타입
 */
export interface ReportAnalytics {
    time_per_problem: {
        problem_number: string;
        time_taken: number;
        is_correct: boolean | null;
    }[];
    average_time_per_problem: number | null;
    metacognition_summary: {
        overall_score: number | null;
        distribution: {
            status: 'A' | 'B' | 'C' | 'D';
            count: number;
        }[];
    };
    performance_by_difficulty: {
        difficulty: string;
        correct_rate: number;
    }[];
}

/**
 * 개별 문제 결과에 대한 상세 정보 타입
 */
export interface ReportProblemResult {
    problem_id: string;
    is_correct: boolean | null;
    time_taken_seconds: number;
    submitted_answer: string | string[] | null;
    meta_cognition_status: 'A' | 'B' | 'C' | 'D' | null;
    answer_change_count: number;
    problem: {
        question_number: number;
        display_question_number: string;
        question_text: string;
        answer: string;
        solution_text: string | null;
        problem_type: ProblemType;
        major_chapter_name: string | null;
        middle_chapter_name: string | null;
        difficulty: string | null;
        score: string | null;
    };
}

/**
 * 프론트엔드에서 생성하거나 API를 통해 받을 리포트의 전체 데이터 타입
 */
export interface FullExamReport {
  summary: ReportSummary;
  analytics: ReportAnalytics;
  problem_results: ReportProblemResult[];
}