import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useMobileExamSessionStore } from '../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMyAssignmentQuery } from '../entities/exam-assignment/model/useMyAssignmentQuery';
import { useProblemsByIdsQuery } from '../entities/problem/model/useProblemsQuery';
import type { ProcessedProblem } from '../features/problem-publishing';
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {
    // --- 1. 스토어 및 라우터 훅 ---
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const { resetSession, initializeSession, isSessionActive } = useMobileExamSessionStore();
    const [searchParams] = useSearchParams();

    // --- 2. 모드 구분 ---
    const mode = searchParams.get('mode');
    const isTeacherPreviewMode = mode === 'teacher-preview';

    // --- 3. 데이터 로딩 ---
    const { 
        data: assignmentData, 
        isLoading: isLoadingAssignment, 
        isError: isAssignmentError,
        error: assignmentError 
    } = useMyAssignmentQuery({
        enabled: !isTeacherPreviewMode,
    });

    const teacherPreviewProblemIds = useMemo(() => {
        if (!isTeacherPreviewMode) return undefined;
        return searchParams.get('problemIds')?.split(',');
    }, [isTeacherPreviewMode, searchParams]);

    const problemIds = isTeacherPreviewMode ? teacherPreviewProblemIds : assignmentData?.examSet.problem_ids;

    const { 
        data: problems, 
        isLoading: isLoadingProblems,
        isError: isProblemsError,
        error: problemsError
    } = useProblemsByIdsQuery(problemIds);

    // --- 4. 데이터 가공 ---
    const orderedProblems = useMemo((): ProcessedProblem[] => {
        if (!problems) return [];
        return problems.map((p): ProcessedProblem => ({
            ...p,
            uniqueId: p.problem_id,
            display_question_number: p.problem_type === '서답형' ? `서답형 ${p.question_number}` : String(p.question_number),
        }));
    }, [problems]);
    
    // --- 5. 세션 및 레이아웃 관리 useEffect ---
    useEffect(() => {
        // 이 효과는 페이지 진입/이탈 시 단 한번만 실행되어야 하므로 의존성 배열을 비웁니다.
        resetSession();
        document.documentElement.classList.add('mobile-exam-layout-active');
        return () => {
            resetSession();
            document.documentElement.classList.remove('mobile-exam-layout-active');
        };
    }, [resetSession]);

    useEffect(() => {
        if (orderedProblems.length > 0 && !isSessionActive) {
            console.log(`🚀 Initializing mobile exam session. Mode: ${isTeacherPreviewMode ? 'Teacher Preview' : 'Student'}`);
            initializeSession(orderedProblems);
        }
    }, [orderedProblems, isSessionActive, initializeSession, isTeacherPreviewMode]);
    
    // --- 6. [핵심 수정] 사이드바 액션 등록 useEffect ---
    useEffect(() => {
        const handleOpenSettingsSidebar = () => {
            // 오른쪽 사이드바의 내용을 'settings' 타입으로 설정합니다.
            // RightSidebar.tsx는 이 타입을 보고 ExamTimerDisplay를 렌더링할 것입니다.
            setRightSidebarContent({ type: 'settings' });
            setRightSidebarExpanded(true);
        };
        const handleCloseSidebar = () => {
            closeRightSidebar();
            setRightSidebarExpanded(false);
        };
        
        const pageActions: Partial<RegisteredPageActions> = {
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar
        };

        registerPageActions(pageActions);
        
        return () => {
            unregisterPageActions(Object.keys(pageActions) as Array<keyof RegisteredPageActions>);
            handleCloseSidebar();
        };
    }, [registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar, setRightSidebarExpanded]);

    // --- 7. 로딩 및 에러 처리 ---
    const isLoading = isLoadingAssignment || isLoadingProblems;
    const isError = isAssignmentError || isProblemsError;
    const error = assignmentError || problemsError;

    if (isLoading) {
        return (
            <div className="mobile-exam-page-status">
                <h2>시험지 로딩 중...</h2>
                <p>잠시만 기다려주세요.</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mobile-exam-page-status error">
                <h2>오류 발생</h2>
                <p>시험지를 불러오는 데 실패했습니다.</p>
                <pre>{error?.message}</pre>
            </div>
        );
    }

    if (!isTeacherPreviewMode && !assignmentData) {
        return (
            <div className="mobile-exam-page-status">
                <h2>시험지 없음</h2>
                <p>배포받은 시험지가 없습니다.</p>
            </div>
        );
    }
    
    // --- 8. 최종 렌더링 ---
    return (
        <div className="mobile-exam-page">
            <MobileExamView problems={orderedProblems} isPreview={isTeacherPreviewMode} />
        </div>
    );
};

export default MobileExamPage;