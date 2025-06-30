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

    // [핵심] 사이드바를 닫는 함수를 useCallback으로 감싸서 참조 안정성 확보
    const handleCloseEditor = useCallback(() => {
        setEditingProblemId(null);
        setRightSidebarConfig({ contentConfig: { type: null } });
        forceRecalculateLayout(problemBoxMinHeight);
    }, [setEditingProblemId, setRightSidebarConfig, forceRecalculateLayout, problemBoxMinHeight]);

    // [핵심] 저장 후 닫는 함수를 useCallback으로 감싸서 참조 안정성 확보
    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => {
        await handleSaveProblem(problem);
        handleCloseEditor();
    }, [handleSaveProblem, handleCloseEditor]);

    // [핵심] 되돌리기 함수를 useCallback으로 감싸서 참조 안정성 확보
    const handleRevertAndKeepOpen = useCallback((problemId: string) => {
        handleRevertProblem(problemId);
    }, [handleRevertProblem]);

    // [핵심] 문제를 클릭해서 사이드바를 여는 메인 함수도 useCallback으로 감싼다.
    // [이유] 이 함수 자체가 prop으로 다른 컴포넌트에 전달될 경우를 대비하고,
    // 내부에서 사용하는 콜백들의 의존성을 명확하게 하기 위함입니다.
    const handleProblemClick = useCallback((problem: ProcessedProblem) => {
        startEditingProblem();
        setEditingProblemId(problem.uniqueId);
        setRightSidebarConfig({
            contentConfig: {
                type: 'problemEditor',
                props: {
                    // [수정] onProblemChange를 다시 전달하여 실시간 미리보기 활성화
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