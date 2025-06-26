// ----- ./react/features/problem-publishing/model/useProblemPublishing.ts -----
import { useMemo, useCallback, useEffect } from 'react';
import { useProblemsQuery } from '../../../entities/problem/model/useProblemsQuery';
import { useUpdateProblemMutation } from '../../../entities/problem/model/useProblemMutations';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useProblemPublishingStore, type ProcessedProblem } from './problemPublishingStore';

export type { ProcessedProblem } from './problemPublishingStore';
// examLayoutEngine에서 사용하는 타입을 export 하기 위해 유지합니다.
export type { LayoutItem } from './examLayoutEngine'; 

/**
 * 문제 출제 페이지의 문제 데이터와 관련된 로직을 관리하는 훅.
 * (데이터 패칭, 선택 상태, 수정 로직 담당)
 */
export function useProblemPublishing() {
    // 1. 서버 데이터 패칭
    const { data: rawProblems = [], isLoading: isLoadingProblems } = useProblemsQuery();
    const { mutateAsync: updateProblem } = useUpdateProblemMutation();
    
    // 2. 문제 편집/원본 상태 관리 (Zustand)
    const {
        initialProblems, draftProblems, setInitialData, startEditing,
        updateDraftProblem, revertSingleProblem, setEditingProblemId, saveProblem,
    } = useProblemPublishingStore();
    
    // 3. 데이터 전처리
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

    // 4. 표시할 문제 목록 및 선택 상태 관리
    const displayProblems = useMemo(() => draftProblems ?? initialProblems, [draftProblems, initialProblems]);
    const problemUniqueIds = useMemo(() => initialProblems.map(p => p.uniqueId), [initialProblems]);
    const { selectedIds, toggleRow, toggleSelectAll, isAllSelected } = useRowSelection<string>({ allItems: problemUniqueIds });
    const selectedProblems = useMemo(() => displayProblems.filter(p => selectedIds.has(p.uniqueId)), [displayProblems, selectedIds]);

    // 5. 문제 저장 로직
    const handleSaveProblem = useCallback(async (updatedProblem: ProcessedProblem) => {
        // API 페이로드에서 UI 전용 필드 제거
        const payload = { ...updatedProblem };
        delete (payload as any).uniqueId;
        delete (payload as any).display_question_number;

        const savedData = await updateProblem({ id: payload.problem_id!, fields: payload });
        
        // 저장 후 받은 데이터로 다시 UI용 데이터 생성
        const processedSavedData: ProcessedProblem = {
            ...savedData,
            uniqueId: savedData.problem_id,
            display_question_number: savedData.problem_type === '서답형' ? `서답형 ${savedData.question_number}` : String(savedData.question_number)
        };
        // 스토어 상태 동기화
        saveProblem(processedSavedData);
    }, [updateProblem, saveProblem]);

    return {
        // 문제 목록
        allProblems: displayProblems,
        isLoadingProblems,
        selectedProblems,
        
        // 선택 관련 상태 및 함수
        selectedIds,
        isAllSelected,
        toggleRow,
        toggleSelectAll,
        
        // 문제 수정/저장 관련 함수
        handleSaveProblem,
        handleLiveProblemChange: updateDraftProblem,
        handleRevertProblem: revertSingleProblem,
        startEditingProblem: startEditing,
        setEditingProblemId,
    };
}