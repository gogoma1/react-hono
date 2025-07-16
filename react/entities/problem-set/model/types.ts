import type { Problem } from '../../problem/model/types';

export const PROBLEM_SET_TYPE_ENUM = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const PROBLEM_SET_STATUS_ENUM = ["published", "private", "deleted"] as const;
export const COPYRIGHT_TYPE_ENUM = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;

export type ProblemSetType = typeof PROBLEM_SET_TYPE_ENUM[number];
export type ProblemSetStatus = typeof PROBLEM_SET_STATUS_ENUM[number];
export type CopyrightType = typeof COPYRIGHT_TYPE_ENUM[number];


// [수정] 구조적 소제목 정보를 나타내도록 타입명과 필드명 변경
export interface ProblemSetSubtitleInfo {
    subtitle_id: string;
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
    copyright_source: string | null; // 저작권 출처는 그대로 유지
    description: string | null;
    cover_image: string | null;
    published_year: number | null;
    grade_id: string | null;
    grade: string | null;
    semester: string | null;
    avg_difficulty: string | null;
    created_at: string;
    updated_at: string;
    problem_count: number;
    subtitles: ProblemSetSubtitleInfo[]; // [수정] sources -> subtitles
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
    grade_id: string | null;
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
    subtitleId: string; // [수정] 문제를 추가할 소제목의 ID
}

export interface UpdateProblemSetPayload {
    name?: string;
    description?: string | null;
    status?: ProblemSetStatus;
}

export type ProblemSetFinalPayload = Pick<MyProblemSet, 'type' | 'status' | 'copyright_type' | 'copyright_source'>;



/**
 * GET /my-grouped-view API의 응답 타입
 * 문제집(브랜드) > 학년 > 소제목(Subtitle) 계층 구조를 나타냅니다.
 */
// [수정] GroupedSource -> GroupedSubtitle
export interface GroupedSubtitle {
    subtitle_id: string;
    subtitle_name: string;
    problem_count: number;
}

export interface GroupedGrade {
    grade_id: string;
    grade_name: string;
    grade_order: number;
    subtitles: GroupedSubtitle[]; // [수정] sources -> subtitles
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