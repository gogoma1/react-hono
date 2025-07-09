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

    // [수정] setRightSidebarConfig를 setRightSidebarContent로 변경합니다.
    const { setRightSidebarContent } = useLayoutStore.getState();
    const { forceRecalculateLayout } = useExamLayoutStore();

    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
        // [수정] setRightSidebarConfig({ contentConfig: { type: null } }); -> closeRightSidebar로 대체할 수 있으나, 여기서는 빈 콘텐츠를 설정하는 것이 더 명확할 수 있습니다.
        // 또는 이미 onClose 콜백을 사용하는 페이지 컴포넌트에서 이 로직을 처리하고 있으므로, 여기서는 id만 null로 설정해도 충분할 수 있습니다.
        // 하지만 명시적으로 닫기 위해 아래 코드를 유지하거나 closeRightSidebar()를 호출합니다.
        setRightSidebarContent({ type: 'closed' });
        forceRecalculateLayout(problemBoxMinHeight);
    }, [setEditingProblemId, setRightSidebarContent, forceRecalculateLayout, problemBoxMinHeight]);

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
        
        // [수정] setRightSidebarContent 함수를 올바른 인자 구조로 호출합니다.
        // 첫 번째 인자: content 객체, 두 번째 인자: isExtraWide 불리언
        setRightSidebarContent(
            { // content 객체
                type: 'problemEditor',
                props: {
                    onProblemChange: handleLiveProblemChange,
                    onSave: handleSaveAndClose,
                    onRevert: handleRevertAndKeepOpen,
                    onClose: handleCloseEditor,
                    isSaving: false // 이 값은 usePublishingPageSetup에서 동적으로 업데이트됨
                }
            }, 
            true // isExtraWide 값
        );
    }, [
        startEditingProblem, setEditingProblemId, setRightSidebarContent,
        handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor
    ]);

    return { onProblemClick: handleProblemClick };
}