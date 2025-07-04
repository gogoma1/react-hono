import { handleApiResponse } from '../../../shared/api/api.utils';
import type { Academy } from '../model/types';

const API_BASE_URL = '/api/profiles';

/**
 * 등록된 모든 학원의 이름과 지역 목록을 조회합니다.
 * @returns 학원 목록 배열
 */
export const fetchAcademiesAPI = async (): Promise<Academy[]> => {
    const response = await fetch(`${API_BASE_URL}/academies`);
    return handleApiResponse<Academy[]>(response);
};