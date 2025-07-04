import { handleApiResponse } from '../../../shared/api/api.utils';
import type { DbExamSet, DbExamAssignment } from '../../../../api/db/schema.pg';

// 백엔드에서 `with: { examSet: true }` 옵션으로 examSet을 포함하여 보내주므로,
// 프론트엔드에서 사용할 때 이 구조에 맞는 타입을 정의합니다.
export interface ExamAssignmentWithSet extends DbExamAssignment {
    examSet: DbExamSet;
}

const API_BASE_URL = '/api/exam/mobile';

/**
 * 로그인한 학생에게 할당된 최신 시험지 정보를 가져옵니다.
 * @returns 학생에게 할당된 시험지 정보 (시험지 세트 정보 포함)
 */
export const fetchMyAssignmentAPI = async (): Promise<ExamAssignmentWithSet> => {
    const res = await fetch(`${API_BASE_URL}/my-assignment`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 인증을 위해 쿠키를 함께 보냅니다.
    });
    return handleApiResponse<ExamAssignmentWithSet>(res);
};