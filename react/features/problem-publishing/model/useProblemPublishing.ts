import { useMemo, useCallback, useEffect } from 'react';
import { useProblemsQuery } from '../../../entities/problem/model/useProblemsQuery';
import { useUpdateProblemMutation } from '../../../entities/problem/model/useProblemMutations';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useProblemPublishingStore, type ProcessedProblem } from './problemPublishingStore';

export type { ProcessedProblem } from './problemPublishingStore';
export type { LayoutItem } from './examLayoutEngine'; 

/**
 * 문제 출제 페이지의 문제 데이터와 관련된 로직을 관리하는 훅.
 * (데이터 패칭, 선택 상태, 수정 로직 담당)
 */
export function useProblemPublishing() {
    const { data: rawProblems = [], isLoading: isLoadingProblems } = useProblemsQuery();
    const updateProblemMutation = useUpdateProblemMutation();
    const { mutateAsync: updateProblem } = updateProblemMutation;
    
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
    
    const { 
        selectedIds,
        toggleRow, 
        toggleItems, 
        replaceSelection, 
        clearSelection, // [수정] clearSelection을 받아옴
        setSelectedIds,   
    } = useRowSelection<string>({ allItems: problemUniqueIds });
    
    const selectedProblems = useMemo(() => displayProblems.filter(p => selectedIds.has(p.uniqueId)), [displayProblems, selectedIds]);

    const handleSaveProblem = useCallback(async (updatedProblem: ProcessedProblem) => {
        const payload = { ...updatedProblem };
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

    return {
        allProblems: displayProblems,
        isLoadingProblems,
        selectedProblems,
        
        selectedIds,
        setSelectedIds,   
        toggleRow,
        toggleItems,
        replaceSelection, 
        clearSelection,   // [수정] clearSelection을 반환
        
        isSavingProblem: updateProblemMutation.isPending,
        handleSaveProblem,
        handleLiveProblemChange: updateDraftProblem,
        handleRevertProblem: revertSingleProblem,
        startEditingProblem: startEditing,
        setEditingProblemId,
    };
}