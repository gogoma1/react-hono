import React, { useCallback, useEffect } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import './JsonRendererPage.css';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';

const JsonRendererPage: React.FC = () => {
    // 스토어에서 액션 함수들을 가져옵니다.
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore();

    // 이 페이지에서 필요한 사이드바 액션 핸들러들을 정의합니다.
    const handleOpenPromptSidebar = useCallback(() => {
        // 이 페이지는 workbenchContent가 없으므로 props를 전달하지 않습니다.
        setRightSidebarContent({ type: 'prompt' });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'settings' });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        closeRightSidebar();
        setRightSidebarExpanded(false);
    }, [closeRightSidebar, setRightSidebarExpanded]);

    // 페이지가 마운트/언마운트 될 때 액션을 등록/해제합니다.
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