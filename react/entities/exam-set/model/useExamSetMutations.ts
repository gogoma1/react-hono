import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    publishExamSetAPI, 
    fetchMyPublishedExamSetsAPI,
    type PublishExamSetPayload, 
    type PublishExamSetResponse,
    type MyPublishedExamSet
} from '../api/examSetApi';
import { useToast } from '../../../shared/store/toastStore'; // [추가]

export const MY_EXAM_SETS_QUERY_KEY = 'myExamSets';

/**
 * 시험지 세트 생성 및 할당을 위한 React Query Mutation
 */
export function usePublishExamSetMutation() {
    const queryClient = useQueryClient();
    const toast = useToast(); // [추가]

    return useMutation<PublishExamSetResponse, Error, PublishExamSetPayload>({
        mutationFn: (payload) => publishExamSetAPI(payload),
        onSuccess: (data) => {
            console.log('Exam set published successfully:', data.message);
            toast.success(data.message); // [수정] alert -> toast.success
            queryClient.invalidateQueries({ queryKey: [MY_EXAM_SETS_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error('Exam set publication failed (raw error object):', error);
            
            if (error && error.details) {
                console.error("🔥 DETAILED BACKEND ERROR:", error.details);
            }

            toast.error(`시험지 출제 실패: ${error.message}`); // [수정] alert -> toast.error
        },
    });
}

interface UseMyPublishedExamSetsQueryOptions {
    enabled?: boolean;
}

/**
 * [수정] 내가 출제한 모바일 시험지 목록을 가져오는 React Query 훅
 */
export function useMyPublishedExamSetsQuery(options: UseMyPublishedExamSetsQueryOptions = {}) {
    const { enabled = true } = options; 

    return useQuery<MyPublishedExamSet[], Error>({
        queryKey: [MY_EXAM_SETS_QUERY_KEY],
        queryFn: fetchMyPublishedExamSetsAPI,
        staleTime: 1000 * 60 * 5,
        enabled: enabled,
    });
}