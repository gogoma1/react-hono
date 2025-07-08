import { useQuery } from '@tanstack/react-query';
import { fetchMyAssignmentsAPI, type ExamAssignmentWithSet } from '../api/examAssignmentApi';

export const MY_ASSIGNMENTS_QUERY_KEY = 'myAssignments';

// [수정] 옵션 타입을 명확히 하고, 선택적으로 만듭니다.
interface UseMyAssignmentsQueryOptions {
    enabled?: boolean;
}

/**
 * [수정] 로그인한 학생의 '모든' 시험 과제 목록을 가져오는 React Query 훅.
 * @param {UseMyAssignmentsQueryOptions} options - React Query 옵션 (예: enabled)
 */
// [수정] options 객체를 받도록 시그니처를 수정합니다.
export function useMyAssignmentsQuery(options: UseMyAssignmentsQueryOptions = {}) {
    const { enabled = true } = options; // 기본값은 true로 설정

    return useQuery<ExamAssignmentWithSet[], Error>({
        queryKey: [MY_ASSIGNMENTS_QUERY_KEY],
        queryFn: fetchMyAssignmentsAPI,
        enabled: enabled, // 인자로 받은 enabled 값을 사용
    });
}