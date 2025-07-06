import { z } from 'zod';

/**
 * [유지 및 수정]
 * 학원 목록을 가져올 때 사용되는 타입입니다.
 * 백엔드의 academiesTable 스키마와 일치하도록 id와 name을 사용합니다.
 */
export interface Academy {
    id: string;
    name: string;
    region: string;
}

/**
 * [수정]
 * 시스템에서 사용될 역할(Position) 목록입니다.
 * '과외 선생님'을 추가합니다.
 */
export const POSITIONS = ['원장', '강사', '학생', '학부모', '과외 선생님'] as const;
export type PositionType = typeof POSITIONS[number];

/**
 * [대대적 수정]
 * 프로필 설정(Profile Setup) 시 API로 보낼 데이터의 유효성을 검사하는 Zod 스키마입니다.
 * 
 * [수정됨] 백엔드 API 스펙에 맞춰 camelCase(roleName, academyName)를 snake_case(role_name, academy_name)로 변경합니다.
 */
export const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  role_name: z.enum(POSITIONS, { errorMap: () => ({ message: "역할을 선택해주세요." }) }),
  academy_name: z.string().optional(),
  region: z.string().optional(),
})
.refine(data => {
    // [수정됨] camelCase -> snake_case
    if (data.role_name === '원장') {
        return !!data.academy_name && data.academy_name.trim().length > 0 && 
               !!data.region && data.region.trim().length > 0;
    }
    return true;
}, {
    message: "원장으로 가입 시 학원 이름과 지역은 필수 항목입니다.",
    // [수정됨] camelCase -> snake_case
    path: ["academy_name", "region"],
});

/**
 * 위 Zod 스키마로부터 TypeScript 타입을 자동으로 추론합니다.
 * 이 타입을 API 요청 페이로드의 타입으로 사용할 수 있습니다.
 */
export type ProfileSetupSchema = z.infer<typeof profileSetupSchema>;