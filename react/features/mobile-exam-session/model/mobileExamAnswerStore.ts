import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

export interface MobileExamAnswerState {
    answers: Map<string, Set<AnswerNumber>>;
    subjectiveAnswers: Map<string, string>;
    statuses: Map<string, MarkingStatus>;
    answerHistory: Map<string, (AnswerNumber | MarkingStatus | string)[]>;
    modifiedProblemIds: Set<string>;
    
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
    lastCommitAnswers: new Map(),
    lastCommitSubjectiveAnswers: new Map(),
    lastCommitStatuses: new Map(),
};

export const useMobileExamAnswerStore = create<MobileExamAnswerState & MobileExamAnswerActions>()(
    persist(
        (set, get) => ({
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
        }),
        {
            name: 'mobile-exam-answers-storage',
            storage: createJSONStorage(() => localStorage, {
                // [핵심 수정] 사용하지 않는 key 파라미터명에 언더스코어(_) 추가
                replacer: (_key, value) => {
                    if (value instanceof Map) {
                        return { __type: 'Map', value: Array.from(value.entries()) };
                    }
                    if (value instanceof Set) {
                        return { __type: 'Set', value: Array.from(value) };
                    }
                    return value;
                },
                // [핵심 수정] 사용하지 않는 key 파라미터명에 언더스코어(_) 추가
                reviver: (_key, value) => {
                    if (typeof value === 'object' && value !== null && '__type' in value) {
                        const typedValue = value as { __type: string, value: unknown };
                        
                        if (typedValue.__type === 'Map' && Array.isArray(typedValue.value)) {
                            return new Map(typedValue.value);
                        }
                        if (typedValue.__type === 'Set' && Array.isArray(typedValue.value)) {
                            return new Set(typedValue.value);
                        }
                    }
                    return value;
                },
            }),
            partialize: (state) => ({
                answers: state.answers,
                subjectiveAnswers: state.subjectiveAnswers,
                statuses: state.statuses,
                answerHistory: state.answerHistory,
                modifiedProblemIds: state.modifiedProblemIds,
            }),
        }
    )
);