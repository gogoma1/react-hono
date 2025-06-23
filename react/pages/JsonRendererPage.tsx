import React, { useCallback, useEffect } from 'react';
import JsonProblemImporterWidget from '../widgets/json-problem-importer/JsonProblemImporterWidget';
import './JsonRendererPage.css';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
// [추가] 프롬프트 컬렉션 컴포넌트 import
import PromptCollection from '../features/prompt-collection/ui/PromptCollection';

const JsonRendererPage: React.FC = () => {
    const { registerPageActions, setRightSidebarContent } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore();

    // [추가] 프롬프트 모음 사이드바를 여는 핸들러
    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarContent(<PromptCollection />);
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarContent(
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                <h4>JSON 렌더러 설정</h4>
                <p>이곳에 JSON 렌더러 관련 설정 UI가 표시될 예정입니다.</p>
            </div>
        );
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarExpanded(false);
        setTimeout(() => setRightSidebarContent(null), 300);
    }, [setRightSidebarExpanded, setRightSidebarContent]);

    useEffect(() => {
        // [수정] registerPageActions에 openPromptSidebar 핸들러 추가
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
        };
    }, [registerPageActions, handleOpenPromptSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);

    return (
        <div className="json-renderer-page">
            <JsonProblemImporterWidget />
        </div>
    );
};

export default JsonRendererPage;