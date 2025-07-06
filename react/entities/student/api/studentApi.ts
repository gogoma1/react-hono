import { handleApiResponse } from '../../../shared/api/api.utils';
// [수정] 타입 import 경로를 새로운 타입 정의 파일로 변경합니다. (다음 단계에서 생성)
import type { Enrollment, CreateEnrollmentInput, UpdateEnrollmentInput } from '../model/types';

// [수정] API 기본 경로를 enrollments로 변경하는 것을 고려해볼 수 있으나, 일단은 student로 유지합니다.
// 백엔드 라우트 경로가 '/api/manage/student' 이므로 이 부분은 그대로 둡니다.
const API_BASE = '/api/manage/student';

/**
 * [수정] 특정 학원의 모든 재원생 목록을 가져옵니다.
 * @param academyId - 조회할 학원의 ID
 * @returns 해당 학원의 재원생 목록 배열
 */
export const fetchEnrollmentsAPI = async (academyId: string): Promise<Enrollment[]> => {
    // [수정] URL에 academyId를 포함시킵니다.
    const res = await fetch(`${API_BASE}/${academyId}`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Enrollment[]>(res);
};

/**
 * [수정] 특정 학원에 새로운 재원생을 추가합니다.
 * @param newEnrollmentData - 생성할 재원생의 정보 (academyId 포함)
 * @returns 생성된 재원생 객체
 */
export const addEnrollmentAPI = async (newEnrollmentData: CreateEnrollmentInput): Promise<Enrollment> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEnrollmentData),
    });
    return handleApiResponse<Enrollment>(res);
};

/**
 * [수정] 특정 재원생의 정보를 업데이트합니다.
 * @param updateData - 업데이트할 재원생의 id와 정보
 * @returns 업데이트된 재원생 객체
 */
export const updateEnrollmentAPI = async (updateData: UpdateEnrollmentInput): Promise<Enrollment> => {
    // [수정] id를 enrollmentId로 명확히 하거나, 그냥 id를 사용해도 됩니다.
    const { id, ...jsonData } = updateData;
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jsonData),
    });
    return handleApiResponse<Enrollment>(res);
};

/**
 * [수정] 특정 재원생을 퇴원 처리(Soft Delete)합니다.
 * @param enrollmentId - 퇴원 처리할 재원생의 id
 * @returns 성공 메시지와 처리된 재원생의 id
 */
export const deleteEnrollmentAPI = async (enrollmentId: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${enrollmentId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};


/**
 * [신규] 여러 재원생의 상태를 일괄 변경하는 API
 * @param payload - academyId, enrollmentIds, status 포함
 * @returns 업데이트된 재원생 목록
 */
export const bulkUpdateStatusAPI = async (payload: { academyId: string, enrollmentIds: string[], status: Enrollment['status'] }): Promise<Enrollment[]> => {
    const res = await fetch(`${API_BASE}/bulk-update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<Enrollment[]>(res);
};

/**
 * [신규] 여러 재원생을 일괄 퇴원 처리하는 API
 * @param payload - academyId, enrollmentIds 포함
 * @returns 처리된 재원생 ID 목록
 */
export const bulkDeleteAPI = async (payload: { academyId: string, enrollmentIds: string[] }): Promise<{ message: string, deletedIds: string[] }> => {
    const res = await fetch(`${API_BASE}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<{ message: string, deletedIds: string[] }>(res);
};