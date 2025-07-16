import { handleApiResponse } from '../../../shared/api/api.utils';
import type {
    UpdateProblemSetPayload,
    CreatedProblemSet,
    AddProblemsToSetPayload,
    CreateEntitlementPayload,
    CurriculumGrade,
    Folder,
    MyLibraryData,
    GroupedProblemSet,
    UpdatedSubtitle 
} from '../model/types';

const PROBLEM_SET_API_BASE = '/api/manage/problem-sets';
const PROBLEM_API_BASE_URL = '/api/manage/problems';
const FOLDER_API_BASE = '/api/manage/folders';


export const createFolderAPI = async (payload: { name: string; problemSetId: string; gradeId: string }): Promise<Folder> => {
    const { name, problemSetId, gradeId } = payload;
    const response = await fetch(FOLDER_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, problem_set_id: problemSetId, grade_id: gradeId }),
    });
    return handleApiResponse<Folder>(response);
};

export const updateFolderAPI = async (folderId: string, name: string): Promise<Folder> => {
    const response = await fetch(`${FOLDER_API_BASE}/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
    });
    return handleApiResponse<Folder>(response);
};

export const deleteFolderAPI = async (folderId: string): Promise<{ message: string }> => {
    const response = await fetch(`${FOLDER_API_BASE}/${folderId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string }>(response);
};

/**
 * [신규] 소제목을 특정 폴더로 이동시키는 API 함수
 */
export const moveSubtitleAPI = async (payload: { subtitleId: string; targetFolderId: string | null }): Promise<UpdatedSubtitle> => {
    const { subtitleId, targetFolderId } = payload;
    const response = await fetch(`${PROBLEM_SET_API_BASE}/subtitles/${subtitleId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetFolderId }),
    });
    return handleApiResponse<UpdatedSubtitle>(response);
};

export const createEntitlementAPI = async (payload: CreateEntitlementPayload): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${PROBLEM_SET_API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ success: boolean; message: string }>(response);
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
    if (response.status === 204 || response.status === 200) {
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

export const fetchMyGroupedProblemSetsAPI = async (): Promise<GroupedProblemSet[]> => {
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