// ----- ./react/features/omr-marking/index.ts -----

export { default as OmrMarkingCard } from './ui/mobileOmrMarkingCard';

/**
 * [수정] O, X 유형을 포함하도록 AnswerNumber 타입을 확장합니다.
 * 이 타입 정의를 여기서 export하여 다른 파일에서 일관되게 사용합니다.
 */
export type AnswerNumber = 1 | 2 | 3 | 4 | 5 | 'O' | 'X';

export type { MarkingStatus } from './ui/mobileOmrMarkingCard';