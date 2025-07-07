import { handleApiResponse } from '../../../shared/api/api.utils';
// [수정] 새로운 타입 임포트
import type { AcademyMember, CreateMemberInput, UpdateMemberInput } from '../model/types';

const API_BASE = '/api/manage/student'; // API 기본 경로는 그대로 유지

/**
 * [수정] 특정 학원의 모든 구성원 목록을 가져옵니다.
 * @param academyId - 조회할 학원의 ID
 * @returns 해당 학원의 구성원 목록 배열
 */
export const fetchMembersAPI = async (academyId: string): Promise<AcademyMember[]> => {
    const res = await fetch(`${API_BASE}/${academyId}`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<AcademyMember[]>(res);
};

/**
 * [수정] 특정 학원에 새로운 구성원을 추가합니다.
 * @param newMemberData - 생성할 구성원의 정보
 * @returns 생성된 구성원 객체
 */
export const addMemberAPI = async (newMemberData: CreateMemberInput): Promise<AcademyMember> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMemberData),
    });
    return handleApiResponse<AcademyMember>(res);
};

/**
 * [수정] 특정 구성원의 정보를 업데이트합니다.
 * @param updateData - 업데이트할 구성원의 id와 정보
 * @returns 업데이트된 구성원 객체
 */
export const updateMemberAPI = async (updateData: UpdateMemberInput): Promise<AcademyMember> => {
    const { id, ...jsonData } = updateData;
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jsonData),
    });
    return handleApiResponse<AcademyMember>(res);
};

/**
 * [수정] 특정 구성원을 'resigned' 상태로 변경합니다 (Soft Delete).
 * @param memberId - 상태 변경할 구성원의 id
 * @returns 성공 메시지와 처리된 구성원의 id
 */
export const resignMemberAPI = async (memberId: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};


/**
 * [수정] 여러 구성원의 상태를 일괄 변경하는 API
 * @param payload - academyId, memberIds, status 포함
 * @returns 업데이트된 구성원 목록
 */
export const bulkUpdateStatusAPI = async (payload: { academyId: string, memberIds: string[], status: AcademyMember['status'] }): Promise<AcademyMember[]> => {
    const res = await fetch(`${API_BASE}/bulk-update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<AcademyMember[]>(res);
};

/**
 * [수정] 여러 구성원을 일괄 'resigned' 처리하는 API
 * @param payload - academyId, memberIds 포함
 * @returns 처리된 구성원 ID 목록
 */
export const bulkResignAPI = async (payload: { academyId: string, memberIds:string[] }): Promise<{ message: string, changedIds: string[] }> => {
    const res = await fetch(`${API_BASE}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ message: string, changedIds: string[] }>(res);
};

// --- 기존 함수 이름과의 호환성을 위한 별칭(alias) export ---
export const fetchEnrollmentsAPI = fetchMembersAPI;
export const addEnrollmentAPI = addMemberAPI;
export const updateEnrollmentAPI = updateMemberAPI;
export const deleteEnrollmentAPI = resignMemberAPI;
export const bulkDeleteAPI = bulkResignAPI;