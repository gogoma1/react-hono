import { z } from 'zod';


/**
 * 학원 목록을 가져올 때 사용되는 타입.
 * 백엔드의 academiesTable 스키마와 일치하도록 id, name, region을 사용.
 */
export interface Academy {
    id: string;
    name: string;
    region: string;
}

/**
 * 시스템에서 사용될 역할(Position) 목록.
 */
export const POSITIONS = ['원장', '강사', '학생', '학부모', '과외 선생님'] as const;
export type PositionType = typeof POSITIONS[number];

/**
 * 프로필 초기 설정(Profile Setup) 시 API로 보낼 데이터의 유효성을 검사하는 Zod 스키마.
 * 백엔드 API 스펙에 맞춰 snake_case(role_name, academy_name)를 사용.
 */
export const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  role_name: z.enum(POSITIONS, { errorMap: () => ({ message: "역할을 선택해주세요." }) }),
  academy_name: z.string().optional(),
  region: z.string().optional(),
})
.refine(data => {
    if (data.role_name === '원장') {
        return !!data.academy_name && data.academy_name.trim().length > 0 && 
               !!data.region && data.region.trim().length > 0;
    }
    return true;
}, {
    message: "원장으로 가입 시 학원 이름과 지역은 필수 항목입니다.",
    path: ["academy_name", "region"],
});

/**
 * Zod 스키마로부터 TypeScript 타입을 자동으로 추론.
 */
export type ProfileSetupSchema = z.infer<typeof profileSetupSchema>;


// [신규] 역할 추가 시 API로 보낼 데이터 타입을 정의합니다.
export interface AddRolePayload {
  role_name: PositionType;
  academy_name?: string;
  region?: string;
  academy_id?: string;
}


/**
 * GET /api/profiles/me API의 응답 데이터 구조를 정의하는 타입.
 */
export interface MyProfile {
  id: string;
  email: string;
  name:string;
  phone: string | null;
  status: 'active' | 'inactive' | 'deleted';
  roles: {
    name: string;
    academy_name?: string | null;
    region?: string | null;
  }[];
}

/**
 * PUT /api/profiles/me API의 요청 본문(payload) 타입을 정의.
 */
export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
}

/**
 * 프로필 정보 수정 폼의 유효성 검사를 위한 Zod 스키마.
 * 이름은 최소 1자 이상, 전화번호는 10~11자리 숫자 또는 하이픈 포함 형식.
 */
export const updateProfileSchema = z.object({
    name: z.string()
        .min(1, '이름은 비워둘 수 없습니다.')
        .max(100, '이름이 너무 깁니다.'),
    phone: z.string()
        .refine(phone => {
            if (!phone || phone.trim() === '') return true; // 선택 사항이므로 비어있으면 통과
            const numericPhone = phone.replace(/-/g, '');
            return /^\d{10,11}$/.test(numericPhone);
        }, { message: '유효한 전화번호를 입력해주세요 (10-11자리 숫자).' })
        .optional()
        .or(z.literal('')) // 빈 문자열도 허용
});

/**
 * Zod 스키마로부터 프로필 수정 폼 데이터의 TypeScript 타입을 추론.
 */
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

/**
 * 백엔드의 `profilesTable` 스키마와 일치하는 프론트엔드 타입.
 * useUpdateProfileMutation의 반환 타입 등으로 사용될 수 있습니다.
 * (실제 프로젝트에서는 백엔드와 공유되는 타입 라이브러리에서 가져오는 것이 이상적입니다.)
 */
export interface DbProfile {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    status: 'active' | 'inactive' | 'deleted';
    deleted_at: Date | null; // DB에서는 문자열로 올 수 있으므로, API 응답 처리 시 new Date() 변환이 필요할 수 있습니다.
    created_at: Date; // 위와 동일
    updated_at: Date; // 위와 동일
}