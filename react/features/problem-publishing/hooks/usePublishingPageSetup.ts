import { useEffect } from 'react';
import { useLayoutStore, type RegisteredPageActions } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { useProblemPublishing } from '../model/useProblemPublishing';

// 이 훅이 필요로 하는 모든 액션 핸들러 타입을 명시합니다.
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
    // 스토어에서 액션 함수를 가져옵니다.
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    const setSearchBoxProps = useLayoutStore(state => state.setSearchBoxProps);
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

    useEffect(() => {
        // 등록할 액션 객체를 생성합니다.
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
        
        // 클린업 함수: 이 훅이 등록한 액션들만 초기화합니다.
        return () => {
            unregisterPageActions(Object.keys(pageActionsToRegister) as (keyof RegisteredPageActions)[]);
            // 페이지를 벗어날 때 사이드바와 검색창을 확실히 닫습니다.
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

    // 문제 저장 상태가 변경될 때 사이드바 props를 업데이트하는 로직
    useEffect(() => {
        const { content } = useLayoutStore.getState().rightSidebar;
        if (content.type === 'problemEditor') {
            setRightSidebarContent({
                ...content,
                props: { ...content.props, isSaving: isSavingProblem }
            }, true);
        }
    }, [isSavingProblem, setRightSidebarContent]);
}