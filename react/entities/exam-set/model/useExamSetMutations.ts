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
        // ✨ --- 여기가 핵심 수정 부분입니다 --- ✨
        onError: (error: any) => { // error 타입을 any로 받아서 커스텀 프로퍼티에 접근합니다.
            console.error('Exam set publication failed (raw error object):', error);
            
            // 백엔드에서 보낸 상세 디버깅 정보가 있다면 콘솔에 별도로 자세히 출력합니다.
            if (error && error.details) {
                console.error("🔥 DETAILED BACKEND ERROR:", error.details);
            }

            // 사용자에게 보여주는 alert은 간결하게 유지합니다.
            alert(`시험지 출제 실패: ${error.message}`);
        },
        // ✨ --- 여기까지 수정 --- ✨
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