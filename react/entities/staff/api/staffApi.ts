import { handleApiResponse } from '../../../shared/api/api.utils';
import type { StaffMember, CreateStaffInput, UpdateStaffInput } from '../model/types';

const API_BASE = '/api/manage/teacher'; // 백엔드 라우트는 teacher를 사용

/**
 * 특정 학원의 모든 강사 및 직원 목록을 가져옵니다.
 * @param academyId - 조회할 학원의 ID
 * @returns 해당 학원의 강사/직원 목록 배열
 */
export const fetchStaffAPI = async (academyId: string): Promise<StaffMember[]> => {
    const res = await fetch(`${API_BASE}/${academyId}`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<StaffMember[]>(res);
};

/**
 * 특정 학원에 새로운 강사 또는 직원을 추가합니다.
 * @param newStaffData - 생성할 구성원의 정보 (member_type 포함)
 * @returns 생성된 구성원 객체
 */
export const addStaffAPI = async (newStaffData: CreateStaffInput): Promise<StaffMember> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStaffData),
    });
    return handleApiResponse<StaffMember>(res);
};

/**
 * 특정 강사/직원의 정보를 업데이트합니다.
 * @param updateData - 업데이트할 구성원의 id와 정보
 * @returns 업데이트된 구성원 객체
 */
export const updateStaffAPI = async (updateData: UpdateStaffInput): Promise<StaffMember> => {
    const { id, ...jsonData } = updateData;
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jsonData),
    });
    return handleApiResponse<StaffMember>(res);
};

/**
 * 특정 강사/직원을 'resigned' 상태로 변경합니다 (Soft Delete).
 * @param memberId - 상태 변경할 구성원의 id
 * @returns 성공 메시지와 처리된 구성원의 id
 */
export const resignStaffAPI = async (memberId: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};