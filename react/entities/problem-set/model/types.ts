import type { Problem } from '../../problem/model/types';

export const PROBLEM_SET_TYPE_ENUM = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const PROBLEM_SET_STATUS_ENUM = ["published", "private", "deleted"] as const;
export const COPYRIGHT_TYPE_ENUM = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;

export type ProblemSetType = typeof PROBLEM_SET_TYPE_ENUM[number];
export type ProblemSetStatus = typeof PROBLEM_SET_STATUS_ENUM[number];
export type CopyrightType = typeof COPYRIGHT_TYPE_ENUM[number];

// --- 기존 타입들 ---

export interface ProblemSetSourceInfo {
    source_id: string;
    name: string;
    count: number;
}

export interface MyProblemSet {
    problem_set_id: string;
    name: string;
    creator_id: string;
    type: ProblemSetType;
    status: ProblemSetStatus;
    copyright_type: CopyrightType;
    copyright_source: string | null;
    description: string | null;
    cover_image: string | null;
    published_year: number | null;
    grade_id: string | null; // 스키마 변경에 따라 grade -> grade_id 로 변경될 수 있음 (백엔드 응답 확인 필요)
    grade: string | null; // 호환성을 위해 유지하거나, 백엔드 응답에 따라 제거
    semester: string | null;
    avg_difficulty: string | null;
    created_at: string;
    updated_at: string;
    problem_count: number;
    sources: ProblemSetSourceInfo[];
    marketplace_status: 'draft' | 'in_review' | 'active' | 'inactive' | 'deleted' | 'not_listed';
}

export interface CreatedProblemSet {
    problem_set_id: string;
    name: string;
    creator_id: string;
    type: ProblemSetType;
    status: ProblemSetStatus;
    copyright_type: CopyrightType;
    copyright_source: string | null;
    description: string | null;
    cover_image: string | null;
    published_year: number | null;
    grade_id: string | null; // 스키마 변경에 따라 추가
    semester: string | null;
    avg_difficulty: string | null;
    created_at: string;
    updated_at: string;
    problem_count: number;
}

export interface CreateEntitlementPayload {
    problem_set_id: string;
}

export interface AddProblemsToSetPayload {
    problems: Problem[];
}

export interface UpdateProblemSetPayload {
    name?: string;
    description?: string | null;
    status?: ProblemSetStatus;
}

export type ProblemSetFinalPayload = Pick<MyProblemSet, 'type' | 'status' | 'copyright_type' | 'copyright_source'>;


// --- [신규] 계층적 뷰를 위한 API 응답 타입들 ---

/**
 * GET /my-grouped-view API의 응답 타입
 * 문제집(브랜드) > 학년 > 소제목(Source) 계층 구조를 나타냅니다.
 */
export interface GroupedSource {
    source_id: string;
    source_name: string;
    problem_count: number;
}

export interface GroupedGrade {
    grade_id: string;
    grade_name: string;
    grade_order: number;
    sources: GroupedSource[];
}

export interface GroupedProblemSet {
    problem_set_id: string;
    problem_set_name: string;
    grades: GroupedGrade[];
}

/**
 * GET /my-curriculum-view API의 응답 타입
 * 학년 > 대단원 > 중단원 계층 구조를 나타냅니다.
 */
export interface CurriculumMiddleChapter {
    middle_chapter_id: string;
    middle_chapter_name: string;
    problem_count: number;
}

export interface CurriculumMajorChapter {
    major_chapter_id: string;
    major_chapter_name: string;
    middleChapters: CurriculumMiddleChapter[];
}

export interface CurriculumGrade {
    grade_id: string;
    grade_name: string;
    grade_order: number;
    majorChapters: CurriculumMajorChapter[];
}