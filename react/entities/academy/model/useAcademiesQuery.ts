import { useQuery } from '@tanstack/react-query';
import { fetchAcademiesAPI } from '../api/academyApi';
import type { Academy } from './types';

export const ACADEMIES_QUERY_KEY = 'academies';

/**
 * 학원 목록을 가져오는 React Query 훅
 */
export const useAcademiesQuery = () => {
    return useQuery<Academy[], Error>({
        queryKey: [ACADEMIES_QUERY_KEY],
        queryFn: fetchAcademiesAPI,
        staleTime: 1000 * 60 * 5, // 5분
    });
};