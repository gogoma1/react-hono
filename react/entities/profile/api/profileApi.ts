import { handleApiResponse } from '../../../shared/api/api.utils';
// [신규] AddRolePayload 타입을 import 합니다.
import type { MyProfile, UpdateProfilePayload, DbProfile, AddRolePayload } from '../model/types';

const API_BASE_URL = '/api/profiles';

/**
 * 현재 로그인한 사용자의 상세 프로필 정보를 조회합니다.
 */
export const fetchMyProfileAPI = async (): Promise<MyProfile> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        credentials: 'include'
    });
    return handleApiResponse<MyProfile>(response);
};

/**
 * [신규] 현재 로그인한 사용자에게 새로운 역할을 추가합니다.
 */
export const addRoleAPI = async (payload: AddRolePayload): Promise<DbProfile> => {
    const response = await fetch(`${API_BASE_URL}/me/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<DbProfile>(response);
};

/**
 * 사용자 프로필 정보(이름, 전화번호)를 업데이트합니다.
 */
export const updateMyProfileAPI = async (payload: UpdateProfilePayload): Promise<DbProfile> => { // DbProfile은 schema.pg.ts에서 가져온 타입
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<DbProfile>(response);
};

/**
 * 사용자 계정을 비활성화합니다.
 */
export const deactivateAccountAPI = async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/me/deactivate`, {
        method: 'PATCH',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string }>(response);
};