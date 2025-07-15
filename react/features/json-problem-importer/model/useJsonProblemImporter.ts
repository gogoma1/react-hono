import { useState, useEffect, useCallback, useRef } from 'react';
import type { Problem, Column, ComboboxOption, ProblemType } from '../../../entities/problem/model/types';
import { PROBLEM_TYPES } from '../../../entities/problem/model/types';
import { produce } from 'immer';
import * as jsonc from 'jsonc-parser';

// --- 타입 정의 ---

interface ParseErrorDetail {
    title: string;
    message: string;
    suggestion: string;
    line?: number;
    column?: number;
    problemIndex?: number;
}

/**
 * [신규] onUpload 콜백 함수의 페이로드 타입을 명시적으로 정의합니다.
 */
export interface OnUploadPayload {
    problems: Problem[];
    problemSetName: string;
    description: string | null;
    grade: string | null; // 문제집 대표 학년
}

/**
 * [수정] 훅의 props 타입을 새로운 페이로드 타입으로 교체합니다.
 */
interface UseJsonProblemImporterProps {
    isCreatingNew: boolean;
    initialProblemSetName: string;
    onUpload: (payload: OnUploadPayload) => void;
}


// --- 상수 및 초기값 ---

const initialJsonInput = `{
  "problems": [
    {
      "question_number": "서답형 1",
      "question_text": "다음 함수의 최댓값을 구하시오: $f(x) = -x^2 + 4x - 1$",
      "problem_type": "서답형",
      "answer": "$3$",
      "solution_text": "[해설] 완전제곱식으로 변환하면 $f(x) = -(x-2)^2 + 3$ 이므로 최댓값은 $3$이다.",
      "page": 15,
      "grade": "고1",
      "semester": "1학기",
      "source": "개념원리 수학(상)",
      "major_chapter_id": "이차방정식과 이차함수",
      "middle_chapter_id": "이차함수의 최대, 최소",
      "core_concept_id": "이차함수 표준형 변환",
      "problem_category": "이차함수 최댓값 구하기",
      "difficulty": "하",
      "score": "5점"
    }
  ]
}`;

const columns: Column[] = [
    { key: 'problem_id', label: 'ID', readonly: true },
    { key: 'question_number', label: '번호', editType: 'number' },
    { key: 'problem_type', label: '유형', editType: 'combobox' },
    { key: 'grade', label: '학년', editType: 'text' },
    { key: 'semester', label: '학기', editType: 'text' },
    { key: 'source', label: '출처(소제목)', editType: 'text' },
    { key: 'major_chapter_id', label: '대단원', editType: 'text' },
    { key: 'middle_chapter_id', label: '중단원', editType: 'text' },
    { key: 'core_concept_id', 'label': '핵심개념', editType: 'text' },
    { key: 'problem_category', 'label': '문제 유형', editType: 'text' },
    { key: 'difficulty', label: '난이도', editType: 'combobox' },
    { key: 'score', label: '배점', editType: 'text' },
    { key: 'question_text', 'label': '문제 본문/보기', editType: 'textarea' },
    { key: 'answer', label: '정답', editType: 'text' },
    { key: 'page', label: '페이지', editType: 'number' },
    { key: 'solution_text', 'label': '해설', editType: 'textarea' },
];

const NULLABLE_STRING_FIELDS: Set<keyof Problem> = new Set([
    'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'answer', 'solution_text'
]);


// --- 커스텀 훅 ---

export function useJsonProblemImporter({ 
    isCreatingNew, 
    initialProblemSetName,
    onUpload,
}: UseJsonProblemImporterProps) {
    const [jsonInput, setJsonInput] = useState(initialJsonInput);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [parseError, setParseError] = useState<ParseErrorDetail | null>(null);
    
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: keyof Problem } | null>(null);
    const [editingValue, setEditingValue] = useState<string | number | null | undefined>('');
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

    const [problemSetName, setProblemSetName] = useState('');
    const [problemSetDescription, setProblemSetDescription] = useState<string | null>(null);
    const [commonSource, setCommonSource] = useState('');
    const [commonGradeLevel, setCommonGradeLevel] = useState('');
    const [commonSemester, setCommonSemester] = useState('');

    const previousJsonInputRef = useRef('');

    useEffect(() => {
        setProblemSetName(initialProblemSetName);
    }, [isCreatingNew, initialProblemSetName]);

    const getPosition = (offset: number) => {
        const lines = jsonInput.substring(0, offset).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { line, column };
    };

    const translateJsonError = (error: jsonc.ParseError): ParseErrorDetail => {
        const position = getPosition(error.offset);
        const commonSuggestions: { [key: number]: string } = {
            1: "객체 멤버 사이에 쉼표(,)가 빠졌거나, 마지막 멤버 뒤에 불필요한 쉼표가 있는지 확인하세요. (예: `\"key\": \"value\",`)",
            2: "키(key)와 값(value) 사이에 콜론(:)이 빠졌는지 확인하세요. (예: `\"key\": \"value\"`)",
            3: "객체(Object)를 시작하는 여는 중괄호 '{'가 빠졌거나 잘못된 위치에 있는지 확인하세요.",
            4: "객체(Object)를 닫는 닫는 중괄호 '}'가 빠졌거나 짝이 맞지 않는지 확인하세요.",
            5: "배열(Array)을 시작하는 여는 대괄호 '['가 빠졌거나 잘못된 위치에 있는지 확인하세요.",
            6: "배열(Array)을 닫는 닫는 대괄호 ']'가 빠졌거나 짝이 맞지 않는지 확인하세요.",
            10: "문자열(String)은 항상 큰따옴표(\")로 감싸야 합니다. 작은따옴표(')는 사용할 수 없습니다. (예: `\"text\"`)",
            14: "키(key)는 항상 큰따옴표(\")로 감싸진 문자열이어야 합니다. (예: `\"problems\"`)",
            15: "JSON 데이터가 중간에 예기치 않게 끝났습니다. 모든 괄호('{}', '[]')가 제대로 닫혔는지 확인하세요.",
            16: "숫자 형식이 올바르지 않습니다. 따옴표 없이 숫자만 입력해야 하며, `01`과 같이 0으로 시작할 수 없습니다.",
            17: "키-값 쌍의 키(key)는 반드시 문자열이어야 합니다. (예: `\"my_key\": ...`)"
        };
        return {
            title: "JSON 구문 오류",
            message: jsonc.printParseErrorCode(error.error),
            suggestion: commonSuggestions[error.error] || "JSON 문법을 다시 한번 꼼꼼히 확인해주세요.",
            line: position.line,
            column: position.column
        };
    };

    useEffect(() => {
        if (editingCell) return;
        if (jsonInput === previousJsonInputRef.current) return;

        previousJsonInputRef.current = jsonInput;
        
        const parseErrors: jsonc.ParseError[] = [];
        const parsedData = jsonc.parse(jsonInput, parseErrors, { allowTrailingComma: true });

        if (parseErrors.length > 0) {
            setProblems([]);
            setParseError(translateJsonError(parseErrors[0]));
            return;
        }

        try {
            if (typeof parsedData !== 'object' || parsedData === null) throw { title: "JSON 구조 오류", message: "최상위 데이터가 객체(Object)가 아닙니다.", suggestion: "데이터 전체를 중괄호 `{}`로 감싸주세요." };
            if (!('problems' in parsedData)) throw { title: "필수 키 누락", message: "'problems' 키를 찾을 수 없습니다.", suggestion: "최상위 객체 안에 `\"problems\": [ ... ]` 형식이 포함되어야 합니다." };
            if (!Array.isArray(parsedData.problems)) throw { title: "데이터 타입 오류", message: "'problems' 키의 값이 배열(Array)이 아닙니다.", suggestion: "'problems'의 값은 대괄호 `[]`로 감싸진 배열이어야 합니다." };

            const validationErrors: ParseErrorDetail[] = [];
            
            const transformedProblems = parsedData.problems
                .map((p: any, index: number): Problem | null => {
                    const problemIndex = index + 1;
                    if (typeof p !== 'object' || p === null) {
                        validationErrors.push({ title: "데이터 타입 오류", message: `배열의 ${problemIndex}번째 항목이 객체(Object)가 아닙니다.`, suggestion: "각 문제는 중괄호 `{}`로 감싸야 합니다.", problemIndex });
                        return null;
                    }
                    if (!('question_number' in p) || !p.question_number) {
                        validationErrors.push({ title: "필수 필드 누락", message: `'question_number' 필드가 없거나 비어있습니다.`, suggestion: "모든 문제에는 `question_number` 필드가 반드시 포함되어야 합니다.", problemIndex });
                        return null;
                    }
                     if (!('question_text' in p) || !p.question_text) {
                        validationErrors.push({ title: "필수 필드 누락", message: `'question_text' 필드가 없거나 비어있습니다.`, suggestion: "모든 문제에는 `question_text` 필드가 반드시 포함되어야 합니다.", problemIndex });
                        return null;
                    }
                    
                    const problemNumRaw = p.question_number;
                    const parsedQuestionNumber = parseFloat(String(problemNumRaw).replace(/[^\d.]/g, ''));
                    if(isNaN(parsedQuestionNumber)) {
                        validationErrors.push({ title: "데이터 형식 오류", message: `'question_number' ("${problemNumRaw}")에서 숫자를 찾을 수 없습니다.`, suggestion: "문제 번호에 숫자 부분이 포함되어야 합니다. (예: '서답형 1', '5.2')", problemIndex });
                        return null;
                    }

                    const problemTypeValue = (p.problem_type || '서답형') as string;
                    if (!PROBLEM_TYPES.includes(problemTypeValue as ProblemType)) {
                         validationErrors.push({ title: "데이터 값 오류", message: `'problem_type' 값이 유효하지 않습니다. (입력값: "${problemTypeValue}")`, suggestion: `허용되는 값: ${PROBLEM_TYPES.join(', ')}`, problemIndex });
                        return null;
                    }

                    return {
                        problem_id: p.problem_id || `new-${Date.now()}-${index}`,
                        question_number: parsedQuestionNumber,
                        problem_type: problemTypeValue as ProblemType,
                        question_text: String(p.question_text ?? ''),
                        answer: p.answer ?? null,
                        solution_text: p.solution_text ?? null,
                        page: p.page ?? null,
                        grade: String(p.grade ?? ''),
                        semester: String(p.semester ?? ''),
                        source: String(p.source ?? ''),
                        major_chapter_id: p.major_chapter_id || null,
                        middle_chapter_id: p.middle_chapter_id || null,
                        core_concept_id: p.core_concept_id || null,
                        problem_category: String(p.problem_category ?? ''),
                        difficulty: String(p.difficulty ?? '중'),
                        score: String(p.score ?? ''),
                    };
                })
                .filter((p: Problem | null): p is Problem => p !== null);
            
            setProblems(transformedProblems);
            setParseError(validationErrors.length > 0 ? validationErrors[0] : null);

        } catch (e: any) {
            setProblems([]);
            const errorDetail = (e.title && e.message && e.suggestion) ? e : {
                title: "알 수 없는 오류",
                message: e.message || "데이터를 처리하는 중 알 수 없는 오류가 발생했습니다.",
                suggestion: "JSON 구조와 내용을 다시 한번 확인해주세요."
            };
            setParseError(errorDetail);
        }
    }, [jsonInput, editingCell]);

    const formatValue = useCallback((value: Problem[keyof Problem] | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        if (Array.isArray(value)) return value.join(', ');
        const strValue = String(value);
        if (strValue.startsWith('new-')) return '(신규)';
        if (strValue.length > 30) return `${strValue.substring(0, 30)}...`;
        return strValue;
    }, []);

    const startEdit = useCallback((rowIndex: number, colKey: keyof Problem, currentValue: any, anchorEl: HTMLElement, isReadonly?: boolean) => {
        if (isReadonly) return;
        setEditingCell({ rowIndex, colKey });
        setPopoverAnchor(anchorEl);
        setEditingValue(currentValue ?? '');
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setPopoverAnchor(null);
        setEditingValue('');
    }, []);

    const saveEdit = useCallback((valueToSave?: any) => {
        if (!editingCell) return;
        const { rowIndex, colKey } = editingCell;
        let finalValue = valueToSave !== undefined ? valueToSave : editingValue;
        if (NULLABLE_STRING_FIELDS.has(colKey) && finalValue === '') {
            finalValue = null;
        }
        const nextProblems = produce(problems, draft => {
            (draft[rowIndex] as any)[colKey] = finalValue;
        });
        setProblems(nextProblems);
        cancelEdit();
    }, [editingCell, editingValue, problems, cancelEdit]);

    const handleInputKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement && event.shiftKey)) {
            event.preventDefault();
            saveEdit();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelEdit();
        }
    }, [saveEdit, cancelEdit]);

    const applyCommonData = useCallback(() => {
        if (problems.length === 0) return;
        const nextProblems = produce(problems, draft => {
            draft.forEach(problem => {
                if (commonSource.trim()) problem.source = commonSource;
                if (commonGradeLevel.trim()) problem.grade = commonGradeLevel;
                if (commonSemester.trim()) problem.semester = commonSemester;
            });
        });
        setProblems(nextProblems);
        alert('공통 정보가 적용되었습니다.');
    }, [problems, commonSource, commonGradeLevel, commonSemester]);

    /**
     * [수정] onUpload 호출 시 새로운 페이로드 객체로 감싸서 전달합니다.
     */
    const handleUpload = useCallback(() => {
        if (problems.length === 0 || parseError) {
            alert('업로드할 문제가 없거나 데이터에 오류가 있습니다.');
            return;
        }
        if (isCreatingNew && !problemSetName.trim()) {
            alert('새로운 문제집의 이름을 입력해주세요.');
            return;
        }
        
        const payload: OnUploadPayload = {
            problems,
            problemSetName,
            description: problemSetDescription,
            grade: commonGradeLevel.trim() || null
        };
        onUpload(payload);

    }, [problems, parseError, problemSetName, problemSetDescription, commonGradeLevel, isCreatingNew, onUpload]);
    
    const problemTypeOptions: ComboboxOption[] = PROBLEM_TYPES.map(t => ({ value: t, label: t }));
    const difficultyOptions: ComboboxOption[] = [ { value: '최상', label: '최상' }, { value: '상', label: '상' }, { value: '중', label: '중' }, { value: '하', label: '하' }, { value: '최하', label: '최하' } ];
    const answerOptions: ComboboxOption[] = [ { value: '①', label: '①' }, { value: '②', label: '②' }, { value: '③', label: '③' }, { value: '④', label: '④' }, { value: '⑤', label: '⑤' } ];
    const gradeOptions: ComboboxOption[] = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'].map(g => ({ value: g, label: g }));
    const semesterOptions: ComboboxOption[] = ['1학기', '2학기', '공통'].map(s => ({ value: s, label: s }));

    return {
        jsonInput, setJsonInput,
        problems, parseError,
        editingCell, startEdit, cancelEdit, saveEdit,
        editingValue, setEditingValue, popoverAnchor,
        handleInputKeyDown,
        problemSetName, setProblemSetName,
        problemSetDescription, setProblemSetDescription,
        commonSource, setCommonSource,
        commonGradeLevel, setCommonGradeLevel,
        commonSemester, setCommonSemester,
        applyCommonData,
        handleUpload,
        columns, formatValue,
        problemTypeOptions, difficultyOptions, answerOptions, gradeOptions, semesterOptions,
    };
}