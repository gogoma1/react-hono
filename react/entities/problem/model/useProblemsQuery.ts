import { useQuery } from '@tanstack/react-query';
import { fetchProblemsAPI, fetchProblemsByIdsAPI } from '../api/problemApi';
import type { Problem } from './types';

export const PROBLEMS_QUERY_KEY = 'problems';

/**
 * 모든 문제를 가져오는 훅
 */
export function useProblemsQuery() {
    return useQuery<Problem[], Error>({
        queryKey: [PROBLEMS_QUERY_KEY],
        queryFn: fetchProblemsAPI,
        // [핵심 개선] staleTime 추가. 문제 목록은 자주 바뀌지 않으므로 길게 설정 (예: 10분)
        staleTime: 1000 * 60 * 10,
    });
}

/**
 * [신규] ID 배열을 기반으로 특정 문제들만 가져오는 React Query 훅
 * @param problemIds - 조회할 문제 ID 배열. undefined이거나 비어있으면 쿼리가 실행되지 않습니다.
 */
export function useProblemsByIdsQuery(problemIds: string[] | undefined) {
    return useQuery<Problem[], Error>({
        queryKey: [PROBLEMS_QUERY_KEY, 'byIds', problemIds],
        
        queryFn: () => fetchProblemsByIdsAPI(problemIds!),
        enabled: !!problemIds && problemIds.length > 0,
        // [개선] 여기에도 staleTime을 적용할 수 있습니다.
        staleTime: 1000 * 60 * 5,
    });
}