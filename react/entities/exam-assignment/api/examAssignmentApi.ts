// ./react/entities/exam-assignment/api/examAssignmentApi.ts

import { handleApiResponse } from '../../../shared/api/api.utils';
import type { DbExamSet, DbExamAssignment } from '../../../../api/db/schema.pg';

export interface ExamAssignmentWithSet extends Omit<DbExamAssignment, 'exam_set_id'> {
    examSet: Omit<DbExamSet, 'id' | 'created_at'> & { id: string; };
}

const API_BASE_URL = '/api/exam/mobile';

/**
 * [수정] 로그인한 학생에게 할당된 '모든' 시험지 정보 목록을 가져옵니다.
 * @returns 학생에게 할당된 시험지 정보 배열 (시험지 세트 정보 포함)
 */
export const fetchMyAssignmentsAPI = async (): Promise<ExamAssignmentWithSet[]> => {
    // [수정] 엔드포인트를 복수형으로 변경
    const res = await fetch(`${API_BASE_URL}/my-assignments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 인증을 위해 쿠키를 함께 보냅니다.
    });
    // [수정] 반환 타입을 배열로 명시
    return handleApiResponse<ExamAssignmentWithSet[]>(res);
};