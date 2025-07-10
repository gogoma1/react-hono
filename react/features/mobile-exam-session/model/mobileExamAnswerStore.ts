import { create } from 'zustand';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

export interface MobileExamAnswerState {
    answers: Map<string, Set<AnswerNumber>>;
    subjectiveAnswers: Map<string, string>;
    statuses: Map<string, MarkingStatus>;
    answerHistory: Map<string, (AnswerNumber | MarkingStatus | string)[]>;
    modifiedProblemIds: Set<string>;
    
    // [핵심 추가 1] 마지막으로 '풀이 완료'가 확정된 시점의 상태를 저장
    lastCommitAnswers: Map<string, Set<AnswerNumber>>;
    lastCommitSubjectiveAnswers: Map<string, string>;
    lastCommitStatuses: Map<string, MarkingStatus>;
}

export interface MobileExamAnswerActions {
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
    // [핵심 추가 2] 초기 상태 설정
    lastCommitAnswers: new Map(),
    lastCommitSubjectiveAnswers: new Map(),
    lastCommitStatuses: new Map(),
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

        // [핵심 추가 3] 상태가 확정되는 이 시점에, 현재 답안과 상태를 "커밋"합니다.
        const newCommitAnswers = new Map(state.lastCommitAnswers);
        newCommitAnswers.set(problemId, new Set(state.answers.get(problemId)));

        const newCommitSubjectiveAnswers = new Map(state.lastCommitSubjectiveAnswers);
        newCommitSubjectiveAnswers.set(problemId, state.subjectiveAnswers.get(problemId) || '');

        const newCommitStatuses = new Map(state.lastCommitStatuses).set(problemId, status);

        return { 
            statuses: newStatuses, 
            answerHistory: newHistory,
            lastCommitAnswers: newCommitAnswers,
            lastCommitSubjectiveAnswers: newCommitSubjectiveAnswers,
            lastCommitStatuses: newCommitStatuses
        };
    }),
    
    reset: () => {
        set(initialAnswerState);
    },
}));