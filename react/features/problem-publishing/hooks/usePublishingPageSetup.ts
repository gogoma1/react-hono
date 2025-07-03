import { useEffect } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { useProblemPublishing } from '../model/useProblemPublishing';

interface PageSetupActions {
    handleCloseSidebar: () => void;
    handleOpenLatexHelpSidebar: () => void;
    handleOpenSettingsSidebar: () => void;
    handleOpenPromptSidebar: () => void;
    handleOpenSelectedStudentsSidebar: () => void;
}

// [핵심 수정] 사용하지 않는 props 제거
interface PublishingPageSetupProps extends PageSetupActions {}

export function usePublishingPageSetup({
    handleCloseSidebar,
    handleOpenLatexHelpSidebar,
    handleOpenSettingsSidebar,
    handleOpenPromptSidebar,
    handleOpenSelectedStudentsSidebar,
}: PublishingPageSetupProps) {
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

    useEffect(() => {
        registerPageActions({
            onClose: handleCloseSidebar,
            openLatexHelpSidebar: handleOpenLatexHelpSidebar,
            openSearchSidebar: () => { /* No-op for this page */ },
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
            openSelectedStudentsSidebar: handleOpenSelectedStudentsSidebar,
        });
        
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
        handleOpenPromptSidebar,
        handleOpenSelectedStudentsSidebar,
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