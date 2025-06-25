import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useProblemsQuery } from '../../../entities/problem/model/useProblemsQuery';
import { useUpdateProblemMutation } from '../../../entities/problem/model/useProblemMutations';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import type { Problem } from '../../../entities/problem/model/types';
import { useProblemPublishingStore, type ProcessedProblem } from './problemPublishingStore';

const SINGLE_COLUMN_MAX_HEIGHT = 920;
const DEFAULT_ESTIMATED_HEIGHT = 150;
const DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT = 40;

type ProblemPlacementInfo = { page: number; column: number };
// [수정] items 타입을 LayoutItem으로 명시
type ProblemGroup = { items: LayoutItem[]; totalHeight: number }; 

export type LayoutItem = 
    | { type: 'problem'; data: ProcessedProblem; uniqueId: string; }
    | { type: 'solutionChunk'; data: { text: string; parentProblem: ProcessedProblem }; uniqueId: string; };

export type { ProcessedProblem };

export function useProblemPublishing() {
    const { data: rawProblems = [], isLoading: isLoadingProblems } = useProblemsQuery();
    const { mutateAsync: updateProblem } = useUpdateProblemMutation();

    const {
        initialProblems, draftProblems, setInitialData, startEditing,
        updateDraftProblem, revertSingleProblem, setEditingProblemId, saveProblem,
    } = useProblemPublishingStore();

    useEffect(() => {
        if (!isLoadingProblems && rawProblems.length > 0) {
            const typeOrder: Record<string, number> = { '객관식': 1, '주관식': 2, '서답형': 3, '논술형': 4 };
            const processed = [...rawProblems]
                .sort((a, b) => {
                    const sourceCompare = a.source.localeCompare(b.source);
                    if (sourceCompare !== 0) return sourceCompare;
                    const typeA_Rank = typeOrder[a.problem_type] || 99;
                    const typeB_Rank = typeOrder[b.problem_type] || 99;
                    if (typeA_Rank !== typeB_Rank) return typeA_Rank - typeB_Rank;
                    return a.question_number - b.question_number;
                })
                .map((p): ProcessedProblem => ({
                    ...p,
                    question_text: p.question_text ?? '',
                    solution_text: p.solution_text ?? '',
                    uniqueId: p.problem_id,
                    display_question_number: p.problem_type === '서답형' ? `서답형 ${p.question_number}` : String(p.question_number),
                }));
            setInitialData(processed);
        }
    }, [rawProblems, isLoadingProblems, setInitialData]);

    const displayProblems = useMemo(() => draftProblems ?? initialProblems, [draftProblems, initialProblems]);
    const problemUniqueIds = useMemo(() => initialProblems.map(p => p.uniqueId), [initialProblems]);
    const { selectedIds, toggleRow, toggleSelectAll, isAllSelected } = useRowSelection<string>({ allItems: problemUniqueIds });

    const selectedProblems = useMemo(() => {
        const source = draftProblems ?? initialProblems;
        return source.filter(p => selectedIds.has(p.uniqueId));
    }, [draftProblems, initialProblems, selectedIds]);

    // [수정] 문제와 해설 조각의 높이를 하나의 맵에서 관리
    const [itemHeightsMap, setItemHeightsMap] = useState<Map<string, number>>(new Map());
    
    // [수정] 페이지 데이터 타입을 LayoutItem 배열로 변경
    const [distributedPages, setDistributedPages] = useState<LayoutItem[][]>([]);
    const [placementMap, setPlacementMap] = useState<Map<string, ProblemPlacementInfo>>(new Map());
    
    const [distributedSolutionPages, setDistributedSolutionPages] = useState<LayoutItem[][]>([]);
    const [solutionPlacementMap, setSolutionPlacementMap] = useState<Map<string, ProblemPlacementInfo>>(new Map());
    
    const [isCalculating, setIsCalculating] = useState(false);
    const calculationTimeoutRef = useRef<number | null>(null);

    const [baseFontSize, setBaseFontSize] = useState('12px');
    const [contentFontSizeEm, setContentFontSizeEm] = useState(1);
    const [problemBoxMinHeight, setProblemBoxMinHeight] = useState(28);
    const [useSequentialNumbering, setUseSequentialNumbering] = useState(false);
    const [headerInfo, setHeaderInfo] = useState({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
    });

    // [수정] 높이 업데이트 핸들러를 하나로 통합
    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => {
        setItemHeightsMap(prevMap => {
            if (height > 0 && prevMap.get(uniqueId) !== height) {
                const newMap = new Map(prevMap);
                newMap.set(uniqueId, height);
                return newMap;
            }
            return prevMap;
        });
    }, []);

    const runLayoutCalculation = useCallback((
        itemsToLayout: LayoutItem[],
        defaultHeight: number
    ): { pages: LayoutItem[][]; placements: Map<string, ProblemPlacementInfo> } => {
        const problemGroups: ProblemGroup[] = [];
        let currentGroupItems: LayoutItem[] = [];
        let currentGroupHeight = 0;

        for (const item of itemsToLayout) {
            const itemHeight = itemHeightsMap.get(item.uniqueId) || defaultHeight;

            if (itemHeight > SINGLE_COLUMN_MAX_HEIGHT) {
                if (currentGroupItems.length > 0) problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });
                problemGroups.push({ items: [item], totalHeight: itemHeight });
                currentGroupItems = [];
                currentGroupHeight = 0;
            } else if (currentGroupHeight + itemHeight <= SINGLE_COLUMN_MAX_HEIGHT || currentGroupItems.length === 0) {
                currentGroupItems.push(item);
                currentGroupHeight += itemHeight;
            } else {
                problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });
                currentGroupItems = [item];
                currentGroupHeight = itemHeight;
            }
        }
        if (currentGroupItems.length > 0) problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });

        const newPages: LayoutItem[][] = [];
        const newPlacementMap = new Map<string, ProblemPlacementInfo>();
        let currentPageNumber = 1;
        let currentColumnIndex = 0;
        let pageItemBuffer: LayoutItem[] = [];

        for (const group of problemGroups) {
            const targetColumn = currentColumnIndex + 1;
            for (const item of group.items) {
                newPlacementMap.set(item.uniqueId, { page: currentPageNumber, column: targetColumn });
                pageItemBuffer.push(item);
            }
            if (currentColumnIndex === 0) {
                currentColumnIndex = 1;
            } else {
                newPages.push([...pageItemBuffer]);
                pageItemBuffer = [];
                currentPageNumber++;
                currentColumnIndex = 0;
            }
        }
        if (pageItemBuffer.length > 0) newPages.push([...pageItemBuffer]);
        return { pages: newPages, placements: newPlacementMap };
    }, [itemHeightsMap]);

    useEffect(() => {
        if (calculationTimeoutRef.current) clearTimeout(calculationTimeoutRef.current);
        
        calculationTimeoutRef.current = window.setTimeout(() => {
            setIsCalculating(true);
            
            if (selectedProblems.length === 0) {
                setDistributedPages([]);
                setPlacementMap(new Map());
                setDistributedSolutionPages([]);
                setSolutionPlacementMap(new Map());
            } else {
                const problemLayoutItems: LayoutItem[] = selectedProblems.map(p => ({
                    type: 'problem', data: p, uniqueId: p.uniqueId
                }));
                const { pages: problemPages, placements: problemPlacements } = runLayoutCalculation(problemLayoutItems, DEFAULT_ESTIMATED_HEIGHT);
                setDistributedPages(problemPages);
                setPlacementMap(problemPlacements);

                const solutionLayoutItems: LayoutItem[] = [];
                selectedProblems.forEach(p => {
                    if (p.solution_text && p.solution_text.trim()) {
                        const chunks = p.solution_text.split(/\n\s*\n/).filter(c => c.trim());
                        chunks.forEach((chunk, index) => {
                            solutionLayoutItems.push({
                                type: 'solutionChunk',
                                data: { text: chunk, parentProblem: p },
                                uniqueId: `${p.uniqueId}-sol-${index}`
                            });
                        });
                    }
                });

                const { pages: solutionPages, placements: solutionPlacements } = runLayoutCalculation(solutionLayoutItems, DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT);
                setDistributedSolutionPages(solutionPages);
                setSolutionPlacementMap(solutionPlacements);
            }
            setIsCalculating(false);
        }, 300);

        return () => { if (calculationTimeoutRef.current) clearTimeout(calculationTimeoutRef.current); };
    }, [selectedProblems, itemHeightsMap, runLayoutCalculation]);
    
    const handleSaveProblem = useCallback(async (updatedProblem: ProcessedProblem) => {
        const payload: Partial<Problem> = { ...updatedProblem };
        delete (payload as any).uniqueId;
        delete (payload as any).display_question_number;
        const savedData = await updateProblem({ id: payload.problem_id!, fields: payload });
        const processedSavedData: ProcessedProblem = {
            ...savedData,
            uniqueId: savedData.problem_id,
            display_question_number: savedData.problem_type === '서답형' ? `서답형 ${savedData.question_number}` : String(savedData.question_number)
        };
        saveProblem(processedSavedData);
    }, [updateProblem, saveProblem]);

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

    return {
        allProblems: displayProblems,
        isLoadingProblems,
        selectedIds,
        isAllSelected,
        toggleRow,
        toggleSelectAll,
        distributedPages,
        placementMap,
        distributedSolutionPages,
        solutionPlacementMap,
        isCalculating,
        handleHeightUpdate, // handleSolutionHeightUpdate는 이걸로 통합
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
        handleSaveProblem,
        handleLiveProblemChange: updateDraftProblem,
        handleRevertProblem: revertSingleProblem,
        startEditingProblem: startEditing,
        setEditingProblemId,
        selectedProblems,
    };
}