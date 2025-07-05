import { z } from 'zod';

export interface Academy {
    academyName: string;
    region: string;
}

export const POSITIONS = ['원장', '강사', '학생', '학부모'] as const;
export type PositionType = typeof POSITIONS[number];

export const profileFormSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  // [수정] 전화번호 필드 추가. 유효한 형식인지 검사.
  phone: z.string()
    .min(1, "전화번호는 필수 항목입니다.")
    .regex(/^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/, { message: "유효한 전화번호 형식이 아닙니다." }),
  position: z.enum(POSITIONS, { errorMap: () => ({ message: "역할을 선택해주세요." }) }),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});
export type ProfileFormSchema = z.infer<typeof profileFormSchema>;