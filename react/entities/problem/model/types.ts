// ./react/entities/problem/model/types.ts

export interface Problem {
    problem_id: string; 
    source: string;
    page: number | null;
    question_number: number;
    answer: string;
    problem_type: string;
    grade: string;
    semester: string;
    major_chapter_id: string;
    middle_chapter_id: string;
    core_concept_id: string;
    problem_category: string;
    difficulty: string;
    score: string;
    question_text: string;
    // [핵심 수정] solution_text가 null 값을 가질 수 있도록 타입을 변경합니다.
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