import { useState, useEffect, useCallback, useRef } from 'react';
import type { Problem, Column, ComboboxOption } from '../../../entities/problem/model/types';
import { useUploadProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import { produce } from 'immer';
import * as jsonc from 'jsonc-parser';

interface ParseErrorDetail {
    title: string;
    message: string;
    suggestion: string;
    line?: number;
    column?: number;
    problemIndex?: number;
}

const initialJsonInput = `{
  "problems": [
    {
      "question_number": "서답형 1",
      "question_text": "다음 함수의 최댓값을 구하시오: $f(x) = -x^2 + 4x - 1$",
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
    { key: 'problem_id', label: 'ID', readonly: true }, // [추가] problem_id 컬럼
    { key: 'question_number', label: '번호', editType: 'number' },
    { key: 'problem_type', label: '유형(객/주)', editType: 'combobox' },
    { key: 'grade', label: '학년', editType: 'text' },
    { key: 'semester', label: '학기', editType: 'text' },
    { key: 'source', label: '출처', editType: 'text' },
    { key: 'major_chapter_id', label: '대단원', editType: 'text' },
    { key: 'middle_chapter_id', label: '중단원', editType: 'text' },
    { key: 'core_concept_id', label: '핵심개념', editType: 'text' },
    { key: 'problem_category', label: '문제 유형', editType: 'text' },
    { key: 'difficulty', label: '난이도', editType: 'combobox' },
    { key: 'score', label: '배점', editType: 'text' },
    { key: 'question_text', label: '문제 본문/보기', editType: 'textarea' },
    { key: 'answer', label: '정답', editType: 'text' },
    { key: 'page', label: '페이지', editType: 'number' },
    { key: 'solution_text', label: '해설', editType: 'textarea' },
];


export function useJsonProblemImporter() {
    const [jsonInput, setJsonInput] = useState(initialJsonInput);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [parseError, setParseError] = useState<ParseErrorDetail | null>(null);
    
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: keyof Problem } | null>(null);
    const [editingValue, setEditingValue] = useState<string | number | null | undefined>('');
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

    const [commonSource, setCommonSource] = useState('');
    const [commonGradeLevel, setCommonGradeLevel] = useState('');
    const [commonSemester, setCommonSemester] = useState('');

    const uploadMutation = useUploadProblemsMutation();
    const isUploading = uploadMutation.isPending;

    const previousJsonInputRef = useRef('');

    const getPosition = (offset: number) => {
        const lines = jsonInput.substring(0, offset).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { line, column };
    };

    const translateJsonError = (error: jsonc.ParseError): ParseErrorDetail => {
        const position = getPosition(error.offset);
        const commonSuggestions = {
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
            suggestion: commonSuggestions[error.error as keyof typeof commonSuggestions] || "JSON 문법을 다시 한번 꼼꼼히 확인해주세요.",
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
                    if (!('question_number' in p)) {
                        validationErrors.push({ title: "필수 필드 누락", message: `'question_number' 필드가 없습니다.`, suggestion: "모든 문제에는 `question_number` 필드가 반드시 포함되어야 합니다.", problemIndex });
                        return null;
                    }
                     if (!('question_text' in p)) {
                        validationErrors.push({ title: "필수 필드 누락", message: `'question_text' 필드가 없습니다.`, suggestion: "모든 문제에는 `question_text` 필드가 반드시 포함되어야 합니다.", problemIndex });
                        return null;
                    }

                    const problemNumRaw = p.question_number;
                    let finalProblemNum: number;
                    let parsedProblemType: string | null = null;

                    if (typeof problemNumRaw === 'string') {
                        const numericMatch = problemNumRaw.match(/[\d.]+/);
                        if (numericMatch) {
                            finalProblemNum = parseFloat(numericMatch[0]);
                            const textPart = problemNumRaw.replace(/[\d.]+/, '').trim();
                            if (textPart) parsedProblemType = textPart;
                        } else {
                             validationErrors.push({ title: "데이터 형식 오류", message: `'question_number' ("${problemNumRaw}")에서 숫자를 찾을 수 없습니다.`, suggestion: "문제 번호에 숫자 부분이 포함되어야 합니다. (예: '서답형 1', '5.2')", problemIndex });
                            return null;
                        }
                    } else if (typeof problemNumRaw === 'number') {
                        finalProblemNum = problemNumRaw;
                    } else {
                        validationErrors.push({ title: "데이터 타입 오류", message: `'question_number'가 숫자나 문자열이 아닙니다.`, suggestion: "문제 번호는 숫자(예: 5) 또는 문자열(예: '서답형 1')이어야 합니다.", problemIndex });
                        return null;
                    }

                    // [수정] 기본값을 '주관식'에서 '서답형'으로 변경
                    const finalProblemType = p.problem_type || parsedProblemType || '서답형';

                    const pageNumRaw = p.page;
                    let pageNum: number | null = null;
                    if (pageNumRaw !== null && pageNumRaw !== undefined && String(pageNumRaw).trim() !== '') {
                         const pageNumParsed = parseFloat(pageNumRaw);
                         if (!isNaN(pageNumParsed)) pageNum = pageNumParsed;
                    }
                    
                    return {
                        problem_id: p.problem_id || `new-${Date.now()}-${index}`, // ID가 있으면 사용, 없으면 임시 ID 생성
                        question_number: finalProblemNum,
                        problem_type: finalProblemType,
                        question_text: String(p.question_text ?? ''),
                        answer: p.answer ?? null,
                        solution_text: p.solution_text ?? null,
                        page: pageNum,
                        grade: String(p.grade ?? ''),
                        semester: String(p.semester ?? ''),
                        source: String(p.source ?? ''),
                        major_chapter_id: String(p.major_chapter_id ?? ''),
                        middle_chapter_id: String(p.middle_chapter_id ?? ''),
                        core_concept_id: String(p.core_concept_id ?? ''),
                        problem_category: String(p.problem_category ?? ''),
                        difficulty: String(p.difficulty ?? '중'),
                        score: String(p.score ?? ''),
                    };
                })
                .filter((p: Problem | null): p is Problem => p !== null);
            
            setProblems(transformedProblems);

            if (validationErrors.length > 0) {
                 setParseError(validationErrors[0]);
            } else {
                setParseError(null);
            }

        } catch (e: any) {
            setProblems([]);
            if (e.title && e.message && e.suggestion) {
                setParseError(e);
            } else {
                setParseError({
                    title: "알 수 없는 오류",
                    message: e.message || "데이터를 처리하는 중 알 수 없는 오류가 발생했습니다.",
                    suggestion: "JSON 구조와 내용을 다시 한번 확인해주세요."
                });
            }
        }
    }, [jsonInput, editingCell]);

    const formatValue = useCallback((value: Problem[keyof Problem] | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        if (Array.isArray(value)) return value.join(', ');

        const strValue = String(value);
        if (strValue.startsWith('new-')) return '(신규)'; // 임시 ID는 '신규'로 표시
        
        if (strValue.length > 20 && strValue.includes('-')) {
            return `${strValue.substring(0, 8)}...`;
        }
        return strValue;
    }, []);

    const startEdit = useCallback((rowIndex: number, colKey: keyof Problem, currentValue: any, anchorEl: HTMLElement, isReadonly?: boolean) => {
        if (isReadonly) return;
        if (editingCell?.rowIndex === rowIndex && editingCell?.colKey === colKey) return;

        setEditingCell({ rowIndex, colKey });
        setPopoverAnchor(anchorEl);
        setEditingValue(currentValue ?? '');
    }, [editingCell]);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setPopoverAnchor(null);
        setEditingValue('');
    }, []);

    const saveEdit = useCallback((valueToSave?: any) => {
        if (!editingCell) return;
        const { rowIndex, colKey } = editingCell;
        
        const finalValue = valueToSave !== undefined ? valueToSave : editingValue;

        const nextProblems = produce(problems, draft => {
            const targetProblem = draft[rowIndex];
            if (!targetProblem) return;

            if (colKey === 'question_number' || colKey === 'page') {
                const numValue = parseFloat(String(finalValue));
                (targetProblem as any)[colKey] = isNaN(numValue) ? (finalValue === '' || finalValue === null ? null : (targetProblem as any)[colKey]) : numValue;
            } else {
                (targetProblem as any)[colKey] = finalValue;
            }
        });
        
        setProblems(nextProblems);
        const problemsForJson = nextProblems.map(p => {
            const { ...rest } = p;
            if (p.problem_id.startsWith('new-')) {
                delete (rest as any).problem_id;
            }
            return rest;
        });
        setJsonInput(JSON.stringify({ problems: problemsForJson }, null, 2));
        
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
        const problemsForJson = nextProblems.map(p => {
            const { ...rest } = p;
            if (p.problem_id.startsWith('new-')) {
                delete (rest as any).problem_id;
            }
            return rest;
        });
        setJsonInput(JSON.stringify({ problems: problemsForJson }, null, 2));
        alert('공통 정보가 적용되었습니다.');
    }, [problems, commonSource, commonGradeLevel, commonSemester]);

    const uploadProblems = useCallback(() => {
        if (problems.length === 0 || parseError) {
            alert('업로드할 문제가 없거나 데이터에 오류가 있습니다. 오류 메시지를 확인해주세요.');
            return;
        }
        
        const problemsToUpload = problems.map(p => {
            const { ...problemToSend } = p;

            if (problemToSend.problem_id.startsWith('new-')) {
                delete (problemToSend as Partial<Problem>).problem_id;
            }
            
            return problemToSend;
        });

        uploadMutation.mutate(problemsToUpload as Problem[]);

    }, [problems, parseError, uploadMutation]);
    
    // [수정] '주관식' 제거
    const problemTypeOptions: ComboboxOption[] = [ { value: '객관식', label: '객관식' }, { value: '서답형', label: '서답형' }, { value: '논술형', label: '논술형' } ];
    const difficultyOptions: ComboboxOption[] = [ { value: '최상', label: '최상' }, { value: '상', label: '상' }, { value: '중', label: '중' }, { value: '하', label: '하' }, { value: '최하', label: '최하' } ];
    const answerOptions: ComboboxOption[] = [ { value: '①', label: '①' }, { value: '②', label: '②' }, { value: '③', label: '③' }, { value: '④', label: '④' }, { value: '⑤', label: '⑤' }, { value: '⑥', label: '⑥' } ];
    const gradeOptions: ComboboxOption[] = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'].map(g => ({ value: g, label: g }));
    const semesterOptions: ComboboxOption[] = ['1학기', '2학기', '공통'].map(s => ({ value: s, label: s }));

    return {
        jsonInput, setJsonInput,
        problems,
        parseError,
        editingCell, startEdit, cancelEdit, saveEdit,
        editingValue, setEditingValue,
        popoverAnchor,
        handleInputKeyDown,
        commonSource, setCommonSource,
        commonGradeLevel, setCommonGradeLevel,
        commonSemester, setCommonSemester,
        applyCommonData,
        uploadProblems, isUploading,
        columns, formatValue,
        problemTypeOptions, difficultyOptions, answerOptions, gradeOptions, semesterOptions,
    };
}