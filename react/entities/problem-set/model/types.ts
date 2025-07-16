import type { Problem } from '../../problem/model/types';

export const PROBLEM_SET_TYPE_ENUM = ["PUBLIC_ADMIN", "PRIVATE_USER"] as const;
export const PROBLEM_SET_STATUS_ENUM = ["published", "private", "deleted"] as const;
export const COPYRIGHT_TYPE_ENUM = ["ORIGINAL_CREATION", "COPYRIGHTED_MATERIAL"] as const;

export type ProblemSetType = typeof PROBLEM_SET_TYPE_ENUM[number];
export type ProblemSetStatus = typeof PROBLEM_SET_STATUS_ENUM[number];
export type CopyrightType = typeof COPYRIGHT_TYPE_ENUM[number];

export interface Folder {
    id: string;
    name: string;
    creator_id: string;
    created_at: string;
    problem_set_id: string;
    grade_id: string;
}

export interface LibrarySelection {
    key: string;
    type: 'new' | 'problemSet' | 'grade' | 'subtitle' | 'curriculum' | 'folder';
    problemSetId?: string;
    problemSetName?: string;
    gradeId?: string;
    gradeName?: string;
    subtitleId?: string;
    subtitleName?: string;
    majorChapterId?: string;
    middleChapterId?: string;
    folderId?: string;
    folderName?: string;
}

// [신규] 소제목 이동 API 응답 타입
export interface UpdatedSubtitle {
    id: string;
    name: string;
    folder_id: string | null;
}

export interface ProblemSetSubtitleInfo {
    subtitle_id: string;
    name: string;
    count: number;
}

export interface MyProblemSet {
    problem_set_id: string;
    name: string;
    creator_id: string;
    folder_id: string | null;
    type: ProblemSetType;
    status: ProblemSetStatus;
    copyright_type: CopyrightType;
    copyright_source: string | null;
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
    subtitles: ProblemSetSubtitleInfo[];
    marketplace_status: 'draft' | 'in_review' | 'active' | 'inactive' | 'deleted' | 'not_listed';
}

export interface CreatedProblemSet {
    problem_set_id: string;
    name: string;
    creator_id: string;
    folder_id: string | null; 
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

/**
 * [핵심 수정] 기존 문제집에 문제를 추가할 때 보내는 페이로드 타입입니다.
 * 백엔드가 subtitleName과 folderId를 받도록 변경되었으므로 타입을 일치시킵니다.
 */
export interface AddProblemsToSetPayload {
    problems: Problem[];
    subtitleName: string; 
    folderId?: string | null; // [신규]
}


export interface UpdateProblemSetPayload {
    name?: string;
    description?: string | null;
    status?: ProblemSetStatus;
    folder_id?: string | null;
}

export type ProblemSetFinalPayload = Pick<MyProblemSet, 'type' | 'status' | 'copyright_type' | 'copyright_source'>;

export interface GroupedSubtitle {
    subtitle_id: string;
    subtitle_name: string;
    problem_count: number;
    type: 'subtitle';
}

export interface SubtitleGroup extends Folder {
    subtitles: GroupedSubtitle[];
    type: 'folder';
}

export interface GroupedGrade {
    grade_id: string;
    grade_name: string;
    grade_order: number;
    subtitles: GroupedSubtitle[];
    folders: SubtitleGroup[];
}

export interface GroupedProblemSet {
    problem_set_id: string;
    problem_set_name: string;
    grades: GroupedGrade[];
}

export interface MyLibraryData {
    folders: Folder[];
    problemSets: GroupedProblemSet[];
}

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