import React, { useEffect, useCallback, useMemo } from 'react';
import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';
import { useProblemPublishingStore, type ProcessedProblem } from '../features/problem-publishing/model/problemPublishingStore';
import { useMobileExamSessionStore } from '../features/mobile-exam-session/model/mobileExamSessionStore'; // [핵심 수정]
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const { distributedPages, placementMap } = useExamLayoutStore();
    const allProblems = useProblemPublishingStore(state => state.draftProblems ?? state.initialProblems);
    const { initializeSession, resetSession } = useMobileExamSessionStore(); // [핵심 수정]

    const orderedProblems = useMemo(() => {
        if (!distributedPages || distributedPages.length === 0) return [];
        const latestProblemsMap = new Map(allProblems.map(p => [p.uniqueId, p]));
        const flatSortedItems = distributedPages.flatMap(pageItems => 
            [...pageItems].filter(item => item.type === 'problem')
            .sort((a, b) => (placementMap.get(a.uniqueId)?.column ?? 1) - (placementMap.get(b.uniqueId)?.column ?? 1))
        );
        return flatSortedItems.map(item => latestProblemsMap.get((item.data as ProcessedProblem).uniqueId)).filter((p): p is ProcessedProblem => !!p);
    }, [distributedPages, placementMap, allProblems]);

    useEffect(() => {
        document.documentElement.classList.add('mobile-exam-layout-active');
        // 세션 초기화는 한 번만 호출
        initializeSession(orderedProblems);
        return () => {
            document.documentElement.classList.remove('mobile-exam-layout-active');
            // 컴포넌트 언마운트 시 세션 리셋
            resetSession();
        };
    }, [orderedProblems, initializeSession, resetSession]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'settings' }, 
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarExpanded(false);
        setTimeout(() => setRightSidebarConfig({ contentConfig: { type: null } }), 300);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    useEffect(() => {
        registerPageActions({ openSettingsSidebar: handleOpenSettingsSidebar, onClose: handleCloseSidebar });
        return () => {
            registerPageActions({ openSettingsSidebar: undefined, onClose: undefined });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenSettingsSidebar, handleCloseSidebar]);

    return (
        <div className="mobile-exam-page">
            <MobileExamView />
        </div>
    );
};

export default MobileExamPage;