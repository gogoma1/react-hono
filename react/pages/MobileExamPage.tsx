import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';

import { AssignmentList } from '../widgets/mobile-exam-loader/ui/AssignmentList';
import { useMyAssignmentsQuery } from '../entities/exam-assignment/model/useMyAssignmentQuery';
import type { ExamAssignmentWithSet } from '../entities/exam-assignment/api/examAssignmentApi';

import MobileExamView from '../widgets/mobile-exam-view/MobileExamView';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
// [핵심 수정] useUIStore 임포트 제거
// import { useUIStore } from '../shared/store/uiStore';
import { useMobileExamSessionStore } from '../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamTimeStore } from '../features/mobile-exam-session/model/mobileExamTimeStore';
import { useMobileExamAnswerStore } from '../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useProblemsByIdsQuery } from '../entities/problem/model/useProblemsQuery';
import type { ProcessedProblem } from '../features/problem-publishing';
import { useExamSubmit } from '../features/mobile-exam-session/model/useExamSubmit';
import { useMyProfileQuery } from '../entities/profile/model/useProfileQuery';
import { analyzeAndBuildReport } from '../entities/exam-report/model/analyzer';
import { useToast } from '../shared/store/toastStore';
import './MobileExamPage.css';

const useHasHydrated = () => {
    const [hydrated, setHydrated] = useState(useMobileExamTimeStore.persist.hasHydrated);
  
    useEffect(() => {
      const unsubFinishHydration = useMobileExamTimeStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      
      setHydrated(useMobileExamTimeStore.persist.hasHydrated());
  
      return () => {
        unsubFinishHydration();
      };
    }, []);
  
    return hydrated;
};


const MobileExamPage: React.FC = () => {
    const navigate = useNavigate();
    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    // [핵심 수정] setRightSidebarExpanded 선언 제거
    // const { setRightSidebarExpanded } = useUIStore.getState();
    const { resetSession, initializeSession, resumeSession, isSessionActive } = useMobileExamSessionStore();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const hasHydrated = useHasHydrated();

    const [selectedAssignment, setSelectedAssignment] = useState<ExamAssignmentWithSet | null>(null);

    const mode = searchParams.get('mode');
    const isTeacherPreviewMode = mode === 'teacher-preview';
    
    const { data: myProfile, isLoading: isLoadingProfile } = useMyProfileQuery();
    
    const { 
        data: assignmentsData, 
        isLoading: isLoadingAssignments, 
        isError: isAssignmentError,
        error: assignmentError 
    } = useMyAssignmentsQuery({
        enabled: !isTeacherPreviewMode,
    });

    const problemIds = useMemo(() => {
        if (isTeacherPreviewMode) return searchParams.get('problemIds')?.split(',');
        if (selectedAssignment) return selectedAssignment.examSet.problem_ids;
        return undefined;
    }, [isTeacherPreviewMode, searchParams, selectedAssignment]);

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
    
    const { submitExam, isSubmitting } = useExamSubmit(
        selectedAssignment, 
        orderedProblems, 
        myProfile || null
    );

    const handlePreviewSubmit = useCallback(() => {
        toast.info("미리보기 모드에서는 결과가 저장되지 않습니다.");
        
        useMobileExamSessionStore.getState().completeExam(); 

        const answerState = useMobileExamAnswerStore.getState();
        const timeState = useMobileExamTimeStore.getState();

        const mockAssignmentInfo: ExamAssignmentWithSet = {
            id: 'teacher-preview-assignment',
            examSet: {
                id: searchParams.get('examSetId') || 'preview-set',
                title: '시험지 미리보기',
                problem_ids: problemIds || [],
                creator_id: myProfile?.id || '',
                header_info: null
            },
            student_member_id: '',
            status: 'completed',
            correct_rate: null,
            total_pure_time_seconds: null,
            total_duration_seconds: null,
            answer_change_total_count: null,
            assigned_at: new Date(),
            started_at: timeState.examStartTime,
            completed_at: timeState.examEndTime,
        };
        
        const mockProfile = {
            name: `${myProfile?.name || '선생님'} (미리보기)`,
        };

        const fullReport = analyzeAndBuildReport({
            problems: orderedProblems,
            answerState,
            timeState,
            assignmentInfo: mockAssignmentInfo,
            studentProfile: mockProfile,
        });
        
        useMobileExamSessionStore.getState().resetSession();
        navigate(`/exam-report/preview`, { state: { reportData: fullReport } });
    }, [orderedProblems, myProfile, problemIds, navigate, toast, searchParams]);
    
    useEffect(() => {
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
        if (!hasHydrated || orderedProblems.length === 0 || isSessionActive) {
            return;
        }

        const existingStartTime = useMobileExamTimeStore.getState().examStartTime;

        if (existingStartTime && !isTeacherPreviewMode) {
            console.log("저장된 세션 데이터를 발견했습니다. 세션을 복원합니다.", { startTime: existingStartTime });
            resumeSession(orderedProblems);
        } else {
            console.log("저장된 세션이 없거나 미리보기 모드입니다. 새 세션을 시작합니다.");
            initializeSession(orderedProblems);
        }

    }, [orderedProblems, isSessionActive, initializeSession, resumeSession, hasHydrated, isTeacherPreviewMode]);
    
    useEffect(() => {
        const handleOpenSettingsSidebar = () => setRightSidebarContent({ type: 'settings' });
        const handleCloseSidebar = () => closeRightSidebar();
        
        const pageActions: Partial<RegisteredPageActions> = {
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar
        };
        registerPageActions(pageActions);
        
        return () => {
            unregisterPageActions(Object.keys(pageActions) as Array<keyof RegisteredPageActions>);
            handleCloseSidebar();
        };
    }, [registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar]);
    
    const isLoading = (!isTeacherPreviewMode && (isLoadingAssignments || isLoadingProfile)) || isLoadingProblems || !hasHydrated;
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
                    <MobileExamView
                        problems={orderedProblems}
                        isTeacherPreview={isTeacherPreviewMode}
                        onSubmitExam={isTeacherPreviewMode ? handlePreviewSubmit : submitExam}
                        isSubmitting={isTeacherPreviewMode ? false : isSubmitting}
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
        if (assignmentsData.length > 0 || selectedAssignment) {
            return renderExamView();
        }
    }
    
    return <div className="mobile-exam-page-status"><h2>시험지 없음</h2><p>배포받은 시험지가 없습니다.</p></div>;
};

export default MobileExamPage;