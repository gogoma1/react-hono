import { handleApiResponse } from '../../../shared/api/api.utils';
import type { AcademyMember, CreateMemberInput, UpdateMemberInput } from '../model/types';

const API_BASE = '/api/manage/student';

/**
 * 특정 학원의 모든 학생 목록을 가져옵니다.
 * 백엔드에서 이제 'managers' 필드를 포함한 데이터를 반환합니다.
 * @param academyId - 조회할 학원의 ID
 * @returns 해당 학원의 학생 목록 배열
 */
export const fetchMembersAPI = async (academyId: string): Promise<AcademyMember[]> => {
    const res = await fetch(`${API_BASE}/${academyId}`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<AcademyMember[]>(res);
};

/**
 * 특정 학원에 새로운 학생을 추가합니다.
 * @param newMemberData - 생성할 학생의 정보 (member_type 포함)
 * @returns 생성된 학생 객체
 */
export const addMemberAPI = async (newMemberData: CreateMemberInput): Promise<AcademyMember> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // newMemberData에 member_type이 포함되어 있으므로 그대로 전송합니다.
        body: JSON.stringify(newMemberData),
    });
    return handleApiResponse<AcademyMember>(res);
};

/**
 * 특정 학생의 정보를 업데이트합니다.
 * 이제 body에 manager_member_ids 필드를 포함하여 전송할 수 있습니다.
 * @param updateData - 업데이트할 학생의 id와 정보
 * @returns 업데이트된 학생 객체
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
 * 특정 학생을 'resigned' 상태로 변경합니다 (Soft Delete).
 * @param memberId - 상태 변경할 학생의 id
 * @returns 성공 메시지와 처리된 학생의 id
 */
export const resignMemberAPI = async (memberId: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};


/**
 * 여러 학생의 상태를 일괄 변경하는 API
 * @param payload - academyId, memberIds, status 포함
 * @returns 업데이트된 학생 목록
 */
export const bulkUpdateStatusAPI = async (payload: { academyId: string, memberIds: string[], status: AcademyMember['status'] }): Promise<AcademyMember[]> => {
    const res = await fetch(`${API_BASE}/bulk-update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // [수정] 백엔드에서 학생만 필터링할 수 있도록 member_type을 명시적으로 추가합니다.
        body: JSON.stringify({ ...payload, member_type: 'student' }),
    });
    return handleApiResponse<AcademyMember[]>(res);
};

/**
 * 여러 학생을 일괄 'resigned' 처리하는 API
 * @param payload - academyId, memberIds 포함
 * @returns 처리된 학생 ID 목록
 */
export const bulkResignAPI = async (payload: { academyId: string, memberIds:string[] }): Promise<{ message: string, changedIds: string[] }> => {
    const res = await fetch(`${API_BASE}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // [수정] 백엔드에서 학생만 필터링할 수 있도록 member_type을 명시적으로 추가합니다.
        body: JSON.stringify({ ...payload, member_type: 'student' }),
    });
    return handleApiResponse<{ message: string, changedIds: string[] }>(res);
};

// 별칭(Alias)들은 기존 코드를 사용하는 다른 부분과의 호환성을 위해 유지합니다.
export const fetchEnrollmentsAPI = fetchMembersAPI;
export const addEnrollmentAPI = addMemberAPI;
export const updateEnrollmentAPI = updateMemberAPI;
export const deleteEnrollmentAPI = resignMemberAPI;
export const bulkDeleteAPI = bulkResignAPI;