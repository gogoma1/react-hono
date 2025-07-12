// ./react/entities/problem-set/api/problemSetApi.ts

import { handleApiResponse } from '../../../shared/api/api.utils';
import type { MyProblemSet } from '../model/types';

const API_BASE_URL = '/api/manage/problem-sets';

/**
 * 내가 접근 가능한 모든 문제집 목록을 가져옵니다.
 * @returns 내 문제집 정보 배열
 */
export const fetchMyProblemSetsAPI = async (): Promise<MyProblemSet[]> => {
    const response = await fetch(`${API_BASE_URL}/my`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<MyProblemSet[]>(response);
};

// 추후 문제집 생성, 수정, 삭제 API 함수들이 여기에 추가될 것입니다.