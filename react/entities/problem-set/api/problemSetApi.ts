import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Problem } from '../../problem/model/types'; 
import type { MyProblemSet, UpdateProblemSetPayload, CreatedProblemSet, AddProblemsToSetPayload } from '../model/types';

const API_BASE_URL = '/api/manage/problem-sets';

export interface CreateEntitlementPayload {
    problem_set_id: string;
}

/**
 * PostgreSQL에 문제집에 대한 권한(Entitlement)을 생성합니다.
 */
export const createEntitlementAPI = async (payload: CreateEntitlementPayload): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ success: boolean; message: string }>(response);
};

export const fetchMyProblemSetsAPI = async (): Promise<MyProblemSet[]> => {
    const response = await fetch(`${API_BASE_URL}/my`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<MyProblemSet[]>(response);
};

export const addProblemsToSetAPI = async (problemSetId: string, payload: AddProblemsToSetPayload): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/${problemSetId}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ message: string }>(response);
};

export const updateProblemSetAPI = async (problemSetId: string, payload: UpdateProblemSetPayload): Promise<CreatedProblemSet> => {
    const response = await fetch(`${API_BASE_URL}/${problemSetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<CreatedProblemSet>(response);
};

export const deleteProblemSetAPI = async (problemSetId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${problemSetId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (response.status === 204) {
        return;
    }
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: '문제집 삭제에 실패했습니다.' }));
        throw new Error(errorBody.message);
    }
};