import { useQuery } from '@tanstack/react-query';
import { fetchAllAcademiesAPI, fetchMyAcademiesAPI } from '../api/academyApi';
import type { Academy } from './types';

// [수정] 쿼리 키를 좀 더 명확하게 구분
export const ACADEMIES_QUERY_KEY = 'academies';

/**
 * [이름 변경] '모든' 학원 목록을 가져오는 React Query 훅. (주로 검색용)
 */
export const useAllAcademiesQuery = () => {
    return useQuery<Academy[], Error>({
        // [수정] 'all'을 추가하여 'my'와 구분
        queryKey: [ACADEMIES_QUERY_KEY, 'all'], 
        queryFn: fetchAllAcademiesAPI,
        staleTime: 1000 * 60 * 10, // 10분. 학원 목록은 자주 바뀌지 않음
    });
};

/**
 * [신규] '내(My)' 학원 목록을 가져오는 React Query 훅. (원장 대시보드용)
 */
export const useMyAcademiesQuery = () => {
    return useQuery<Academy[], Error>({
        // [수정] 'my'를 추가하여 'all'과 구분
        queryKey: [ACADEMIES_QUERY_KEY, 'my'], 
        queryFn: fetchMyAcademiesAPI,
        staleTime: 1000 * 60 * 5, // 5분. 내 학원 정보는 조금 더 자주 갱신될 수 있음
    });
};