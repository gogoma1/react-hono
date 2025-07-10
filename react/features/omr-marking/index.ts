export { default as OmrMarkingCard } from './ui/mobileOmrMarkingCard';

/**
 * [수정] O, X, ①, ② 등 모든 보기 형식을 포괄하도록 string으로 타입을 변경합니다.
 * 이 타입 정의를 여기서 export하여 다른 파일에서 일관되게 사용합니다.
 */
export type AnswerNumber = string;

export type { MarkingStatus } from './ui/mobileOmrMarkingCard';