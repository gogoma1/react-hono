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
    teacher?: string;
    tuition?: number;
}

/**
 * [신규] academy_members 테이블의 전체 구조를 나타내는 기본 타입입니다.
 * 백엔드의 DbAcademyMember 타입과 일치합니다.
 */
export interface AcademyMember {
    id: string;
    academy_id: string;
    profile_id: string | null;
    member_type: 'student' | 'teacher' | 'parent';
    status: 'active' | 'inactive' | 'resigned';
    start_date: string | null;
    end_date: string | null;
    details: MemberDetails | null;
    created_at: string;
    updated_at: string;
}

/**
 * [신규] 새 구성원 생성 시 API에 보내는 데이터 타입입니다.
 */
export interface CreateMemberInput {
    academy_id: string;
    member_type: 'student' | 'teacher' | 'parent';
    details: MemberDetails;
    profile_id?: string | null;
}

/**
 * [신규] 구성원 정보 수정 시 API Body에 담길 데이터 타입입니다.
 */
export interface UpdateMemberInputBody {
    status?: 'active' | 'inactive' | 'resigned';
    details?: Partial<MemberDetails>;
    start_date?: string | null;
    end_date?: string | null;
}

/**
 * [신규] 구성원 정보 수정 함수에 전달될 최종 데이터 타입입니다.
 */
export interface UpdateMemberInput extends UpdateMemberInputBody {
    id: string; // memberId는 URL 파라미터로 전송됩니다.
}


// --- 기존 타입들을 새로운 타입의 별칭(alias)으로 유지하여 하위 호환성을 높임 ---
// 이렇게 하면 features나 widgets 레이어의 코드 변경을 최소화할 수 있습니다.
export type Student = AcademyMember;
export type Enrollment = AcademyMember;
export type CreateStudentInput = CreateMemberInput;
export type CreateEnrollmentInput = CreateMemberInput;
export type UpdateStudentInput = UpdateMemberInput;
export type UpdateEnrollmentInput = UpdateMemberInput;
export type UpdateStudentInputBody = UpdateMemberInputBody;
export type UpdateEnrollmentInputBody = UpdateMemberInputBody;


// --- 상수 ---
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