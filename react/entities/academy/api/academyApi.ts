import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Academy } from '../model/types';

// [수정] API 경로를 역할에 따라 분리하여 명확하게 관리합니다.
const PROFILES_API_BASE = '/api/profiles'; // 모든 학원 목록을 가져오는 경로
const ACADEMIES_API_BASE = '/api/academies'; // 내 학원 정보를 관리하는 경로

/**
 * [이름 변경 및 유지]
 * '모든' 등록된 학원의 이름과 지역 목록을 조회합니다.
 * 주로 학생이나 강사가 학원을 검색할 때 사용됩니다.
 * @returns 모든 학원 목록 배열
 */
export const fetchAllAcademiesAPI = async (): Promise<Academy[]> => {
    // 기존 URL을 그대로 사용합니다.
    const response = await fetch(`${PROFILES_API_BASE}/academies`);
    return handleApiResponse<Academy[]>(response);
};

/**
 * [신규 추가]
 * 로그인한 원장이 '소유한(My)' 학원 목록만 조회합니다.
 * 원장 대시보드에서 관리할 학원을 선택할 때 사용됩니다.
 * @returns 내 학원 목록 배열
 */
export const fetchMyAcademiesAPI = async (): Promise<Academy[]> => {
    // 백엔드에 새로 추가될 '/api/academies/my' 엔드포인트를 호출합니다.
    const response = await fetch(`${ACADEMIES_API_BASE}/my`, {
        credentials: 'include' // 인증된 사용자만 호출할 수 있도록 쿠키를 포함합니다.
    });
    return handleApiResponse<Academy[]>(response);
};