import { useCallback, useRef, useMemo } from 'react';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import { useExamHeaderState } from '../hooks/useExamHeaderState';
import { useProblemEditor } from '../hooks/useProblemEditor';
import { useExamPreviewManager } from '../hooks/useExamPreviewManager';
import { usePublishingPageSetup } from '../hooks/usePublishingPageSetup';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
// [수정] usePdfGenerator 임포트 제거

export function useProblemPublishingPage() {
    const { allProblems, isLoadingProblems } = useProblemPublishing();
    const allProblemIds = useMemo(() => allProblems.map(p => p.uniqueId), [allProblems]);
    const { selectedIds, toggleRow, clearSelection, toggleItems, setSelectedIds } = useRowSelection({ allItems: allProblemIds });
    const selectedProblems = useMemo(() => allProblems.filter(p => selectedIds.has(p.uniqueId)), [allProblems, selectedIds]);
    
    const handleDeselectProblem = useCallback((uniqueId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(uniqueId);
            return newSet;
        });
    }, [setSelectedIds]);

    const previewManager = useExamPreviewManager();
    useExamLayoutManager({ selectedProblems, problemBoxMinHeight: previewManager.problemBoxMinHeight });
    const { distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap } = useExamLayoutStore();
    const { headerInfo, onHeaderUpdate } = useExamHeaderState();
    const { onProblemClick } = useProblemEditor({ problemBoxMinHeight: previewManager.problemBoxMinHeight });
    usePublishingPageSetup({ selectedProblems, allProblems });

    // [수정] PDF 생성 관련 로직은 모두 PublishingToolbarWidget으로 이동
    // previewAreaRef는 페이지 컴포넌트에서 생성되어야 하므로 그대로 둡니다.
    const previewAreaRef = useRef<HTMLDivElement>(null);
    
    return {
        allProblems,
        isLoadingProblems,
        selectedProblems,
        selectedIds,
        toggleRow,
        toggleItems,
        clearSelection,
        distributedPages,
        placementMap,
        distributedSolutionPages,
        solutionPlacementMap,
        headerInfo,
        onHeaderUpdate,
        onProblemClick,
        handleDeselectProblem,
        
        // [수정] PDF 관련 상태 및 함수 제거
        previewAreaRef,
        ...previewManager,
    };
}