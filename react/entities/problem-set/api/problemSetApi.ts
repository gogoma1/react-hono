import { handleApiResponse } from '../../../shared/api/api.utils';
import type { 
    MyProblemSet, 
    UpdateProblemSetPayload, 
    CreatedProblemSet, 
    AddProblemsToSetPayload, 
    CreateEntitlementPayload, 
    GroupedProblemSet, 
    CurriculumGrade,
    Folder // [신규] Folder 타입 import
} from '../model/types';

const PROBLEM_SET_API_BASE = '/api/manage/problem-sets';
const PROBLEM_API_BASE_URL = '/api/manage/problems';
const FOLDER_API_BASE = '/api/manage/folders'; // [신규] 폴더 API 경로

// --- Folder APIs ---

/**
 * [신규] 내 모든 폴더 목록을 조회합니다.
 */
export const fetchFoldersAPI = async (): Promise<Folder[]> => {
    const response = await fetch(FOLDER_API_BASE, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Folder[]>(response);
};

/**
 * [신규] 새 폴더를 생성합니다.
 */
export const createFolderAPI = async (name: string): Promise<Folder> => {
    const response = await fetch(FOLDER_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
    });
    return handleApiResponse<Folder>(response);
};

/**
 * [신규] 폴더 정보를 수정합니다.
 */
export const updateFolderAPI = async (folderId: string, name: string): Promise<Folder> => {
    const response = await fetch(`${FOLDER_API_BASE}/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
    });
    return handleApiResponse<Folder>(response);
};

/**
 * [신규] 폴더를 삭제합니다.
 */
export const deleteFolderAPI = async (folderId: string): Promise<{ message: string }> => {
    const response = await fetch(`${FOLDER_API_BASE}/${folderId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string }>(response);
};

// --- Problem Set APIs ---

export const createEntitlementAPI = async (payload: CreateEntitlementPayload): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ success: boolean; message: string }>(response);
};

export const fetchMyProblemSetsAPI = async (): Promise<MyProblemSet[]> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}/my`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<MyProblemSet[]>(response);
};

export const addProblemsToSetAPI = async (problemSetId: string, payload: AddProblemsToSetPayload): Promise<{ message: string }> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}/${problemSetId}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ message: string }>(response);
};

export const updateProblemSetAPI = async (problemSetId: string, payload: UpdateProblemSetPayload): Promise<CreatedProblemSet> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}/${problemSetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<CreatedProblemSet>(response);
};

export const deleteProblemSetAPI = async (problemSetId: string): Promise<void> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}/${problemSetId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (response.status === 204 || response.status === 200) { // 200 OK도 허용
        return;
    }
    const errorBody = await response.json().catch(() => ({ message: '문제집 삭제에 실패했습니다.' }));
    throw new Error(errorBody.message || '알 수 없는 오류');
};

export const deleteSubtitleFromSetAPI = async (problemSetId: string, subtitleId: string): Promise<{ message: string }> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}/${problemSetId}/subtitles/${subtitleId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string }>(response);
};

export const fetchGroupedProblemSetsAPI = async (): Promise<GroupedProblemSet[]> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}/my-grouped-view`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<GroupedProblemSet[]>(response);
};

export const fetchCurriculumViewAPI = async (): Promise<CurriculumGrade[]> => {
    const response = await fetch(`${PROBLEM_API_BASE_URL}/my-curriculum-view`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<CurriculumGrade[]>(response);
};