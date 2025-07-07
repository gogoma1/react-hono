import { useCallback } from 'react';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore';
import type { MarkingStatus } from '../../features/omr-marking';

// [신규] 컨트롤러 옵션 인터페이스
interface MobileExamControllerOptions {
    isPreview?: boolean;
}

/**
 * MobileExamView의 사용자 인터랙션을 처리하는 핸들러 함수들을 제공하는 훅.
 * @param {MobileExamControllerOptions} options - 컨트롤러의 동작을 제어하는 옵션
 */
export function useMobileExamController(options: MobileExamControllerOptions = {}) {
    const { isPreview = false } = options;
    
    const handleNavClick = useCallback((problemId: string) => {
        const { activeProblemId, setActiveProblemId } = useMobileExamSessionStore.getState();
        if (activeProblemId === problemId) return;
        
        setActiveProblemId(problemId);
    }, []);

    const handleNextClick = useCallback((problemId: string) => {
        // 미리보기 모드에서는 다음 문제로 넘어가도 스킵 처리하지 않음
        if (!isPreview) {
            useMobileExamSessionStore.getState().skipProblem(problemId);
        }
    }, [isPreview]);

    const handleMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        useMobileExamAnswerStore.getState().markStatus(problemId, status);
        // 미리보기 모드에서는 시간 기록을 확정하지 않음
        if (!isPreview) {
            useMobileExamTimeStore.getState().finalizeProblemTime(problemId);
        }
    }, [isPreview]);

    const handleSubmitExam = useCallback(() => {
        // [핵심] isPreview 값에 따라 분기 처리
        if (isPreview) {
            alert("시험 체험이 완료되었습니다. 실제 학생은 이 단계에서 시험지가 제출되고 결과 분석이 시작됩니다.");
            // 미리보기 모드에서는 세션만 종료
            useMobileExamSessionStore.getState().completeExam();
        } else {
            // 실제 학생 시험 모드에서는 제출 로직 실행
            useMobileExamSessionStore.getState().completeExam();
            // TODO: 실제 서버로 답안 데이터를 전송하는 API 호출 로직 추가
            alert("시험이 제출되었습니다! 수고하셨습니다.");
        }
    }, [isPreview]);

    return {
        handleNavClick,
        handleNextClick,
        handleMarkStatus,
        handleSubmitExam,
    };
}