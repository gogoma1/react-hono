export interface Problem {
    problem_id: string; // [추가] DB의 UUID 기본 키
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