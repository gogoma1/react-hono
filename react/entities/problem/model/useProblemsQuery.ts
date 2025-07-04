import { useQuery } from '@tanstack/react-query';
import { fetchProblemsAPI, fetchProblemsByIdsAPI } from '../api/problemApi'; // [수정] fetchProblemsByIdsAPI 임포트
import type { Problem } from './types';

export const PROBLEMS_QUERY_KEY = 'problems';

/**
 * 모든 문제를 가져오는 훅
 */
export function useProblemsQuery() {
    return useQuery<Problem[], Error>({
        queryKey: [PROBLEMS_QUERY_KEY],
        queryFn: fetchProblemsAPI,
    });
}

/**
 * [신규] ID 배열을 기반으로 특정 문제들만 가져오는 React Query 훅
 * @param problemIds - 조회할 문제 ID 배열. undefined이거나 비어있으면 쿼리가 실행되지 않습니다.
 */
export function useProblemsByIdsQuery(problemIds: string[] | undefined) {
    return useQuery<Problem[], Error>({
        // 쿼리 키에 problemIds를 포함하여, ID 목록이 바뀔 때마다 새로운 쿼리가 실행되도록 합니다.
        // 이렇게 하면 React Query가 다른 ID 목록에 대한 데이터를 별도로 캐싱할 수 있습니다.
        queryKey: [PROBLEMS_QUERY_KEY, 'byIds', problemIds],
        
        // problemIds가 유효할 때(undefined가 아니고 길이가 0보다 클 때)만 쿼리를 실행합니다.
        // `!`는 TypeScript에게 problemIds가 이 시점에는 undefined가 아님을 알려줍니다.
        queryFn: () => fetchProblemsByIdsAPI(problemIds!),
        enabled: !!problemIds && problemIds.length > 0,
    });
}