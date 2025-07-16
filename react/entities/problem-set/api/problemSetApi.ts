import { handleApiResponse } from '../../../shared/api/api.utils';
import type { 
    MyProblemSet, 
    UpdateProblemSetPayload, 
    CreatedProblemSet, 
    AddProblemsToSetPayload, 
    CreateEntitlementPayload, 
    GroupedProblemSet, 
    CurriculumGrade 
} from '../model/types';

const API_BASE_URL = '/api/manage/problem-sets';
const PROBLEM_API_BASE_URL = '/api/manage/problems'; // curriculum-view는 problems 라우트 사용

/**
 * [기존] PostgreSQL에 문제집에 대한 권한(Entitlement)을 생성합니다.
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

/**
 * [기존] 단순 문제집 목록을 가져옵니다. (사용 중단 예정)
 */
export const fetchMyProblemSetsAPI = async (): Promise<MyProblemSet[]> => {
    const response = await fetch(`${API_BASE_URL}/my`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<MyProblemSet[]>(response);
};

/**
 * [기존] 문제집에 문제를 추가합니다.
 */
export const addProblemsToSetAPI = async (problemSetId: string, payload: AddProblemsToSetPayload): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/${problemSetId}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ message: string }>(response);
};

/**
 * [기존] 문제집 정보를 업데이트합니다.
 */
export const updateProblemSetAPI = async (problemSetId: string, payload: UpdateProblemSetPayload): Promise<CreatedProblemSet> => {
    const response = await fetch(`${API_BASE_URL}/${problemSetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<CreatedProblemSet>(response);
};

/**
 * [기존] 문제집을 삭제합니다.
 */
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
        throw new Error(errorBody.message || '알 수 없는 오류');
    }
};

/**
 * [신규] 문제집 중심의 계층적 뷰 데이터를 가져옵니다.
 * (문제집 > 학년 > 소제목)
 */
export const fetchGroupedProblemSetsAPI = async (): Promise<GroupedProblemSet[]> => {
    const response = await fetch(`${API_BASE_URL}/my-grouped-view`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<GroupedProblemSet[]>(response);
};

/**
 * [신규] 교육과정 중심의 계층적 뷰 데이터를 가져옵니다.
 * (학년 > 대단원 > 중단원)
 */
export const fetchCurriculumViewAPI = async (): Promise<CurriculumGrade[]> => {
    const response = await fetch(`${PROBLEM_API_BASE_URL}/my-curriculum-view`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<CurriculumGrade[]>(response);
};