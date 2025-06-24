import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useProblemsQuery } from '../../../entities/problem/model/useProblemsQuery';
import { useUpdateProblemMutation } from '../../../entities/problem/model/useProblemMutations';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import type { Problem } from '../../../entities/problem/model/types';
import { produce } from 'immer';

const SINGLE_COLUMN_MAX_HEIGHT = 920;
const DEFAULT_ESTIMATED_HEIGHT = 150;
type ProblemPlacementInfo = { page: number; column: number };
type ProblemGroup = { problems: ProcessedProblem[]; totalHeight: number };
export type ProcessedProblem = Problem & { display_question_number: string; uniqueId: string; };

export function useProblemPublishing() {
    const { data: rawProblems = [], isLoading: isLoadingProblems } = useProblemsQuery();
    const { mutate: updateProblem } = useUpdateProblemMutation();

    const allProblems = useMemo((): ProcessedProblem[] => {
        if (!rawProblems || rawProblems.length === 0) return [];
        const typeOrder: Record<string, number> = { '객관식': 1, '서답형': 2 };
        return [...rawProblems]
            .sort((a, b) => {
                const sourceCompare = a.source.localeCompare(b.source);
                if (sourceCompare !== 0) return sourceCompare;
                const typeA_Rank = typeOrder[a.problem_type] || 99;
                const typeB_Rank = typeOrder[b.problem_type] || 99;
                const typeCompare = typeA_Rank - typeB_Rank;
                if (typeCompare !== 0) return typeCompare;
                return a.question_number - b.question_number;
            })
            .map((p, index): ProcessedProblem => ({
                ...p,
                uniqueId: `${p.question_number}-${index}`,
                display_question_number: p.problem_type === '서답형'
                    ? `서답형 ${p.question_number}`
                    : String(p.question_number)
            }));
    }, [rawProblems]);

    const [liveProblems, setLiveProblems] = useState<ProcessedProblem[] | null>(null);

    const displayProblems = useMemo(() => liveProblems ?? allProblems, [liveProblems, allProblems]);

    const problemUniqueIds = useMemo(() => displayProblems.map(p => p.uniqueId), [displayProblems]);
    const { selectedIds, toggleRow, toggleSelectAll, isAllSelected } = useRowSelection<string>({ allItems: problemUniqueIds });
    const selectedProblems = useMemo(() => displayProblems.filter(p => selectedIds.has(p.uniqueId)), [displayProblems, selectedIds]);
    
    const [problemHeightsMap, setProblemHeightsMap] = useState<Map<string, number>>(new Map());
    const [distributedPages, setDistributedPages] = useState<ProcessedProblem[][]>([]);
    const [placementMap, setPlacementMap] = useState<Map<string, ProblemPlacementInfo>>(new Map());
    const [isCalculating, setIsCalculating] = useState(false);
    const calculationTimeoutRef = useRef<number | null>(null);

    const [baseFontSize, setBaseFontSize] = useState('12px');
    const [contentFontSizeEm, setContentFontSizeEm] = useState(1.1);
    const [problemBoxMinHeight, setProblemBoxMinHeight] = useState(10);
    const [useSequentialNumbering, setUseSequentialNumbering] = useState(false);
    const [headerInfo, setHeaderInfo] = useState({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
    });

    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => {
        setProblemHeightsMap(prevMap => {
            if (height > 0 && prevMap.get(uniqueId) !== height) {
                const newMap = new Map(prevMap);
                newMap.set(uniqueId, height);
                return newMap;
            }
            return prevMap;
        });
    }, []);

    const handleProblemDBSave = useCallback((id: string | number, updatedFields: Partial<Problem>) => {
        updateProblem({ id: id, fields: updatedFields });
    }, [updateProblem]);
    
    // [최종 수정] useCallback의 의존성 배열을 비워 함수의 참조 안정성을 보장합니다.
    const handleLiveProblemChange = useCallback((updatedProblem: ProcessedProblem) => {
        setLiveProblems(currentProblems => {
            // 현재 liveProblems가 없으면 allProblems를 기반으로 시작합니다.
            const base = currentProblems ?? allProblems;
            return produce(base, draft => {
                const index = draft.findIndex(p => p.uniqueId === updatedProblem.uniqueId);
                if (index !== -1) {
                    draft[index] = updatedProblem;
                }
            });
        });
    }, [allProblems]); // allProblems가 바뀌면 이 함수도 최신 데이터를 참조해야 하므로 의존성 유지. 하지만 함수 자체의 참조는 안정적.

    const startEditingProblem = useCallback(() => {
        if (liveProblems === null) {
            setLiveProblems(allProblems);
        }
    }, [liveProblems, allProblems]);
    
    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: any) => {
        setHeaderInfo(prev => {
            const newState = { ...prev };
            switch (targetId) {
                case 'title': newState.title = value.text; newState.titleFontSize = value.fontSize; break;
                case 'school': newState.school = value.text; newState.schoolFontSize = value.fontSize; break;
                case 'subject': newState.subject = value.text; newState.subjectFontSize = value.fontSize; break;
                case 'simplifiedSubject': newState.simplifiedSubjectText = value.text; newState.simplifiedSubjectFontSize = value.fontSize; break;
                case 'simplifiedGrade': newState.simplifiedGradeText = value.text; break;
            }
            return newState;
        });
    }, []);

    useEffect(() => {
        if (calculationTimeoutRef.current) { clearTimeout(calculationTimeoutRef.current); }
        setIsCalculating(true);
        
        calculationTimeoutRef.current = window.setTimeout(() => {
            if (selectedProblems.length === 0) {
                setDistributedPages([]);
                setPlacementMap(new Map());
                setIsCalculating(false);
                return;
            }
            const problemGroups: ProblemGroup[] = [];
            let currentGroupProblems: ProcessedProblem[] = [];
            let currentGroupHeight = 0;
            
            for (const problem of selectedProblems) {
                const problemHeight = problemHeightsMap.get(problem.uniqueId) || DEFAULT_ESTIMATED_HEIGHT;

                if (problemHeight > SINGLE_COLUMN_MAX_HEIGHT) {
                    if (currentGroupProblems.length > 0) problemGroups.push({ problems: currentGroupProblems, totalHeight: currentGroupHeight });
                    problemGroups.push({ problems: [problem], totalHeight: problemHeight });
                    currentGroupProblems = []; currentGroupHeight = 0;
                } else if (currentGroupHeight + problemHeight <= SINGLE_COLUMN_MAX_HEIGHT || currentGroupProblems.length === 0) {
                    currentGroupProblems.push(problem);
                    currentGroupHeight += problemHeight;
                } else {
                    problemGroups.push({ problems: currentGroupProblems, totalHeight: currentGroupHeight });
                    currentGroupProblems = [problem];
                    currentGroupHeight = problemHeight;
                }
            }
            if (currentGroupProblems.length > 0) problemGroups.push({ problems: currentGroupProblems, totalHeight: currentGroupHeight });

            const newPages: ProcessedProblem[][] = [];
            const newPlacementMap = new Map<string, ProblemPlacementInfo>();
            let currentPageNumber = 1; 
            let currentColumnIndex = 0;
            let pageProblemBuffer: ProcessedProblem[] = [];

            for (const group of problemGroups) {
                const targetColumn = currentColumnIndex + 1;
                for (const problem of group.problems) {
                    newPlacementMap.set(problem.uniqueId, { page: currentPageNumber, column: targetColumn });
                    pageProblemBuffer.push(problem);
                }
                if (currentColumnIndex === 0) {
                    currentColumnIndex = 1;
                } else {
                    newPages.push([...pageProblemBuffer]);
                    pageProblemBuffer = [];
                    currentPageNumber++;
                    currentColumnIndex = 0;
                }
            }
            if (pageProblemBuffer.length > 0) newPages.push([...pageProblemBuffer]);

            setDistributedPages(newPages);
            setPlacementMap(newPlacementMap);
            setIsCalculating(false);
        }, 350);

        return () => { if (calculationTimeoutRef.current) clearTimeout(calculationTimeoutRef.current); };
    }, [selectedProblems, problemHeightsMap]);

    return {
        allProblems: displayProblems,
        isLoadingProblems,
        selectedIds,
        isAllSelected,
        toggleRow,
        toggleSelectAll,
        distributedPages,
        placementMap,
        isCalculating,
        handleHeightUpdate,
        headerInfo,
        baseFontSize,
        contentFontSizeEm,
        problemBoxMinHeight,
        useSequentialNumbering,
        setBaseFontSize,
        setContentFontSizeEm,
        setProblemBoxMinHeight,
        setUseSequentialNumbering,
        handleHeaderUpdate,
        handleProblemDBSave,
        handleLiveProblemChange,
        startEditingProblem,
    };
}