import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { handleApiResponse } from '../../../shared/api/api.utils'; // [추가] API 응답 핸들러 import

import { useMobileExamSessionStore } from './mobileExamSessionStore';
import { useMobileExamAnswerStore } from './mobileExamAnswerStore';
import { useMobileExamTimeStore } from './mobileExamTimeStore';
import { analyzeExamResults } from '../utils/examResultAnalyzer';

interface SubmitPayload {
    exam_summary: any;
    problem_results: any[];
}
interface SubmitVariables {
    assignmentId: string;
    payload: SubmitPayload;
}

// [수정] 시험 제출 API의 기본 경로를 정의합니다.
const API_BASE_URL = '/api/exams';

export function useExamSubmit(assignmentId: string | null) {
    
    // [수정] useMutation의 mutationFn을 실제 API 호출 로직으로 변경합니다.
    const { mutate, isPending, isError, error } = useMutation<any, Error, SubmitVariables>({
        mutationFn: async (variables: SubmitVariables) => {
            const { assignmentId, payload } = variables;
            console.log("백엔드로 전송할 최종 페이로드:", JSON.stringify(payload, null, 2));

            const res = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            // handleApiResponse를 사용하여 응답을 처리합니다.
            return handleApiResponse(res);
        },
        onSuccess: (data) => {
            alert(data.message || '시험이 성공적으로 제출되었습니다.');
            // TODO: 성공 시 페이지 이동 또는 상태 초기화 로직 추가
        },
        onError: (err) => {
            alert(`시험 제출 실패: ${err.message}`);
        }
    });

    const handleSubmitExam = useCallback(() => {
        if (!assignmentId) {
            console.error("제출할 시험(assignment) ID가 없습니다.");
            alert("제출 처리 중 오류가 발생했습니다. (시험 ID 없음)");
            return;
        }

        useMobileExamSessionStore.getState().completeExam(); 

        const sessionState = useMobileExamSessionStore.getState();
        const answerState = useMobileExamAnswerStore.getState();
        const timeState = useMobileExamTimeStore.getState();

        const payload = analyzeExamResults(
            sessionState.orderedProblems,
            answerState,
            timeState
        );
        
        mutate({ assignmentId, payload });

    }, [assignmentId, mutate]);

    return {
        submitExam: handleSubmitExam,
        isSubmitting: isPending,
        isSubmitError: isError,
        submitError: error,
    };
}