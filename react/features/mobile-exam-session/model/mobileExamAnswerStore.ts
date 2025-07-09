// ----- ./react/features/mobile-exam-session/model/mobileExamAnswerStore.ts -----

import { create } from 'zustand';
// [수정] index.ts에서 타입을 import 합니다.
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

interface MobileExamAnswerState {
    // [핵심 수정] Map의 제네릭 타입을 Set<number>에서 Set<AnswerNumber>로 변경합니다.
    answers: Map<string, Set<AnswerNumber>>;
    subjectiveAnswers: Map<string, string>;
    statuses: Map<string, MarkingStatus>;
    // [핵심 수정] 기록 배열도 AnswerNumber를 포함하도록 변경합니다.
    answerHistory: Map<string, (AnswerNumber | MarkingStatus | string)[]>;
    modifiedProblemIds: Set<string>;
}

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
    modifiedProblemIds: new Set(),
};

export const useMobileExamAnswerStore = create<MobileExamAnswerState & MobileExamAnswerActions>((set, get) => ({
    ...initialAnswerState,

    markAnswer: (problemId, answer) => {
        const { answers, statuses, modifiedProblemIds } = get();
        const newAnswers = new Map(answers);
        const answerSet = new Set(newAnswers.get(problemId) || []);
        
        const wasCommitted = statuses.has(problemId);
        
        answerSet.has(answer) ? answerSet.delete(answer) : answerSet.add(answer);
        
        if (answerSet.size === 0) newAnswers.delete(problemId);
        else newAnswers.set(problemId, answerSet);
        
        const newHistory = new Map(get().answerHistory);
        const history = [...(newHistory.get(problemId) || []), answer];
        newHistory.set(problemId, history);

        const newModifiedIds = new Set(modifiedProblemIds);
        if (wasCommitted) {
            newModifiedIds.add(problemId);
        }

        set({ answers: newAnswers, answerHistory: newHistory, modifiedProblemIds: newModifiedIds });
    },

    markSubjectiveAnswer: (problemId, answer) => {
        const { subjectiveAnswers, statuses, modifiedProblemIds } = get();
        
        const wasCommitted = statuses.has(problemId);

        const newSubjectiveAnswers = new Map(subjectiveAnswers).set(problemId, answer);
        
        const newHistory = new Map(get().answerHistory);
        const history = [...(newHistory.get(problemId) || []), answer];
        newHistory.set(problemId, history);

        const newModifiedIds = new Set(modifiedProblemIds);
        if (wasCommitted) {
            newModifiedIds.add(problemId);
        }
        
        set({ subjectiveAnswers: newSubjectiveAnswers, answerHistory: newHistory, modifiedProblemIds: newModifiedIds });
    },

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