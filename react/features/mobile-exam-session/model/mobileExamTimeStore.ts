import { create } from 'zustand';
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
    // [핵심 수정 1] activeProblemId를 인자로 받도록 변경
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

export const useMobileExamTimeStore = create<MobileExamTimeState & MobileExamTimeActions>((set, get) => ({
    ...initialTimeState,

    startExam: () => {
        if (get().examStartTime) return;
        set({ examStartTime: new Date(), totalElapsedTime: 0 });

        if (examTimerIntervalId) clearInterval(examTimerIntervalId);
        examTimerIntervalId = setInterval(() => {
            set(state => ({ totalElapsedTime: state.totalElapsedTime + 1 }));
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

    // [핵심 수정 2] 순환 참조를 제거하고 인자로 받은 activeProblemId를 사용
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
}));