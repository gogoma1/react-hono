// ./react/entities/problem-set/model/useProblemSetQuery.ts

import { useQuery } from '@tanstack/react-query';
import {
    fetchMyGroupedProblemSetsAPI,
    fetchCurriculumViewAPI,
} from '../api/problemSetApi';
import type {
    MyProblemSet,
    CurriculumGrade,
    GroupedProblemSet,
} from './types';

export const MY_PROBLEM_SETS_QUERY_KEY = 'myProblemSets';
export const GROUPED_PROBLEM_SETS_QUERY_KEY = 'groupedProblemSets';
export const CURRICULUM_VIEW_QUERY_KEY = 'curriculumView';


/**
 * '내 서재'에 필요한 계층적인 문제집 데이터를 가져오는 메인 훅.
 */
export function useGroupedProblemSetsQuery() {
    return useQuery<GroupedProblemSet[], Error>({
        queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY],
        queryFn: fetchMyGroupedProblemSetsAPI,
        staleTime: 1000 * 60 * 5, // 5분
    });
}

/**
 * GroupedProblemSet[] 데이터를 MyProblemSet[] 형태로 변환하여 제공하는 훅.
 * API를 직접 호출하지 않고, useGroupedProblemSetsQuery의 캐시된 데이터를 재사용(select)합니다.
 * 다른 곳에서 MyProblemSet[] 타입이 필요할 경우를 대비해 유지합니다.
 */
export function useMyProblemSetsQuery() {
    return useQuery<GroupedProblemSet[], Error, MyProblemSet[]>({
        queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY], // 원본 데이터는 동일한 키를 사용
        queryFn: fetchMyGroupedProblemSetsAPI,
        staleTime: 1000 * 60 * 5,
        select: (data) => {
            if (!data) return [];
            return data.map(ps => {
                const allSubtitles = ps.grades.flatMap(g => [
                    ...g.subtitles,
                    ...g.folders.flatMap(f => f.subtitles)
                ]);

                return {
                    problem_set_id: ps.problem_set_id,
                    name: ps.problem_set_name,
                    folder_id: null, // 최상위 폴더 개념이 없으므로 null
                    subtitles: allSubtitles.map(s => ({
                        subtitle_id: s.subtitle_id,
                        name: s.subtitle_name,
                        count: s.problem_count
                    })),
                    problem_count: allSubtitles.reduce((sum, s) => sum + s.problem_count, 0),
                    // 아래는 MyProblemSet 타입에 필요한 필드들의 기본값
                    creator_id: '',
                    type: 'PRIVATE_USER',
                    status: 'private',
                    copyright_type: 'ORIGINAL_CREATION',
                    copyright_source: null,
                    description: null,
                    cover_image: null,
                    published_year: null,
                    grade_id: null,
                    grade: null,
                    semester: null,
                    avg_difficulty: null,
                    created_at: '',
                    updated_at: '',
                    marketplace_status: 'not_listed',
                };
            });
        },
    });
}


export function useCurriculumViewQuery() {
    return useQuery<CurriculumGrade[], Error>({
        queryKey: [CURRICULUM_VIEW_QUERY_KEY],
        queryFn: fetchCurriculumViewAPI,
        staleTime: Infinity,
    });
}