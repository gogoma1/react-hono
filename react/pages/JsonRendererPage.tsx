// ./react/pages/JsonRendererPage.tsx

import React, { useCallback, useEffect } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import './JsonRendererPage.css';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';

const JsonRendererPage: React.FC = () => {
    // [수정] setRightSidebarContent 대신 setRightSidebarConfig를 가져옵니다.
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore();

    const handleOpenPromptSidebar = useCallback(() => {
        // [수정] 설정 객체로 전달합니다. type: 'prompt'
        setRightSidebarConfig({ 
            contentConfig: { type: 'prompt' },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        // [수정] 설정 객체로 전달합니다. type: 'settings'
        setRightSidebarConfig({ 
            contentConfig: { type: 'settings' },
            isExtraWide: false
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarExpanded(false);
        // [수정] 닫을 때도 contentConfig의 type을 null로 설정합니다.
        setTimeout(() => setRightSidebarConfig({ contentConfig: { type: null } }), 300);
    }, [setRightSidebarExpanded, setRightSidebarConfig]);

    useEffect(() => {
        registerPageActions({
            openPromptSidebar: handleOpenPromptSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        });

        return () => {
            registerPageActions({
                openPromptSidebar: undefined,
                openSettingsSidebar: undefined,
                onClose: undefined,
            });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenPromptSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);

    return (
        <div className="json-renderer-page">
            <JsonProblemImporterWidget />
        </div>
    );
};

export default JsonRendererPage;