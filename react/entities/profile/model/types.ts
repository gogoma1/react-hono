// ./react/entities/profile/model/types.ts

import { z } from 'zod';

export interface Academy {
    id: string;
    name: string;
    region: string;
}

// [수정 없음] 기존 타입 유지
export const POSITIONS = ['원장', '강사', '학생', '학부모', '과외 선생님'] as const;
export type PositionType = typeof POSITIONS[number];

// [수정 없음] 기존 타입 유지
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

export type ProfileSetupSchema = z.infer<typeof profileSetupSchema>;

/**
 * [신규/수정] 역할 추가 API에 전송할 데이터 타입
 */
export interface AddRolePayload {
  role_name: PositionType;
  academy_name?: string;
  region?: string;
  academy_id?: string;
}

/**
 * [핵심 수정] GET /api/profiles/me API의 응답 데이터 구조를 정의하는 타입.
 * 백엔드가 가공해서 보내주는 최종 데이터 구조와 일치시킵니다.
 */
export interface MyProfile {
  id: string;
  email: string;
  name:string;
  phone: string | null;
  status: 'active' | 'inactive' | 'deleted';
  roles: {
    id: string; // user_role.id 가 아닌 role.id 입니다.
    name: string; // 역할 이름 (예: '원장', '학생')
    academyId?: string; // 소속된 학원 ID
    academyName?: string; // 소속된 학원 이름
    region?: string; // 소속된 학원 지역
  }[];
  ownedAcademies: { // 원장으로서 소유한 학원 목록
    id: string;
    name: string;
    region: string;
  }[];
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
}

// [수정 없음] 기존 타입 유지
export const updateProfileSchema = z.object({
    name: z.string()
        .min(1, '이름은 비워둘 수 없습니다.')
        .max(100, '이름이 너무 깁니다.'),
    phone: z.string()
        .refine(phone => {
            if (!phone || phone.trim() === '') return true;
            const numericPhone = phone.replace(/-/g, '');
            return /^\d{10,11}$/.test(numericPhone);
        }, { message: '유효한 전화번호를 입력해주세요 (10-11자리 숫자).' })
        .optional()
        .or(z.literal(''))
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;


// [수정 없음] 기존 타입 유지
export interface DbProfile {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    status: 'active' | 'inactive' | 'deleted';
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
}