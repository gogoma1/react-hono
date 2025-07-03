import React, { useEffect, useCallback, useMemo } from 'react';
import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';
import { useProblemPublishingStore, type ProcessedProblem } from '../features/problem-publishing/model/problemPublishingStore';
import { useMobileExamSessionStore } from '../features/mobile-exam-session/model/mobileExamSessionStore';
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const { resetSession, initializeSession } = useMobileExamSessionStore();

    // [핵심] '문제 출제' 페이지에서 만들어진 레이아웃과 문제 목록을 가져옵니다.
    const { distributedPages, placementMap } = useExamLayoutStore();
    const allProblems = useProblemPublishingStore(state => state.draftProblems ?? state.initialProblems);

    // [핵심] 외부 데이터로부터 시험에 사용될 문제 목록(orderedProblems)을 생성합니다.
    const orderedProblems = useMemo(() => {
        if (!distributedPages || distributedPages.length === 0) return [];
        const latestProblemsMap = new Map(allProblems.map(p => [p.uniqueId, p]));
        const flatSortedItems = distributedPages.flatMap(pageItems => 
            [...pageItems].filter(item => item.type === 'problem')
            .sort((a, b) => (placementMap.get(a.uniqueId)?.column ?? 1) - (placementMap.get(b.uniqueId)?.column ?? 1))
        );
        return flatSortedItems.map(item => latestProblemsMap.get((item.data as ProcessedProblem).uniqueId)).filter((p): p is ProcessedProblem => !!p);
    }, [distributedPages, placementMap, allProblems]);


    // [핵심] `orderedProblems`가 준비되면 세션을 초기화하고, 페이지를 떠날 때 리셋합니다.
    useEffect(() => {
        document.documentElement.classList.add('mobile-exam-layout-active');
        
        // 문제 목록이 있을 때만 세션을 초기화합니다.
        if (orderedProblems.length > 0) {
            initializeSession(orderedProblems);
        }

        return () => {
            document.documentElement.classList.remove('mobile-exam-layout-active');
            resetSession();
        };
    }, [orderedProblems, initializeSession, resetSession]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'settings' } });
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

    // [핵심] MobileExamView에는 이제 props를 전달하지 않습니다.
    // MobileExamView는 내부적으로 컨트롤러를 통해 store에서 데이터를 가져옵니다.
    return (
        <div className="mobile-exam-page">
            <MobileExamView />
        </div>
    );
};

export default MobileExamPage;