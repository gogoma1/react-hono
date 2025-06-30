import { useCallback, useRef, useMemo } from 'react';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import { useExamHeaderState } from '../hooks/useExamHeaderState';
import { useProblemEditor } from '../hooks/useProblemEditor';
import { useExamPreviewManager } from '../hooks/useExamPreviewManager';
import { usePublishingPageSetup } from '../hooks/usePublishingPageSetup';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { usePdfGenerator } from '../hooks/usePdfGenerator';

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

    const previewAreaRef = useRef<HTMLDivElement>(null);
    
    const { isGeneratingPdf, onDownloadPdf, pdfProgress } = usePdfGenerator({
        previewAreaRef,
        getExamTitle: () => headerInfo.title,
        getSelectedProblemCount: () => selectedProblems.length,
    });
    
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
        
        isGeneratingPdf,
        onDownloadPdf,
        pdfProgress,
        previewAreaRef,
        ...previewManager,
    };
}