import type { Problem } from '../../problem/model/types';

export const PROBLEM_SET_TYPE_ENUM = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const PROBLEM_SET_STATUS_ENUM = ["published", "private", "deleted"] as const;
export const COPYRIGHT_TYPE_ENUM = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;

export type ProblemSetType = typeof PROBLEM_SET_TYPE_ENUM[number];
export type ProblemSetStatus = typeof PROBLEM_SET_STATUS_ENUM[number];
export type CopyrightType = typeof COPYRIGHT_TYPE_ENUM[number];

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
    grade: string | null;
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
    grade: string | null;
    semester: string | null;
    avg_difficulty: string | null;
    created_at: string;
    updated_at: string;
    problem_count: number;
}

// [수정] 이 타입은 더 이상 사용되지 않거나, PG 권한 생성용으로 단순화될 수 있습니다.
// 여기서는 createEntitlementAPI가 자체 타입을 가지므로, 혼동을 피하기 위해 주석 처리하거나 제거할 수 있습니다.
/*
export interface CreateProblemSetPayload {
    name: string;
    description: string | null;
    type: ProblemSetType;
    status: ProblemSetStatus;
    copyright_type: CopyrightType;
    copyright_source: string | null;
}
*/

// [신규] PG 권한 생성을 위한 명확한 타입
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