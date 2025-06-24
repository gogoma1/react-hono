import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../model/types';

const API_BASE_FETCH = '/api/manage/problems';
const API_BASE_UPLOAD = '/api/manage/problems/upload'; 

interface UploadPayload {
    problems: Problem[];
}

interface UploadResponse {
    success: boolean;
    count: number;
}

/**
 * 모든 문제 목록을 가져옵니다.
 */
export const fetchProblemsAPI = async (): Promise<Problem[]> => {
    const res = await fetch(API_BASE_FETCH, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Problem[]>(res);
};

/**
 * [추가] 특정 문제를 업데이트하는 API 함수입니다.
 * 이 함수를 추가하고 export 해야 합니다.
 * @param id - 업데이트할 문제의 question_number
 * @param updatedFields - 업데이트할 필드들
 * @returns 업데이트된 문제 객체
 */
export const updateProblemAPI = async (id: string | number, updatedFields: Partial<Problem>): Promise<Problem> => {
    const res = await fetch(`${API_BASE_FETCH}/${id}`, {
        method: 'PUT', // 또는 'PATCH'
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedFields)
    });
    return handleApiResponse<Problem>(res);
};

/**
 * 문제 목록을 서버에 업로드합니다.
 * @param problems - 업로드할 문제 객체 배열
 * @returns 업로드 결과
 */
export const uploadProblemsAPI = async (problems: Problem[]): Promise<UploadResponse> => {
    const payload: UploadPayload = { problems };
    const res = await fetch(API_BASE_UPLOAD, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    return handleApiResponse<UploadResponse>(res);
};