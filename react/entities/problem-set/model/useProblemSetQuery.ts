import { useQuery } from '@tanstack/react-query';
import { 
    fetchMyProblemSetsAPI, 
    fetchGroupedProblemSetsAPI, 
    fetchCurriculumViewAPI,
    fetchFoldersAPI // [신규] import
} from '../api/problemSetApi';
import type { 
    MyProblemSet, 
    GroupedProblemSet, 
    CurriculumGrade,
    Folder // [신규] import
} from './types';

export const MY_PROBLEM_SETS_QUERY_KEY = 'myProblemSets';
export const GROUPED_PROBLEM_SETS_QUERY_KEY = 'groupedProblemSets';
export const CURRICULUM_VIEW_QUERY_KEY = 'curriculumView';
export const FOLDERS_QUERY_KEY = 'folders'; // [신규] 쿼리 키

/**
 * [신규] 내 모든 폴더 목록을 가져오는 훅
 */
export function useFoldersQuery() {
    return useQuery<Folder[], Error>({
        queryKey: [FOLDERS_QUERY_KEY],
        queryFn: fetchFoldersAPI,
        staleTime: 1000 * 60 * 5, // 5분
    });
}

export function useMyProblemSetsQuery() {
    return useQuery<MyProblemSet[], Error>({
        queryKey: [MY_PROBLEM_SETS_QUERY_KEY],
        queryFn: fetchMyProblemSetsAPI,
        staleTime: 1000 * 60 * 5,
    });
}

export function useGroupedProblemSetsQuery() {
    return useQuery<GroupedProblemSet[], Error>({
        queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY],
        queryFn: fetchGroupedProblemSetsAPI,
        staleTime: Infinity,
    });
}

export function useCurriculumViewQuery() {
    return useQuery<CurriculumGrade[], Error>({
        queryKey: [CURRICULUM_VIEW_QUERY_KEY],
        queryFn: fetchCurriculumViewAPI,
        staleTime: Infinity,
    });
}