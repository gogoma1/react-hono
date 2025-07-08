/**
 * academy_members 테이블의 details 필드 타입을 강사/직원용으로 정의합니다.
 * 기존 학생의 student_name, student_phone 필드명을 그대로 사용하여 백엔드와 호환성을 유지합니다.
 */
export interface StaffDetails {
    student_name?: string;  // 이름
    student_phone?: string; // 연락처
    subject?: string;       // 담당 과목
    class_name?: string;    // 담당 반 (직책 등으로 활용 가능)
}

/**
 * academy_members 테이블의 전체 구조를 나타내는 포괄적인 타입입니다.
 */
export interface StaffMember {
    id: string;
    academy_id: string;
    profile_id: string | null;
    member_type: 'teacher' | 'staff';
    status: 'active' | 'inactive' | 'resigned';
    start_date: string | null;
    end_date: string | null;
    details: StaffDetails | null;
    created_at: string;
    updated_at: string;
}

/**
 * 새 강사/직원 생성 시 API에 보내는 데이터 타입입니다.
 * member_type을 필수로 포함하여 어떤 유형으로 생성할지 명시합니다.
 */
export interface CreateStaffInput {
    academy_id: string;
    member_type: 'teacher' | 'staff';
    details: StaffDetails;
    profile_id?: string | null; // 1차 등록 시에는 null
}

/**
 * 강사/직원 정보 수정 시 API Body에 담길 데이터 타입입니다.
 */
export interface UpdateStaffInputBody {
    status?: 'active' | 'inactive' | 'resigned';
    details?: Partial<StaffDetails>;
    start_date?: string | null;
    end_date?: string | null;
}

/**
 * 강사/직원 정보 수정 함수에 전달될 최종 데이터 타입입니다.
 */
export interface UpdateStaffInput extends UpdateStaffInputBody {
    id: string;
}