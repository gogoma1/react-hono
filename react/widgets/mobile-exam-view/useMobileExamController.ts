// ----- ./react/widgets/mobile-exam-view/useMobileExamController.ts -----
import { useCallback } from 'react';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore';
import type { MarkingStatus } from '../../features/omr-marking';

interface MobileExamControllerOptions {
    isPreview?: boolean;
}

interface NextClickOptions {
    isCompleted: boolean;
    answerChanged: boolean;
}

export function useMobileExamController(options: MobileExamControllerOptions = {}) {
    // isPreview는 여기서 받아두지만, 상태 변경 로직 자체를 막는 데에는 사용하지 않습니다.
    const { isPreview = false } = options;

    const { setActiveProblemId, skipProblem, completeExam } = useMobileExamSessionStore();
    const { markStatus } = useMobileExamAnswerStore();
    const { finalizeProblemTime } = useMobileExamTimeStore();
    
    const handleNavClick = useCallback((problemId: string) => {
        console.log(`[Controller] handleNavClick 호출됨. problemId: ${problemId}`);
        if (useMobileExamSessionStore.getState().activeProblemId === problemId) {
            console.log(`[Controller] 이미 활성화된 문제이므로 액션 중단.`);
            return;
        }
        
        setActiveProblemId(problemId);
    }, [setActiveProblemId]);

    const handleNextClick = useCallback((problemId: string, { isCompleted, answerChanged }: NextClickOptions) => {
        console.log(`[Controller] handleNextClick 호출됨. problemId: ${problemId}`, { isCompleted, answerChanged });
        
        // [핵심 수정] isPreview 체크 제거
        if (!isCompleted) {
            console.log(`[Controller] '풀이 미완료' 상태. skipProblem 실행.`);
            skipProblem(problemId);
        } else {
            console.log(`[Controller] '풀이 완료' 상태. skipProblem 실행 안 함.`);
        }

        if (!isCompleted || answerChanged) {
            console.log(`[Controller] '풀이 미완료' 또는 '답안 변경됨' 상태. finalizeProblemTime 실행.`);
            finalizeProblemTime(problemId);
        } else {
            console.log(`[Controller] '풀이 완료' 상태이고 '답안 변경 없음'. finalizeProblemTime 실행 안 함.`);
        }
    }, [skipProblem, finalizeProblemTime]);

    const handleMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        console.log(`[Controller] handleMarkStatus 호출됨. problemId: ${problemId}, status: ${status}`);
        
        // [핵심 수정] isPreview 체크 제거
        console.log(`[Controller] markStatus 실행.`);
        markStatus(problemId, status);
        console.log(`[Controller] finalizeProblemTime 실행.`);
        finalizeProblemTime(problemId);
    }, [markStatus, finalizeProblemTime]);

    const handleSubmitExam = useCallback(() => {
        console.log(`[Controller] handleSubmitExam 호출됨.`);
        // 최종 제출과 같은 영구적인 액션은 isPreview에 따라 분기 처리하는 것이 좋습니다.
        if (isPreview) {
            alert("시험 체험이 완료되었습니다. 실제 학생은 이 단계에서 시험지가 제출되고 결과 분석이 시작됩니다.");
        } else {
            alert("시험이 제출되었습니다! 수고하셨습니다.");
        }
        completeExam();
    }, [isPreview, completeExam]);

    return {
        handleNavClick,
        handleNextClick,
        handleMarkStatus,
        handleSubmitExam,
    };
}