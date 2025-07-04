import { useMutation } from '@tanstack/react-query';
import { publishExamSetAPI, type PublishExamSetPayload, type PublishExamSetResponse } from '../api/examSetApi'; // 경로는 실제 프로젝트에 맞게 확인해주세요.

/**
 * 시험지 세트 생성 및 할당을 위한 React Query Mutation
 */
export function usePublishExamSetMutation() {
    return useMutation<PublishExamSetResponse, Error, PublishExamSetPayload>({
        mutationFn: (payload) => publishExamSetAPI(payload),
        onSuccess: (data) => {
            // [핵심] alert 제거. 성공 피드백은 UI 변화(모달 닫힘 등)로 대체합니다.
            console.log('Exam set published successfully:', data.message);
        },
        onError: (error) => {
            // [핵심] alert 제거. 에러는 콘솔에 기록하고, UI(버튼 로딩 상태 해제)를 통해 사용자에게 피드백합니다.
            console.error('Exam set publication failed:', error);
        },
    });
}