import { useMutation } from '@tanstack/react-query';
// [수정됨] 변경된 타입과 함수를 import 합니다.
import { publishExamSetAPI, type PublishExamSetPayload, type PublishExamSetResponse } from '../api/examSetApi';

/**
 * 시험지 세트 생성 및 할당을 위한 React Query Mutation
 */
export function usePublishExamSetMutation() {
    // [수정됨] Mutation의 타입 파라미터를 snake_case 버전으로 변경합니다.
    return useMutation<PublishExamSetResponse, Error, PublishExamSetPayload>({
        mutationFn: (payload) => publishExamSetAPI(payload),
        onSuccess: (data) => {
            // [수정됨] 응답 데이터의 키도 snake_case로 변경됩니다. (data.exam_set_id)
            console.log('Exam set published successfully:', data.message);
        },
        onError: (error) => {
            console.error('Exam set publication failed:', error);
        },
    });
}