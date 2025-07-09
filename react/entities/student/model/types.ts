/**
 * [신규] 담당 관리자(강사)의 요약 정보를 나타내는 타입입니다.
 * 학생 목록 조회 시 함께 반환되는 데이터 구조입니다.
 */
export interface ManagerInfo {
    id: string;
    details: {
        student_name?: string;
        [key: string]: any; // 그 외 다른 detail 필드
    } | null;
}

/**
 * [신규] academy_members 테이블의 details 필드 타입을 정의합니다.
 */
export interface MemberDetails {
    student_name?: string;
    student_phone?: string;
    guardian_phone?: string;
    grade?: string;
    school_name?: string;
    class_name?: string;
    subject?: string;
    tuition?: number;
}

/**
 * [수정] academy_members 테이블의 전체 구조를 나타내는 기본 타입입니다.
 * 백엔드에서 받아오는 managers 배열을 포함하도록 수정합니다.
 */
export interface AcademyMember {
    id: string;
    academy_id: string;
    profile_id: string | null;
    member_type: 'student' | 'teacher' | 'parent' | 'staff';
    status: 'active' | 'inactive' | 'resigned';
    start_date: string | null;
    end_date: string | null;
    details: MemberDetails | null;
    created_at: string;
    updated_at: string;
    managers?: ManagerInfo[]; 
}

/**
 * [수정] 새 구성원 생성 시 API에 보내는 데이터 타입입니다.
 * member_type을 필수로 포함하도록 수정합니다.
 */
export interface CreateMemberInput {
    academy_id: string;
    member_type: 'student' | 'teacher' | 'parent'; // [수정] member_type 추가
    details: MemberDetails;
    profile_id?: string | null;
}

/**
 * [수정] 구성원 정보 수정 시 API Body에 담길 데이터 타입입니다.
 * 담당자 ID 목록을 보낼 수 있도록 manager_member_ids를 추가합니다.
 */
export interface UpdateMemberInputBody {
    status?: 'active' | 'inactive' | 'resigned';
    details?: Partial<MemberDetails>;
    start_date?: string | null;
    end_date?: string | null;
    manager_member_ids?: string[];
}

/**
 * [신규] 구성원 정보 수정 함수에 전달될 최종 데이터 타입입니다.
 */
export interface UpdateMemberInput extends UpdateMemberInputBody {
    id: string;
}

// 기존 타입 별칭들은 유지합니다.
export type Student = AcademyMember & {
    student_name?: string;
    grade?: string;
    subject?: string;
    class_name?: string;
    teacher?: string;
    student_phone?: string;
    guardian_phone?: string;
    school_name?: string;
    tuition?: number;
    admission_date?: string | null;
    discharge_date?: string | null;
};
export type Enrollment = AcademyMember;
// [수정] CreateStudentInput의 정의가 변경되었으므로, 이 별칭도 함께 업데이트됩니다.
export type CreateStudentInput = CreateMemberInput;
export type CreateEnrollmentInput = CreateMemberInput;
export type UpdateStudentInput = UpdateMemberInput;
export type UpdateEnrollmentInput = UpdateMemberInput;
export type UpdateStudentInputBody = UpdateMemberInputBody;
export type UpdateEnrollmentInputBody = UpdateMemberInputBody;


export const GRADE_LEVELS = [
    '초1', '초2', '초3', '초4', '초5', '초6',
    '중1', '중2', '중3',
    '고1', '고2', '고3',
];

export interface MutationStatus<TData = unknown, TError = Error> {
    isPending: boolean;
    isError: boolean;
    error: TError | null;
    isSuccess: boolean;
    data?: TData | undefined;
}