/**
 * [수정]
 * 학생(Student)이 아닌 재원 정보(Enrollment)를 나타내는 기본 타입입니다.
 * 백엔드의 enrollmentsTable 스키마와 일치하도록 필드를 snake_case로 수정합니다.
 */
export interface Enrollment {
    id: string;
    academy_id: string;
    student_profile_id: string | null;
    
    student_name: string;
    student_phone: string | null;
    guardian_phone: string | null;
    grade: string;
    subject: string;
    status: '재원' | '휴원' | '퇴원';
    tuition: number | null;
    admission_date: string | null;
    discharge_date: string | null;
    school_name: string | null;
    class_name: string | null;
    teacher: string | null;
    
    created_at: string;
    updated_at: string;
}

/**
 * [수정]
 * 신규 재원생 등록 시 API에 보내는 데이터 타입입니다.
 * 백엔드 스키마와 일관성을 위해 snake_case로 수정합니다.
 */
export interface CreateEnrollmentInput {
    academy_id: string;
    student_name: string;
    grade: string;
    subject: string;
    status: '재원' | '휴원' | '퇴원';
    
    student_phone?: string | null;
    guardian_phone?: string | null;
    tuition?: number | null;
    admission_date?: string | null;
    school_name?: string | null;
    class_name?: string | null;
    teacher?: string | null;
    student_profile_id?: string | null;
}

/**
 * [수정]
 * 재원생 정보 수정 시 API Body에 담길 데이터의 타입입니다.
 */
export interface UpdateEnrollmentInputBody extends Partial<Omit<CreateEnrollmentInput, 'academy_id'>> {
    discharge_date?: string | null;
}


/**
 * [수정]
 * 재원생 정보 수정 함수(updateEnrollmentAPI)에 전달될 최종 데이터 타입입니다.
 * id는 URL 파라미터로, 나머지는 body로 전송됩니다.
 */
export interface UpdateEnrollmentInput extends UpdateEnrollmentInputBody {
    id: string;
}


// 타입 별칭(alias)은 기존대로 유지하여 다른 파일의 코드 변경을 최소화합니다.
export type Student = Enrollment;
export type CreateStudentInput = CreateEnrollmentInput;
export type UpdateStudentInput = UpdateEnrollmentInput;
export type UpdateStudentInputBody = UpdateEnrollmentInputBody;


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