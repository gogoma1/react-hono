import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../model/types';
import type { DbProblemSet } from '../../../../api/db/schema.d1';

const API_BASE_URL = '/api/manage/problems';

/**
 * [수정] 문제 업로드 페이로드에 folder_id 추가
 */
interface UploadPayload {
    problemSetName: string;
    problems: Problem[];
    folder_id?: string | null; // [신규]
    [key: string]: any; // 다른 메타데이터 필드
}

export interface UploadResponse {
    success: boolean;
    message: string;
    problemSet: DbProblemSet;
}

export const fetchProblemsAPI = async (): Promise<Problem[]> => {
    const res = await fetch(API_BASE_URL, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Problem[]>(res);
};

export const fetchProblemsByIdsAPI = async (problemIds: string[]): Promise<Problem[]> => {
    const res = await fetch(`${API_BASE_URL}/by-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problemIds }),
    });
    return handleApiResponse<Problem[]>(res);
};

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

export const deleteProblemsAPI = async (problemIds: string[]): Promise<{ message: string; deleted_count: number }> => {
    const res = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problem_ids: problemIds })
    });
    return handleApiResponse<{ message: string; deleted_count: number }>(res);
};

export const uploadProblemsAndCreateSetAPI = async (payload: UploadPayload): Promise<UploadResponse> => {
    const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<UploadResponse>(res);
};