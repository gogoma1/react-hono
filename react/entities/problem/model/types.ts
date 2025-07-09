// ----- ./react/entities/problem/model/types.ts -----

/**
 * [신규] 백엔드 D1 스키마의 problemTypeEnum과 동기화된 상수입니다.
 * 문제 유형에 대한 유일한 정보 소스(Single Source of Truth) 역할을 합니다.
 */
export const PROBLEM_TYPES = ["객관식", "서답형", "논술형", "OX"] as const;

/**
 * [신규] PROBLEM_TYPES 상수를 기반으로 생성된 엄격한 타입입니다.
 */
export type ProblemType = typeof PROBLEM_TYPES[number];

export interface Problem {
    problem_id: string; 
    source: string;
    page: number | null;
    question_number: number;
    answer: string;
    /**
     * [핵심 수정] problem_type의 타입을 string에서 엄격한 ProblemType으로 변경합니다.
     */
    problem_type: ProblemType;
    grade: string;
    semester: string;
    major_chapter_id: string;
    middle_chapter_id: string;
    core_concept_id: string;
    problem_category: string;
    difficulty: string;
    score: string;
    question_text: string;
    solution_text: string | null; 
}

export interface Column {
	key: keyof Problem;
	label: string;
	readonly?: boolean;
	editType?: 'combobox' | 'textarea' | 'number' | 'text';
}

export type ComboboxOption = {
    value: string;
    label: string;
};