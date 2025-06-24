import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Problem, Column, ComboboxOption } from '../../../entities/problem/model/types';
import { useUploadProblemsMutation } from '../../../entities/problem/model/useProblemMutations';
import { produce } from 'immer';

// [수정] option_text를 question_text에 통합하고, solution_text가 null인 예제 추가
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
    },
    {
      "question_number": 5.2,
      "problem_type": "객관식",
      "question_text": "두 함수 $f(x)=3x-1$, $g(x) = \\\\sqrt{4x+1}$에 대하여 $(f \\\\circ g^{-1})(5)$의 값은?\\n① $14$ ② $15$ ③ $16$\\n④ $17$ ⑤ $18$",
      "answer": "④",
      "solution_text": null,
      "page": null,
      "grade": "고3",
      "semester": "1학기",
      "source": "2023년 고3 3월 모의고사",
      "major_chapter_id": "미적분",
      "middle_chapter_id": "함수",
      "core_concept_id": "합성함수와 역함수",
      "problem_category": "합성/역함수 값 계산",
      "difficulty": "하",
      "score": "3점"
    }
  ]
}`;

// [수정] option_text 컬럼 제거
const columns: Column[] = [
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
    const [parseError, setParseError] = useState<Error | null>(null);
    
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: keyof Problem } | null>(null);
    const [editingValue, setEditingValue] = useState<string | number | null | undefined>('');
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

    const [commonSource, setCommonSource] = useState('');
    const [commonGradeLevel, setCommonGradeLevel] = useState('');
    const [commonSemester, setCommonSemester] = useState('');

    const uploadMutation = useUploadProblemsMutation();
    const isUploading = uploadMutation.isPending;

    const previousJsonInputRef = useRef('');

    useEffect(() => {
        if (editingCell) return;
        if (jsonInput === previousJsonInputRef.current) return;

        previousJsonInputRef.current = jsonInput;
        
        try {
            const parsedData = JSON.parse(jsonInput);
            
            if (typeof parsedData !== 'object' || parsedData === null) throw new Error("JSON 데이터가 올바른 객체 형식이 아닙니다.");
            if (!('problems' in parsedData)) throw new Error("JSON 데이터에 'problems' 키가 없습니다.");
            if (!Array.isArray(parsedData.problems)) throw new Error("'problems' 키의 값은 배열(Array)이어야 합니다.");

            const validationErrors: string[] = [];
            
            const transformedProblems = parsedData.problems
                .map((p: any, index: number): Problem | null => {
                    const problemIndex = index + 1;

                    if (typeof p !== 'object' || p === null) {
                        validationErrors.push(`${problemIndex}번째 항목이 올바른 문제 객체(Object)가 아닙니다.`);
                        return null;
                    }
                    if (!('question_number' in p)) {
                        validationErrors.push(`${problemIndex}번째 문제에 필수 필드인 'question_number'가 없습니다.`);
                        return null;
                    }
                     if (!('question_text' in p)) {
                        validationErrors.push(`${problemIndex}번째 문제에 필수 필드인 'question_text'가 없습니다.`);
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
                            validationErrors.push(`${problemIndex}번째 문제의 'question_number' ("${problemNumRaw}")에서 숫자를 찾을 수 없습니다.`);
                            return null;
                        }
                    } else if (typeof problemNumRaw === 'number') {
                        finalProblemNum = problemNumRaw;
                    } else {
                        validationErrors.push(`${problemIndex}번째 문제의 'question_number'가 숫자나 문자열이 아닙니다.`);
                        return null;
                    }

                    const finalProblemType = p.problem_type || parsedProblemType || '주관식';

                    const pageNumRaw = p.page;
                    let pageNum: number | null = null;
                    if (pageNumRaw !== null && pageNumRaw !== undefined && String(pageNumRaw).trim() !== '') {
                         const pageNumParsed = parseFloat(pageNumRaw);
                         if (!isNaN(pageNumParsed)) pageNum = pageNumParsed;
                    }
                    
                    // [수정] option_text 제거, answer/solution_text는 null 허용
                    return {
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
                setParseError(new Error(validationErrors.join('\n')));
            } else {
                setParseError(null);
            }

        } catch (e) {
            setProblems([]);
            setParseError(e instanceof Error ? e : new Error('알 수 없는 파싱 오류'));
        }
    }, [jsonInput, editingCell]);

    const formatValue = useCallback((value: Problem[keyof Problem] | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
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
        setJsonInput(JSON.stringify({ problems: nextProblems }, null, 2));
        
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
        setJsonInput(JSON.stringify({ problems: nextProblems }, null, 2));
        alert('공통 정보가 적용되었습니다.');
    }, [problems, commonSource, commonGradeLevel, commonSemester]);

    const uploadProblems = useCallback(() => {
        if (problems.length === 0 || parseError) {
            alert('업로드할 문제가 없거나 데이터에 오류가 있습니다. 오류 메시지를 확인해주세요.');
            return;
        }
        uploadMutation.mutate(problems);
    }, [problems, parseError, uploadMutation]);
    
    const problemTypeOptions: ComboboxOption[] = [
        { value: '객관식', label: '객관식' },
        { value: '서답형', label: '서답형' },
        { value: '논술형', label: '논술형' }
    ];
    const difficultyOptions: ComboboxOption[] = [
        { value: '최상', label: '최상' },
        { value: '상', label: '상' },
        { value: '중', label: '중' },
        { value: '하', label: '하' },
        { value: '최하', label: '최하' }
    ];
    const answerOptions: ComboboxOption[] = [
        { value: '①', label: '①' }, { value: '②', label: '②' }, { value: '③', label: '③' },
        { value: '④', label: '④' }, { value: '⑤', label: '⑤' }, { value: '⑥', label: '⑥' }
    ];
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