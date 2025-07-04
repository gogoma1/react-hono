// ----- ./react/entities/exam-set/api/examSetApi.ts -----
import { handleApiResponse } from '../../../shared/api/api.utils';

export interface PublishExamSetPayload {
    title: string;
    problemIds: string[];
    studentIds: string[];
    headerInfo: Record<string, any> | null;
}

export interface PublishExamSetResponse {
    message: string;
    examSetId: string;
    assignedCount: number;
}

// [핵심] API 경로를 수정한 백엔드에 맞춤
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