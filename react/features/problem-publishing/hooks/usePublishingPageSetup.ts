import { useEffect, useMemo, useRef } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { useProblemPublishing } from '../model/useProblemPublishing';
import type { ProcessedProblem } from '../model/problemPublishingStore';

// [핵심 수정 1] 훅이 인자로 받을 함수의 타입을 정의합니다.
interface PageSetupActions {
    handleCloseSidebar: () => void;
    handleOpenLatexHelpSidebar: () => void;
    handleOpenSettingsSidebar: () => void;
    handleOpenPromptSidebar: () => void;
}

interface PublishingPageSetupProps extends PageSetupActions {
    selectedProblems: ProcessedProblem[];
    allProblems: ProcessedProblem[];
}

export function usePublishingPageSetup({
    selectedProblems,
    allProblems,
    handleCloseSidebar,
    handleOpenLatexHelpSidebar,
    handleOpenSettingsSidebar,
    handleOpenPromptSidebar,
}: PublishingPageSetupProps) {
    // [핵심 수정 2] getState() 대신 선택자를 사용하여 안정성을 높입니다.
    const registerPageActions = useLayoutStore(state => state.registerPageActions);
    const setSearchBoxProps = useLayoutStore(state => state.setSearchBoxProps);
    const setRightSidebarConfig = useLayoutStore(state => state.setRightSidebarConfig);
    const setColumnVisibility = useUIStore(state => state.setColumnVisibility);
    
    const { permittedColumnsConfig } = useColumnPermissions();
    const { isSavingProblem } = useProblemPublishing();

    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        permittedColumnsConfig.forEach(col => {
            initialVisibility[col.key] = !col.defaultHidden;
        });
        setColumnVisibility(initialVisibility);
    }, [permittedColumnsConfig, setColumnVisibility]);

    // [핵심 수정 3] useEffect의 의존성 배열이 이제 안정적인 props에 의존합니다.
    useEffect(() => {
        registerPageActions({
            onClose: handleCloseSidebar,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar,
            openSearchSidebar: () => { /* No-op for this page */ },
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
        });
        
        // 이 정리 함수는 이제 페이지를 벗어날 때만 안전하게 호출됩니다.
        return () => {
            setRightSidebarConfig({ contentConfig: { type: null } });
            setSearchBoxProps(null);
        };
    }, [
        registerPageActions,
        setRightSidebarConfig,
        setSearchBoxProps,
        handleCloseSidebar, 
        handleOpenLatexHelpSidebar, 
        handleOpenSettingsSidebar, 
        handleOpenPromptSidebar
    ]);

    useEffect(() => {
        const { contentConfig } = useLayoutStore.getState().rightSidebar;
        if (contentConfig.type === 'problemEditor' && contentConfig.props) {
            setRightSidebarConfig({
                contentConfig: { ...contentConfig, props: { ...contentConfig.props, isSaving: isSavingProblem } },
                isExtraWide: true
            });
        }
    }, [isSavingProblem, setRightSidebarConfig]);
}