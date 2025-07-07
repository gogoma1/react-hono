import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // useQuery, useQueryClient 추가
import { 
    publishExamSetAPI, 
    fetchMyPublishedExamSetsAPI, // [신규]
    type PublishExamSetPayload, 
    type PublishExamSetResponse,
    type MyPublishedExamSet // [신규]
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
            // [신규] 시험지 출제 성공 시, 목록 쿼리를 무효화하여 자동 갱신
            queryClient.invalidateQueries({ queryKey: [MY_EXAM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            console.error('Exam set publication failed:', error);
            alert(`시험지 출제 실패: ${error.message}`);
        },
    });
}


/**
 * [신규] 내가 출제한 모바일 시험지 목록을 가져오는 React Query 훅
 */
export function useMyPublishedExamSetsQuery() {
    return useQuery<MyPublishedExamSet[], Error>({
        queryKey: [MY_EXAM_SETS_QUERY_KEY],
        queryFn: fetchMyPublishedExamSetsAPI,
        staleTime: 1000 * 60 * 5, // 5분
    });
}