// react/entities/problem/api/problemApi.ts

import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../model/types';

const API_BASE = '/api/manage/problems/upload'; 

interface UploadPayload {
    problems: Problem[];
}

interface UploadResponse {
    success: boolean;
    count: number;
    // ... 기타 서버 응답 필드
}

/**
 * 문제 목록을 서버에 업로드합니다.
 * @param problems - 업로드할 문제 객체 배열
 * @returns 업로드 결과
 */
export const uploadProblemsAPI = async (problems: Problem[]): Promise<UploadResponse> => {
    const payload: UploadPayload = { problems };
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<UploadResponse>(res);
};