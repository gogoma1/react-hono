import { handleApiResponse } from '../../../shared/api/api.utils';

// [수정됨] camelCase -> snake_case
export interface PublishExamSetPayload {
    title: string;
    problem_ids: string[];
    student_ids: string[];
    header_info: Record<string, any> | null;
}

// [수정됨] camelCase -> snake_case
export interface PublishExamSetResponse {
    message: string;
    exam_set_id: string;
    assigned_count: number;
}

const API_BASE_URL = '/api/exam/mobile';

/**
 * 시험지 세트를 생성하고 학생들에게 할당하는 API
 * @param payload - 시험지 출제에 필요한 데이터
 * @returns 성공 메시지 및 생성된 시험지 세트 정보
 */
export const publishExamSetAPI = async (payload: PublishExamSetPayload): Promise<PublishExamSetResponse> => {
    // [수정됨] 백엔드로 보낼 payload의 키가 snake_case이므로,
    // JSON.stringify가 자동으로 snake_case 키를 가진 JSON 문자열을 생성합니다.
    const res = await fetch(`${API_BASE_URL}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    return handleApiResponse<PublishExamSetResponse>(res);
};