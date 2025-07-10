import { handleApiResponse } from '../../../shared/api/api.utils';
import type { DbExamSet, DbExamAssignment } from '../../../../api/db/schema.pg';
import type { HeaderInfoState } from '../../../features/problem-publishing/hooks/useExamHeaderState';

/**
 * [수정] 백엔드에서 받아오는 시험 과제(assignment) 데이터의 타입을 명확하게 정의합니다.
 *
 * 이 타입은 다음과 같은 구조를 가집니다:
 * - DbExamAssignment의 모든 속성을 포함합니다 (단, exam_set_id는 아래 examSet 객체로 대체되므로 제외).
 * - examSet: 연결된 시험지 세트 정보입니다.
 *   - DbExamSet의 속성을 포함하지만, 일부 필드는 제외/수정됩니다.
 *   - header_info: any 대신 구체적인 HeaderInfoState 타입으로 정의하여 타입 안정성을 높입니다.
 */
export interface ExamAssignmentWithSet extends Omit<DbExamAssignment, 'exam_set_id'> {
    examSet: Omit<DbExamSet, 'id' | 'created_at' | 'header_info'> & { 
        id: string; 
        header_info: HeaderInfoState | null; // header_info 타입을 구체적으로 지정
    };
}

const API_BASE_URL = '/api/exam/mobile';

/**
 * [수정] 로그인한 학생에게 할당된 '모든' 시험지 정보 목록을 가져옵니다.
 * @returns 학생에게 할당된 시험지 정보 배열 (시험지 세트 정보 포함)
 */
export const fetchMyAssignmentsAPI = async (): Promise<ExamAssignmentWithSet[]> => {
    const res = await fetch(`${API_BASE_URL}/my-assignments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 인증을 위해 쿠키를 함께 보냅니다.
    });
    // handleApiResponse 유틸리티를 사용하여 응답을 처리하고, 
    // 타입 파라미터로 ExamAssignmentWithSet[]을 지정하여 반환 값의 타입을 보장합니다.
    return handleApiResponse<ExamAssignmentWithSet[]>(res);
};