import { handleApiResponse } from '../../../shared/api/api.utils';
import type { DbExamSet, DbExamAssignment } from '../../../../api/db/schema.pg';
import type { HeaderInfoState } from '../../../features/problem-publishing/hooks/useExamHeaderState';

export interface ExamAssignmentWithSet extends Omit<DbExamAssignment, 'exam_set_id'> {
    examSet: Omit<DbExamSet, 'id' | 'created_at' | 'header_info'> & { 
        id: string; 
        header_info: HeaderInfoState | null;
    };
}

// [수정] 백엔드 라우트 통합에 따라 기본 URL을 '/api/exams'로 변경합니다.
const API_BASE_URL = '/api/exams';

/**
 * 로그인한 학생에게 할당된 '모든' 시험지 정보 목록을 가져옵니다.
 * @returns 학생에게 할당된 시험지 정보 배열 (시험지 세트 정보 포함)
 */
export const fetchMyAssignmentsAPI = async (): Promise<ExamAssignmentWithSet[]> => {
    // [수정] 경로가 기본 URL 아래로 통합되었으므로, /my-assignments만 남깁니다.
    const res = await fetch(`${API_BASE_URL}/my-assignments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse<ExamAssignmentWithSet[]>(res);
};