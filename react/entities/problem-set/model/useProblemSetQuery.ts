// ./react/entities/problem-set/model/useProblemSetQuery.ts

import { useQuery } from '@tanstack/react-query';
import { fetchMyProblemSetsAPI } from '../api/problemSetApi';
import type { MyProblemSet } from './types';

export const MY_PROBLEM_SETS_QUERY_KEY = 'myProblemSets';

/**
 * 내가 접근 가능한 모든 문제집 목록을 가져오는 React Query 훅.
 */
export function useMyProblemSetsQuery() {
    return useQuery<MyProblemSet[], Error>({
        queryKey: [MY_PROBLEM_SETS_QUERY_KEY],
        queryFn: fetchMyProblemSetsAPI,
        staleTime: 1000 * 60 * 5, // 5분
    });
}