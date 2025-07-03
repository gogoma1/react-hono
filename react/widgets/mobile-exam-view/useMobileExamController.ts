import { useCallback } from 'react';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore';
// [핵심 수정] './ui/OmrMarkingCard' 대신 피처의 index 파일에서 타입을 가져옵니다.
import type { MarkingStatus } from '../../features/omr-marking';

/**
 * MobileExamView의 사용자 인터랙션을 처리하는 핸들러 함수들을 제공하는 훅.
 * 이 훅은 상태를 직접 구독하거나 useEffect를 사용하지 않고, 순수 로직만 담당합니다.
 */
export function useMobileExamController() {
    
    // 이 함수는 이제 순수하게 'activeProblemId'를 변경하는 책임만 가집니다.
    const handleNavClick = useCallback((problemId: string) => {
        const { activeProblemId, setActiveProblemId } = useMobileExamSessionStore.getState();
        if (activeProblemId === problemId) return;
        
        setActiveProblemId(problemId);
    }, []);

    // 이 함수는 'skip' 상태를 추가하고 다음 문제로 넘어가는 '신호'를 보냅니다.
    const handleNextClick = useCallback((problemId: string) => {
        useMobileExamSessionStore.getState().skipProblem(problemId);
    }, []);

    // 이 함수는 'status'를 마킹하고 시간을 확정하는 책임만 가집니다.
    const handleMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        useMobileExamAnswerStore.getState().markStatus(problemId, status);
        useMobileExamTimeStore.getState().finalizeProblemTime(problemId);
    }, []);

    const handleSubmitExam = useCallback(() => {
        useMobileExamSessionStore.getState().completeExam();
        alert("시험이 제출되었습니다! 수고하셨습니다.");
    }, []);

    return {
        handleNavClick,
        handleNextClick,
        handleMarkStatus,
        handleSubmitExam,
    };
}