import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { AssignmentList } from '../widgets/mobile-exam-loader/ui/AssignmentList';
import { useMyAssignmentsQuery } from '../entities/exam-assignment/model/useMyAssignmentQuery';
import type { ExamAssignmentWithSet } from '../entities/exam-assignment/api/examAssignmentApi';

import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useMobileExamSessionStore } from '../features/mobile-exam-session/model/mobileExamSessionStore';
import { useProblemsByIdsQuery } from '../entities/problem/model/useProblemsQuery';
import type { ProcessedProblem } from '../features/problem-publishing';
import { useExamSubmit } from '../features/mobile-exam-session/model/useExamSubmit'; // [추가] useExamSubmit 훅 임포트
import './MobileExamPage.css';

const MobileExamPage: React.FC = () => {
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const { resetSession, initializeSession, isSessionActive } = useMobileExamSessionStore();
    const [searchParams] = useSearchParams();

    const [selectedAssignment, setSelectedAssignment] = useState<ExamAssignmentWithSet | null>(null);

    const mode = searchParams.get('mode');
    const isTeacherPreviewMode = mode === 'teacher-preview';
    
    // [수정] 제출할 시험 ID를 상태에서 추출합니다.
    const assignmentIdToSubmit = useMemo(() => {
        if (isTeacherPreviewMode) return null;
        return selectedAssignment?.id ?? null;
    }, [isTeacherPreviewMode, selectedAssignment]);

    // [추가] useExamSubmit 훅을 페이지 레벨에서 호출합니다.
    const { submitExam, isSubmitting } = useExamSubmit(assignmentIdToSubmit);

    const { 
        data: assignmentsData, 
        isLoading: isLoadingAssignments, 
        isError: isAssignmentError,
        error: assignmentError 
    } = useMyAssignmentsQuery({
        enabled: !isTeacherPreviewMode,
    });

    const teacherPreviewProblemIds = useMemo(() => {
        if (!isTeacherPreviewMode) return undefined;
        return searchParams.get('problemIds')?.split(',');
    }, [isTeacherPreviewMode, searchParams]);

    const problemIds = useMemo(() => {
        if (isTeacherPreviewMode) {
            return teacherPreviewProblemIds;
        }
        if (selectedAssignment) {
            return selectedAssignment.examSet.problem_ids;
        }
        return undefined;
    }, [isTeacherPreviewMode, teacherPreviewProblemIds, selectedAssignment]);


    const { 
        data: problems, 
        isLoading: isLoadingProblems,
        isError: isProblemsError,
        error: problemsError
    } = useProblemsByIdsQuery(problemIds);

    const orderedProblems = useMemo((): ProcessedProblem[] => {
        if (!problems) return [];
        return problems.map((p): ProcessedProblem => ({
            ...p,
            uniqueId: p.problem_id,
            display_question_number: p.problem_type === '서답형' ? `서답형 ${p.question_number}` : String(p.question_number),
        }));
    }, [problems]);
    
    useEffect(() => {
        resetSession();
        document.documentElement.classList.add('mobile-exam-layout-active');
        return () => {
            resetSession();
            document.documentElement.classList.remove('mobile-exam-layout-active');
        };
    }, [resetSession]);

    useEffect(() => {
        if (assignmentsData && assignmentsData.length === 1) {
            setSelectedAssignment(assignmentsData[0]);
        }
    }, [assignmentsData]);

    useEffect(() => {
        if (orderedProblems.length > 0 && !isSessionActive) {
            console.log(`🚀 Initializing mobile exam session. Mode: ${isTeacherPreviewMode ? 'Teacher Preview' : 'Student'}`);
            initializeSession(orderedProblems);
        }
    }, [orderedProblems, isSessionActive, initializeSession, isTeacherPreviewMode]);
    
    useEffect(() => {
        const handleOpenSettingsSidebar = () => {
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

    const isLoading = (!isTeacherPreviewMode && isLoadingAssignments) || isLoadingProblems;
    const isError = isAssignmentError || isProblemsError;
    const error = assignmentError || problemsError;

    if (isLoading) {
        return <div className="mobile-exam-page-status"><h2>시험지 로딩 중...</h2><p>잠시만 기다려주세요.</p></div>;
    }
    if (isError) {
        return <div className="mobile-exam-page-status error"><h2>오류 발생</h2><p>시험지를 불러오는 데 실패했습니다.</p><pre>{error?.message}</pre></div>;
    }
    
    const renderExamView = () => {
        if (orderedProblems.length > 0 && isSessionActive) {
            return (
                <div className="mobile-exam-page">
                    {/* [수정] isTeacherPreviewMode, onSubmitExam, isSubmitting props를 전달합니다. */}
                    <MobileExamView
                        problems={orderedProblems}
                        isTeacherPreview={isTeacherPreviewMode}
                        onSubmitExam={submitExam}
                        isSubmitting={isSubmitting}
                    />
                </div>
            );
        }
        return <div className="mobile-exam-page-status"><h2>시험 세션 준비 중...</h2></div>;
    };

    if (isTeacherPreviewMode) {
        return renderExamView();
    }

    if (assignmentsData) {
        if (assignmentsData.length > 1 && !selectedAssignment) {
            return <AssignmentList assignments={assignmentsData} onSelectAssignment={setSelectedAssignment} />;
        }
        if (assignmentsData.length > 0) {
            return renderExamView();
        }
    }
    
    return <div className="mobile-exam-page-status"><h2>시험지 없음</h2><p>배포받은 시험지가 없습니다.</p></div>;
};

export default MobileExamPage;