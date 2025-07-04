import React, { useEffect, useMemo } from 'react';
import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useMobileExamSessionStore } from '../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMyAssignmentQuery } from '../entities/exam-assignment/model/useMyAssignmentQuery';
import { useProblemsByIdsQuery } from '../entities/problem/model/useProblemsQuery';
import type { ProcessedProblem } from '../features/problem-publishing';
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {
    // --- 1. 레이아웃 및 세션 스토어 관련 훅 ---
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const { resetSession, initializeSession, isSessionActive } = useMobileExamSessionStore();

    // --- 2. [데이터 로딩] 학생의 최신 시험 과제 정보 가져오기 ---
    const { 
        data: assignmentData, 
        isLoading: isLoadingAssignment, 
        isError: isAssignmentError,
        error: assignmentError 
    } = useMyAssignmentQuery();

    // --- 3. [데이터 추출] 과제 정보에서 문제 ID 목록 추출 ---
    const problemIds = useMemo(() => assignmentData?.examSet.problem_ids, [assignmentData]);

    // --- 4. [데이터 로딩] 문제 ID 목록으로 실제 문제 데이터들 가져오기 ---
    const { 
        data: problems, 
        isLoading: isLoadingProblems,
        isError: isProblemsError,
        error: problemsError
    } = useProblemsByIdsQuery(problemIds);

    // --- 5. [데이터 가공] 가져온 문제들을 시험 세션에서 사용할 형태로 가공 ---
    const orderedProblems = useMemo((): ProcessedProblem[] => {
        if (!problems) return [];

        // 백엔드에서 ID 순서대로 정렬해서 보내주므로, 받은 순서를 그대로 사용합니다.
        // 문제 번호 표시 방식 등, UI에 필요한 추가 정보를 가공합니다.
        return problems.map((p): ProcessedProblem => ({
            ...p,
            uniqueId: p.problem_id,
            display_question_number: p.problem_type === '서답형' ? `서답형 ${p.question_number}` : String(p.question_number),
        }));
    }, [problems]);

    // --- 6. [세션 초기화] 문제 데이터가 준비되면 시험 세션을 시작 ---
    useEffect(() => {
        // 이 효과는 가공된 문제 배열이 준비되고, 아직 세션이 활성화되지 않았을 때만 실행됩니다.
        if (orderedProblems.length > 0 && !isSessionActive) {
            console.log("🚀 Initializing mobile exam session with fetched problems.");
            initializeSession(orderedProblems);
        }
    }, [orderedProblems, isSessionActive, initializeSession]);

    // --- 7. [공통 로직] 컴포넌트 마운트/언마운트 시 처리 ---
    useEffect(() => {
        document.documentElement.classList.add('mobile-exam-layout-active');
        
        // 페이지를 떠날 때(컴포넌트 언마운트 시) 세션을 초기화하여 깨끗한 상태로 만듭니다.
        return () => {
            document.documentElement.classList.remove('mobile-exam-layout-active');
            resetSession();
        };
    }, [resetSession]);

    // --- 8. [UI 로직] 사이드바 관련 핸들러 설정 ---
    useEffect(() => {
        const handleOpenSettingsSidebar = () => {
            setRightSidebarConfig({ contentConfig: { type: 'settings' } });
            setRightSidebarExpanded(true);
        };
        const handleCloseSidebar = () => {
            setRightSidebarExpanded(false);
            setTimeout(() => setRightSidebarConfig({ contentConfig: { type: null } }), 300);
        };
        
        registerPageActions({ openSettingsSidebar: handleOpenSettingsSidebar, onClose: handleCloseSidebar });
        
        return () => {
            registerPageActions({ openSettingsSidebar: undefined, onClose: undefined });
            handleCloseSidebar();
        };
    }, [registerPageActions, setRightSidebarConfig, setRightSidebarExpanded]);

    // --- 9. [UI 렌더링] 로딩 및 에러 상태에 따른 UI 분기 처리 ---
    if (isLoadingAssignment || isLoadingProblems) {
        return (
            <div className="mobile-exam-page-status">
                <h2>시험지 로딩 중...</h2>
                <p>잠시만 기다려주세요.</p>
            </div>
        );
    }

    if (isAssignmentError || isProblemsError) {
        return (
            <div className="mobile-exam-page-status error">
                <h2>오류 발생</h2>
                <p>시험지를 불러오는 데 실패했습니다.</p>
                <pre>{assignmentError?.message || problemsError?.message}</pre>
            </div>
        );
    }

    if (!assignmentData) {
        return (
            <div className="mobile-exam-page-status">
                <h2>시험지 없음</h2>
                <p>배포받은 시험지가 없습니다.</p>
            </div>
        );
    }
    
    // --- 10. [최종 렌더링] 모든 데이터가 준비되면 실제 시험 뷰 렌더링 ---
    return (
        <div className="mobile-exam-page">
            <MobileExamView />
        </div>
    );
};

export default MobileExamPage;