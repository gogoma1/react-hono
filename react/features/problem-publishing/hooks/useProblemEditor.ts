// ./react/features/problem-publishing/hooks/useProblemEditor.ts
import { useCallback } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useProblemPublishing } from '../model/useProblemPublishing';
import { useExamLayoutStore } from '../model/examLayoutStore';
import type { ProcessedProblem } from '../model/problemPublishingStore';

interface ProblemEditorProps {
    problemBoxMinHeight: number;
}

export function useProblemEditor({ problemBoxMinHeight }: ProblemEditorProps) {
    const {
        handleSaveProblem, handleLiveProblemChange, handleRevertProblem,
        startEditingProblem, setEditingProblemId
    } = useProblemPublishing();

    const { setRightSidebarConfig } = useLayoutStore.getState();
    const { forceRecalculateLayout } = useExamLayoutStore();

    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
        setRightSidebarConfig({ contentConfig: { type: null } });
        forceRecalculateLayout(problemBoxMinHeight);
    }, [setEditingProblemId, setRightSidebarConfig, forceRecalculateLayout, problemBoxMinHeight]);

    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => {
        await handleSaveProblem(problem);
        handleCloseEditor();
    }, [handleSaveProblem, handleCloseEditor]);

    const handleRevertAndKeepOpen = useCallback((problemId: string) => {
        handleRevertProblem(problemId);
    }, [handleRevertProblem]);

    const handleProblemClick = useCallback((problem: ProcessedProblem) => {
        startEditingProblem();
        setEditingProblemId(problem.uniqueId);
        setRightSidebarConfig({
            contentConfig: {
                type: 'problemEditor',
                props: {
                    onProblemChange: handleLiveProblemChange,
                    onSave: handleSaveAndClose,
                    onRevert: handleRevertAndKeepOpen,
                    onClose: handleCloseEditor,
                    isSaving: false // 이 값은 usePublishingPageSetup에서 동적으로 업데이트됨
                }
            },
            isExtraWide: true
        });
    }, [
        startEditingProblem, setEditingProblemId, setRightSidebarConfig,
        handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor
    ]);

    return { onProblemClick: handleProblemClick };
}