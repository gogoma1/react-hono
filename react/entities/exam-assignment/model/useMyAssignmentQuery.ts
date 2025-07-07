import { useQuery } from '@tanstack/react-query';
import { fetchMyAssignmentAPI, type ExamAssignmentWithSet } from '../api/examAssignmentApi';

export const MY_ASSIGNMENT_QUERY_KEY = 'myAssignment';

// [신규] 쿼리 옵션을 위한 인터페이스
interface UseMyAssignmentQueryOptions {
    enabled?: boolean;
}

/**
 * 로그인한 학생의 최신 시험 과제 정보를 가져오는 React Query 훅.
 * @param {UseMyAssignmentQueryOptions} options - React Query 옵션 (예: enabled)
 */
export function useMyAssignmentQuery(options: UseMyAssignmentQueryOptions = {}) {
    const { enabled = true } = options; // 기본값은 true

    return useQuery<ExamAssignmentWithSet, Error>({
        queryKey: [MY_ASSIGNMENT_QUERY_KEY],
        queryFn: fetchMyAssignmentAPI,
        enabled: enabled, // 인자로 받은 enabled 값을 사용
    });
}