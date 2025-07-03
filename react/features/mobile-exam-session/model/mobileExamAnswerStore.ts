import { create } from 'zustand';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

// 답안지 관련 상태 인터페이스
interface MobileExamAnswerState {
    answers: Map<string, Set<AnswerNumber>>;
    subjectiveAnswers: Map<string, string>;
    statuses: Map<string, MarkingStatus>;
    answerHistory: Map<string, (AnswerNumber | MarkingStatus | string)[]>;
}

// 답안지 관련 액션 인터페이스
interface MobileExamAnswerActions {
    markAnswer: (problemId: string, answer: AnswerNumber) => void;
    markSubjectiveAnswer: (problemId: string, answer: string) => void;
    markStatus: (problemId: string, status: MarkingStatus) => void;
    reset: () => void;
}

const initialAnswerState: MobileExamAnswerState = {
    answers: new Map(),
    subjectiveAnswers: new Map(),
    statuses: new Map(),
    answerHistory: new Map(),
};

export const useMobileExamAnswerStore = create<MobileExamAnswerState & MobileExamAnswerActions>((set) => ({
    ...initialAnswerState,

    markAnswer: (problemId, answer) => set(state => {
        const newAnswers = new Map(state.answers);
        const answerSet = new Set(newAnswers.get(problemId) || []);
        
        answerSet.has(answer) ? answerSet.delete(answer) : answerSet.add(answer);
        
        if (answerSet.size === 0) newAnswers.delete(problemId);
        else newAnswers.set(problemId, answerSet);
        
        const newHistory = new Map(state.answerHistory);
        const history = [...(newHistory.get(problemId) || []), answer];
        newHistory.set(problemId, history);

        return { answers: newAnswers, answerHistory: newHistory };
    }),

    markSubjectiveAnswer: (problemId, answer) => set(state => {
        const newSubjectiveAnswers = new Map(state.subjectiveAnswers).set(problemId, answer);
        const newHistory = new Map(state.answerHistory);
        const history = [...(newHistory.get(problemId) || []), answer];
        newHistory.set(problemId, history);
        return { subjectiveAnswers: newSubjectiveAnswers, answerHistory: newHistory };
    }),

    markStatus: (problemId, status) => set(state => {
        const newStatuses = new Map(state.statuses).set(problemId, status);
        const newHistory = new Map(state.answerHistory);
        const history = [...(newHistory.get(problemId) || []), status];
        newHistory.set(problemId, history);

        return { statuses: newStatuses, answerHistory: newHistory };
    }),
    
    reset: () => {
        set(initialAnswerState);
    },
}));