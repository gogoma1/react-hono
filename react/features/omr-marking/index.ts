export { default as OmrMarkingCard } from './ui/OmrMarkingCard';
// [핵심 수정] currentAnswers 타입을 명시적으로 내보내지 않으므로 AnswerNumber만 유지
export type { MarkingStatus, AnswerNumber } from './ui/OmrMarkingCard';