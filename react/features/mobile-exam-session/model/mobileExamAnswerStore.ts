// ----- ./react/features/mobile-exam-session/model/mobileExamAnswerStore.ts -----
import { create } from 'zustand';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

interface MobileExamAnswerState {
    answers: Map<string, Set<AnswerNumber>>;
    subjectiveAnswers: Map<string, string>;
    statuses: Map<string, MarkingStatus>;
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
        
        // [핵심 수정] 정답 변경 여부 판단 기준을 '답이 있었는가'에서
        // '풀이 완료 상태(A,B,C,D)가 기록되었는가'로 변경합니다.
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
        
        // [핵심 수정] 여기도 동일하게 풀이 완료 상태를 기준으로 변경 여부를 판단합니다.
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