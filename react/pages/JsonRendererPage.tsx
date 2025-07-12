import React, { useCallback, useEffect } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import './JsonRendererPage.css';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
// [핵심 수정] useUIStore 임포트 제거
// import { useUIStore } from '../shared/store/uiStore';

const JsonRendererPage: React.FC = () => {
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    // [핵심 수정] setRightSidebarExpanded 선언 제거
    // const { setRightSidebarExpanded } = useUIStore();

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'prompt' });
        // [핵심 수정] setRightSidebarExpanded(true) 호출 제거
    }, [setRightSidebarContent]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'settings' });
        // [핵심 수정] setRightSidebarExpanded(true) 호출 제거
    }, [setRightSidebarContent]);

    const handleCloseSidebar = useCallback(() => {
        closeRightSidebar();
        // [핵심 수정] setRightSidebarExpanded(false) 호출 제거
    }, [closeRightSidebar]);

    useEffect(() => {
        const pageActionsToRegister: Partial<RegisteredPageActions> = {
            openPromptSidebar: handleOpenPromptSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        };
        registerPageActions(pageActionsToRegister);

        return () => {
            unregisterPageActions(Object.keys(pageActionsToRegister) as (keyof RegisteredPageActions)[]);
        };
    }, [registerPageActions, unregisterPageActions, handleOpenPromptSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);

    return (
        <div className="json-renderer-page">
            <JsonProblemImporterWidget />
        </div>
    );
};

export default JsonRendererPage;