// ./react/features/problem-publishing/hooks/usePublishingPageSetup.ts

import { useEffect } from 'react';
import { useLayoutStore, type RegisteredPageActions } from '../../../shared/store/layoutStore';
import { useProblemPublishing } from '../model/useProblemPublishing';

interface PageSetupActions {
    handleCloseSidebar: () => void;
    handleOpenLatexHelpSidebar: () => void;
    handleOpenSettingsSidebar: () => void;
    handleOpenPromptSidebar: () => void;
    handleOpenSelectedStudentsSidebar: () => void;
    handleOpenJsonViewSidebar: () => void;
    handleOpenSearchSidebar: () => void;
}

interface PublishingPageSetupProps extends PageSetupActions {}

export function usePublishingPageSetup({
    handleCloseSidebar,
    handleOpenLatexHelpSidebar,
    handleOpenSettingsSidebar,
    handleOpenPromptSidebar,
    handleOpenSelectedStudentsSidebar,
    handleOpenJsonViewSidebar,
    handleOpenSearchSidebar,
}: PublishingPageSetupProps) {
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    const setSearchBoxProps = useLayoutStore(state => state.setSearchBoxProps);
    const { isSavingProblem } = useProblemPublishing();

    // [수정] 아래의 useEffect 블록은 컬럼의 기본 가시성을 설정하는 로직이었으나,
    // 이 로직은 useVisibleColumns 훅에서 이미 올바르게 처리하고 있으므로 불필요합니다.
    // 또한, 존재하지 않는 setColumnVisibility 함수를 호출하여 오류를 발생시키는 원인이므로 완전히 제거합니다.
    /*
    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        PROBLEM_PUBLISHING_COLUMN_CONFIG.forEach(col => {
            initialVisibility[col.key] = !col.defaultHidden;
        });
        setColumnVisibility(initialVisibility);
    }, [setColumnVisibility]);
    */

    useEffect(() => {
        const pageActionsToRegister: Partial<RegisteredPageActions> = {
            onClose: handleCloseSidebar,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
            openSelectedStudentsSidebar: handleOpenSelectedStudentsSidebar,
            openJsonViewSidebar: handleOpenJsonViewSidebar,
            openSearchSidebar: handleOpenSearchSidebar,
        };
        
        registerPageActions(pageActionsToRegister);
        
        return () => {
            unregisterPageActions(Object.keys(pageActionsToRegister) as (keyof RegisteredPageActions)[]);
            closeRightSidebar();
            setSearchBoxProps(null);
        };
    }, [
        registerPageActions,
        unregisterPageActions,
        closeRightSidebar,
        setSearchBoxProps,
        handleCloseSidebar, 
        handleOpenLatexHelpSidebar, 
        handleOpenSettingsSidebar, 
        handleOpenPromptSidebar,
        handleOpenSelectedStudentsSidebar,
        handleOpenJsonViewSidebar,
        handleOpenSearchSidebar,
    ]);

    useEffect(() => {
        const { rightSidebar } = useLayoutStore.getState();
        const content = rightSidebar.content;
        if (content.type === 'problemEditor') {
            setRightSidebarContent({
                ...content,
                props: { ...content.props, isSaving: isSavingProblem }
            }, rightSidebar.isExtraWide); // isExtraWide 상태를 유지하도록 수정
        }
    }, [isSavingProblem, setRightSidebarContent]);
}