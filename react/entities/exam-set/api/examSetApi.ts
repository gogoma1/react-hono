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

// [신규] 내가 출제한 시험지 목록 API의 응답 타입
export interface MyPublishedExamSet {
    id: string;
    title: string;
    problem_ids: string[];
    created_at: string;
    assigned_student_count: number;
}

const API_BASE_URL = '/api/exam/mobile';

/**
 * 시험지 세트를 생성하고 학생들에게 할당하는 API
 * @param payload - 시험지 출제에 필요한 데이터
 * @returns 성공 메시지 및 생성된 시험지 세트 정보
 */
export const publishExamSetAPI = async (payload: PublishExamSetPayload): Promise<PublishExamSetResponse> => {
    const res = await fetch(`${API_BASE_URL}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<PublishExamSetResponse>(res);
};

/**
 * [신규] 내가 출제한 모바일 시험지 목록을 가져오는 API
 * @returns 내가 출제한 시험지 요약 정보 배열
 */
export const fetchMyPublishedExamSetsAPI = async (): Promise<MyPublishedExamSet[]> => {
    const res = await fetch(`${API_BASE_URL}/sets/my`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<MyPublishedExamSet[]>(res);
};