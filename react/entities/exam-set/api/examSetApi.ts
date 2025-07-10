import { handleApiResponse } from '../../../shared/api/api.utils';

export interface PublishExamSetPayload {
    title: string;
    problem_ids: string[];
    student_ids: string[];
    header_info: Record<string, any> | null;
}

export interface PublishExamSetResponse {
    message: string;
    exam_set_id: string;
    assigned_count: number;
}

export interface MyPublishedExamSet {
    id: string;
    title: string;
    problem_ids: string[];
    created_at: string;
    assigned_student_count: number;
}

// [수정] 백엔드 라우트 통합에 따라 기본 URL을 '/api/exams'로 변경합니다.
const API_BASE_URL = '/api/exams';

/**
 * 시험지 세트를 생성하고 학생들에게 할당하는 API
 * @param payload - 시험지 출제에 필요한 데이터
 * @returns 성공 메시지 및 생성된 시험지 세트 정보
 */
export const publishExamSetAPI = async (payload: PublishExamSetPayload): Promise<PublishExamSetResponse> => {
    // [수정] 경로를 '/sets'에서 '/assign'으로 변경합니다.
    const res = await fetch(`${API_BASE_URL}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<PublishExamSetResponse>(res);
};

/**
 * 내가 출제한 모바일 시험지 목록을 가져오는 API
 * @returns 내가 출제한 시험지 요약 정보 배열
 */
export const fetchMyPublishedExamSetsAPI = async (): Promise<MyPublishedExamSet[]> => {
    // [수정] 경로가 기본 URL 아래로 통합되었으므로, /sets/my만 남깁니다.
    const res = await fetch(`${API_BASE_URL}/sets/my`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<MyPublishedExamSet[]>(res);
};