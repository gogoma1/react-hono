import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../model/types';

const API_BASE_URL = '/api/manage/problems';

interface UploadPayload {
    problems: Problem[];
}

export interface UploadResponse {
    success: boolean;
    created: number;
    updated: number;
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
 * [신규] 지정된 ID 배열에 해당하는 문제 목록을 가져옵니다.
 * @param problemIds - 조회할 문제 ID의 배열
 * @returns 문제 객체의 배열
 */
export const fetchProblemsByIdsAPI = async (problemIds: string[]): Promise<Problem[]> => {
    // 백엔드에서 POST /by-ids 엔드포인트를 만들었으므로, POST로 요청합니다.
    const res = await fetch(`${API_BASE_URL}/by-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problemIds }), // 요청 본문에 ID 배열을 담아 보냅니다.
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
 * 문제 목록을 서버에 업로드합니다. (Create & Update)
 */
export const uploadProblemsAPI = async (problems: Problem[]): Promise<UploadResponse> => {
    const payload: UploadPayload = { problems };
    const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<UploadResponse>(res);
};