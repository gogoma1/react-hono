import { useQuery } from '@tanstack/react-query';
import { 
    fetchMyProblemSetsAPI, 
    fetchGroupedProblemSetsAPI, 
    fetchCurriculumViewAPI 
} from '../api/problemSetApi';
import type { 
    MyProblemSet, 
    GroupedProblemSet, 
    CurriculumGrade 
} from './types';

// --- 쿼리 키 정의 ---
export const MY_PROBLEM_SETS_QUERY_KEY = 'myProblemSets';
export const GROUPED_PROBLEM_SETS_QUERY_KEY = 'groupedProblemSets';
export const CURRICULUM_VIEW_QUERY_KEY = 'curriculumView';

/**
 * [기존] 내가 접근 가능한 모든 문제집 목록을 가져오는 훅. (단순 목록용, 사용 중단 예정)
 * @deprecated useGroupedProblemSetsQuery 또는 useCurriculumViewQuery를 대신 사용하세요.
 */
export function useMyProblemSetsQuery() {
    return useQuery<MyProblemSet[], Error>({
        queryKey: [MY_PROBLEM_SETS_QUERY_KEY],
        queryFn: fetchMyProblemSetsAPI,
        staleTime: 1000 * 60 * 5, // 이 훅은 사용 중단 예정이므로 일단 그대로 둡니다.
    });
}

/**
 * [신규] 문제집 중심의 계층적 뷰 데이터를 위한 훅.
 * staleTime을 Infinity로 설정하여, 명시적 무효화 전까지는 refetch하지 않습니다.
 */
export function useGroupedProblemSetsQuery() {
    return useQuery<GroupedProblemSet[], Error>({
        queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY],
        queryFn: fetchGroupedProblemSetsAPI,
        staleTime: Infinity,
    });
}

/**
 * [신규] 교육과정 중심의 계층적 뷰 데이터를 위한 훅.
 * staleTime을 Infinity로 설정하여, 명시적 무효화 전까지는 refetch하지 않습니다.
 */
export function useCurriculumViewQuery() {
    return useQuery<CurriculumGrade[], Error>({
        queryKey: [CURRICULUM_VIEW_QUERY_KEY],
        queryFn: fetchCurriculumViewAPI,
        staleTime: Infinity,
    });
}