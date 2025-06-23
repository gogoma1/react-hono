export interface Problem {
    // problem_id, problem_set_id, creator_id, created_at, updated_at 등은 백엔드에서 처리됩니다.
    source: string;
    page: number | null;
    question_number: number;
    answer: string;
    problem_type: string;
    grade: string;
    semester: string;
    // 백엔드에서 문자열 이름을 UUID로 변환할 것으로 예상됩니다.
    major_chapter_id: string;
    middle_chapter_id: string;
    core_concept_id: string;
    problem_category: string;
    difficulty: string;
    score: string;
    question_text: string;
    solution_text: string;
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