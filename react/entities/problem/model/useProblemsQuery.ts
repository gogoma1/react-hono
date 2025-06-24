// react/entities/problem/model/useProblemsQuery.ts

import { useQuery } from '@tanstack/react-query';
import { fetchProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';

export const PROBLEMS_QUERY_KEY = 'problems';

export function useProblemsQuery() {
    return useQuery<Problem[], Error>({
        queryKey: [PROBLEMS_QUERY_KEY],
        queryFn: fetchProblemsAPI,
    });
}