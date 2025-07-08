import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    publishExamSetAPI, 
    fetchMyPublishedExamSetsAPI,
    type PublishExamSetPayload, 
    type PublishExamSetResponse,
    type MyPublishedExamSet
} from '../api/examSetApi';

export const MY_EXAM_SETS_QUERY_KEY = 'myExamSets';

/**
 * 시험지 세트 생성 및 할당을 위한 React Query Mutation
 */
export function usePublishExamSetMutation() {
    const queryClient = useQueryClient();
    return useMutation<PublishExamSetResponse, Error, PublishExamSetPayload>({
        mutationFn: (payload) => publishExamSetAPI(payload),
        onSuccess: (data) => {
            console.log('Exam set published successfully:', data.message);
            alert(data.message);
            queryClient.invalidateQueries({ queryKey: [MY_EXAM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            console.error('Exam set publication failed:', error);
            alert(`시험지 출제 실패: ${error.message}`);
        },
    });
}

// [수정] 옵션 타입을 인터페이스로 정의합니다.
interface UseMyPublishedExamSetsQueryOptions {
    enabled?: boolean;
}

/**
 * [수정] 내가 출제한 모바일 시험지 목록을 가져오는 React Query 훅
 */
// [수정] options 객체를 받도록 시그니처를 수정합니다.
export function useMyPublishedExamSetsQuery(options: UseMyPublishedExamSetsQueryOptions = {}) {
    const { enabled = true } = options; // 기본값은 true로 설정

    return useQuery<MyPublishedExamSet[], Error>({
        queryKey: [MY_EXAM_SETS_QUERY_KEY],
        queryFn: fetchMyPublishedExamSetsAPI,
        staleTime: 1000 * 60 * 5, // 5분
        enabled: enabled, // 인자로 받은 enabled 값을 사용
    });
}