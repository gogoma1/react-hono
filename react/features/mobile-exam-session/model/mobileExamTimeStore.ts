import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMobileExamAnswerStore } from './mobileExamAnswerStore';

let problemTimerIntervalId: NodeJS.Timeout | null = null;
let examTimerIntervalId: NodeJS.Timeout | null = null;

export interface MobileExamTimeState {
    problemTimes: Map<string, number>;
    accumulatedTimes: Map<string, number>;
    timerStartTime: number | null;
    currentTimer: number;
    totalElapsedTime: number;
    examStartTime: Date | null;
    examEndTime: Date | null;
}

export interface MobileExamTimeActions {
    startExam: () => void;
    stopExam: () => void;
    handleProblemTransition: (problemIdToLeave: string | null, problemIdToStart: string | null, problemTypeToLeave?: string) => void;
    finalizeProblemTime: (problemId: string, activeProblemId: string | null) => void;
    reset: () => void;
}

const initialTimeState: MobileExamTimeState = {
    problemTimes: new Map(),
    accumulatedTimes: new Map(),
    timerStartTime: null,
    currentTimer: 0,
    totalElapsedTime: 0,
    examStartTime: null,
    examEndTime: null,
};

const checkAnswerChanged = (problemId: string, problemType: string): boolean => {
    const { 
        answers, 
        subjectiveAnswers, 
        lastCommitAnswers, 
        lastCommitSubjectiveAnswers 
    } = useMobileExamAnswerStore.getState();

    if (problemType === '서답형' || problemType === '논술형') {
        const currentAnswer = subjectiveAnswers.get(problemId) || '';
        const committedAnswer = lastCommitSubjectiveAnswers.get(problemId) || '';
        return currentAnswer !== committedAnswer;
    } else {
        const currentAnswerSet = answers.get(problemId) || new Set();
        const committedAnswerSet = lastCommitAnswers.get(problemId) || new Set();
        if (currentAnswerSet.size !== committedAnswerSet.size) return true;
        return ![...currentAnswerSet].every(val => committedAnswerSet.has(val));
    }
};

export const useMobileExamTimeStore = create<MobileExamTimeState & MobileExamTimeActions>()(
    persist(
        (set, get) => ({
            ...initialTimeState,

            startExam: () => {
                if (get().examStartTime) return;
                const now = new Date();
                set({ examStartTime: now, totalElapsedTime: 0 });

                if (examTimerIntervalId) clearInterval(examTimerIntervalId);
                examTimerIntervalId = setInterval(() => {
                    // examStartTime을 기준으로 경과 시간을 계산하여 동기화 오류 방지
                    set({ totalElapsedTime: (new Date().getTime() - now.getTime()) / 1000 });
                }, 1000);
            },
            
            stopExam: () => {
                if (examTimerIntervalId) { clearInterval(examTimerIntervalId); examTimerIntervalId = null; }
                if (!get().examEndTime) set({ examEndTime: new Date() });
            },

            handleProblemTransition: (problemIdToLeave, problemIdToStart, problemTypeToLeave) => {
                if (problemTimerIntervalId) clearInterval(problemTimerIntervalId);
                problemTimerIntervalId = null;

                const { timerStartTime, accumulatedTimes } = get();
                const newAccumulatedTimes = new Map(accumulatedTimes);

                if (problemIdToLeave && timerStartTime) {
                    const elapsed = (Date.now() - timerStartTime) / 1000;
                    const prevAccumulated = newAccumulatedTimes.get(problemIdToLeave) || 0;
                    const newAccumulatedValue = prevAccumulated + elapsed;
                    newAccumulatedTimes.set(problemIdToLeave, newAccumulatedValue);
                    
                    const { statuses, lastCommitStatuses } = useMobileExamAnswerStore.getState();
                    const isCompleted = statuses.has(problemIdToLeave);
                    
                    if (isCompleted && problemTypeToLeave) {
                        const answerChanged = checkAnswerChanged(problemIdToLeave, problemTypeToLeave);
                        const statusChanged = statuses.get(problemIdToLeave) !== lastCommitStatuses.get(problemIdToLeave);
                        
                        if (answerChanged || statusChanged) {
                            set(state => ({
                                problemTimes: new Map(state.problemTimes).set(problemIdToLeave, newAccumulatedValue),
                            }));
                            useMobileExamAnswerStore.getState().markStatus(problemIdToLeave, statuses.get(problemIdToLeave)!);
                        }
                    }
                }
                
                set({
                    accumulatedTimes: newAccumulatedTimes,
                    timerStartTime: problemIdToStart ? Date.now() : null,
                    currentTimer: problemIdToStart ? (newAccumulatedTimes.get(problemIdToStart) || 0) : 0,
                });

                if (problemIdToStart) {
                    const baseTime = get().accumulatedTimes.get(problemIdToStart) || 0;
                    const newStartTime = get().timerStartTime!;
                    
                    problemTimerIntervalId = setInterval(() => {
                        const elapsedSinceStart = (Date.now() - newStartTime) / 1000;
                        set({ currentTimer: baseTime + elapsedSinceStart });
                    }, 1000);
                }
            },

            finalizeProblemTime: (problemId, activeProblemId) => {
                const { timerStartTime, accumulatedTimes } = get();
                let finalTime = accumulatedTimes.get(problemId) || 0;

                if (activeProblemId === problemId && timerStartTime) {
                    const elapsed = (Date.now() - timerStartTime) / 1000;
                    finalTime += elapsed;
                }
                
                set(state => ({
                    problemTimes: new Map(state.problemTimes).set(problemId, finalTime),
                    accumulatedTimes: new Map(state.accumulatedTimes).set(problemId, finalTime),
                }));
            },

            reset: () => {
                if (problemTimerIntervalId) clearInterval(problemTimerIntervalId);
                if (examTimerIntervalId) clearInterval(examTimerIntervalId);
                problemTimerIntervalId = null; examTimerIntervalId = null;
                set(initialTimeState);
            },
        }),
        {
            name: 'mobile-exam-time-storage',
            storage: createJSONStorage(() => localStorage, {
                replacer: (_key, value) => {
                    if (value instanceof Map) {
                        return { __type: 'Map', value: Array.from(value.entries()) };
                    }
                    if (value instanceof Date) {
                        return { __type: 'Date', value: value.toISOString() };
                    }
                    return value;
                },
                reviver: (_key, value) => {
                    if (typeof value === 'object' && value !== null && '__type' in value) {
                        const typedValue = value as { __type: string, value: any };
                        if (typedValue.__type === 'Map' && Array.isArray(typedValue.value)) {
                            return new Map(typedValue.value);
                        }
                        if (typedValue.__type === 'Date' && typeof typedValue.value === 'string') {
                            return new Date(typedValue.value);
                        }
                    }
                    return value;
                },
            }),
            partialize: (state) => ({
                problemTimes: state.problemTimes,
                accumulatedTimes: state.accumulatedTimes,
                totalElapsedTime: state.totalElapsedTime,
                examStartTime: state.examStartTime,
                examEndTime: state.examEndTime,
            }),
        }
    )
);