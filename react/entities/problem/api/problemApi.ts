import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../model/types';
import type { DbProblemSet } from '../../../../api/db/schema.d1'; // DbProblemSet 타입 import

const API_BASE_URL = '/api/manage/problems';

// [수정] /upload API에 보낼 페이로드 타입. 더 상세한 타입은 페이지에서 직접 정의.
interface UploadPayload {
    problemSetName: string;
    problems: Problem[];
    [key: string]: any; // 다른 메타데이터 필드
}

// [수정] /upload API의 성공 응답 타입
export interface UploadResponse {
    success: boolean;
    message: string;
    problemSet: DbProblemSet;
}

/**
 * 모든 문제 목록을 가져옵니다.
 */
export const fetchProblemsAPI = async (): Promise<Problem[]> => {
    const res = await fetch(API_BASE_URL, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Problem[]>(res);
};

/**
 * 지정된 ID 배열에 해당하는 문제 목록을 가져옵니다.
 */
export const fetchProblemsByIdsAPI = async (problemIds: string[]): Promise<Problem[]> => {
    const res = await fetch(`${API_BASE_URL}/by-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problemIds }),
    });
    return handleApiResponse<Problem[]>(res);
};

/**
 * 특정 문제를 업데이트하는 API 함수입니다.
 */
export const updateProblemAPI = async (problemId: string, updatedFields: Partial<Problem>): Promise<Problem> => {
    const { problem_id, ...payload } = updatedFields;
    const res = await fetch(`${API_BASE_URL}/${problemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<Problem>(res);
};

/**
 * 여러 문제를 영구적으로 삭제하는 API 함수입니다.
 */
export const deleteProblemsAPI = async (problemIds: string[]): Promise<{ message: string; deleted_count: number }> => {
    const res = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problem_ids: problemIds })
    });
    return handleApiResponse<{ message: string; deleted_count: number }>(res);
};

/**
 * 문제 목록과 문제집 정보를 서버에 업로드합니다. (D1 작업)
 */
export const uploadProblemsAndCreateSetAPI = async (payload: UploadPayload): Promise<UploadResponse> => {
    const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<UploadResponse>(res);
};