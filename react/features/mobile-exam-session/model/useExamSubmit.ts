import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import { useMobileExamSessionStore } from './mobileExamSessionStore';
import { useMobileExamAnswerStore } from './mobileExamAnswerStore';
import { useMobileExamTimeStore } from './mobileExamTimeStore';
import { analyzeExamResults } from '../utils/examResultAnalyzer'; // [핵심] 유틸리티 함수 import

// ... (API 함수 및 타입 정의는 동일)
interface SubmitPayload {
    exam_summary: any;
    problem_results: any[];
}
interface SubmitVariables {
    assignmentId: string;
    payload: SubmitPayload;
}
// const submitAssignmentAPI = async (variables: SubmitVariables) => { ... };

export function useExamSubmit(assignmentId: string | null) {
    
    const { mutate, isPending, isError, error } = useMutation<any, Error, SubmitVariables>({
        // mutationFn: submitAssignmentAPI
        mutationFn: async (variables: SubmitVariables) => {
            console.log("백엔드로 전송할 최종 페이로드:", JSON.stringify(variables.payload, null, 2));
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { message: '시험이 성공적으로 제출되었습니다.' };
        }
    });

    const handleSubmitExam = useCallback(() => {
        if (!assignmentId) {
            console.error("제출할 시험(assignment) ID가 없습니다.");
            return;
        }

        // 1. 시험 종료 상태로 변경 (타이머 정지 등)
        useMobileExamSessionStore.getState().completeExam(); 

        // 2. 모든 스토어에서 최종 상태 데이터 가져오기
        const sessionState = useMobileExamSessionStore.getState();
        const answerState = useMobileExamAnswerStore.getState();
        const timeState = useMobileExamTimeStore.getState();

        // 3. [핵심] 데이터 분석 및 가공 로직을 유틸리티 함수에 위임
        const payload = analyzeExamResults(
            sessionState.orderedProblems,
            answerState,
            timeState
        );
        
        // 4. API 호출
        mutate({ assignmentId, payload });

    }, [assignmentId, mutate]);

    return {
        submitExam: handleSubmitExam,
        isSubmitting: isPending,
        isSubmitError: isError,
        submitError: error,
    };
}