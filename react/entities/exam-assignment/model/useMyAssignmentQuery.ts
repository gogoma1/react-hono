import { useQuery } from '@tanstack/react-query';
import { fetchMyAssignmentAPI, type ExamAssignmentWithSet } from '../api/examAssignmentApi';

// React Query에서 사용할 고유한 쿼리 키를 정의합니다.
export const MY_ASSIGNMENT_QUERY_KEY = 'myAssignment';

/**
 * 로그인한 학생의 최신 시험 과제 정보를 가져오는 React Query 훅.
 * 컴포넌트에서는 이 훅을 호출하기만 하면 데이터 fetching, 캐싱, 에러 처리 등이 자동으로 관리됩니다.
 */
export function useMyAssignmentQuery() {
    return useQuery<ExamAssignmentWithSet, Error>({
        queryKey: [MY_ASSIGNMENT_QUERY_KEY],
        queryFn: fetchMyAssignmentAPI,
    });
}