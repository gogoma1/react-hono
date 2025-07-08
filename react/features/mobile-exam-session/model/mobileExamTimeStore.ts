// ----- ./react/features/mobile-exam-session/model/mobileExamTimeStore.ts -----
import { create } from 'zustand';

let problemTimerIntervalId: NodeJS.Timeout | null = null;
let examTimerIntervalId: NodeJS.Timeout | null = null;

interface MobileExamTimeState {
    problemTimes: Map<string, number>;
    accumulatedTimes: Map<string, number>;
    timerStartTime: number | null;
    currentTimer: number;
    totalElapsedTime: number;
    examStartTime: Date | null;
    examEndTime: Date | null;
    activeProblemId: string | null;
}

interface MobileExamTimeActions {
    startExam: () => void;
    stopExam: () => void;
    setActiveProblemTimer: (problemIdToStart: string) => void;
    finalizeProblemTime: (problemId: string) => void;
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
    activeProblemId: null,
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
        if (examTimerIntervalId) {
            clearInterval(examTimerIntervalId);
            examTimerIntervalId = null;
        }
        if (!get().examEndTime) set({ examEndTime: new Date() });
    },

    setActiveProblemTimer: (problemIdToStart) => {
        if (problemTimerIntervalId) clearInterval(problemTimerIntervalId);
        problemTimerIntervalId = null;

        const { timerStartTime, activeProblemId: problemIdToLeave } = get();
        const currentAccumulatedTimes = new Map(get().accumulatedTimes);

        if (problemIdToLeave && timerStartTime) {
            const elapsed = (Date.now() - timerStartTime) / 1000;
            const prevAccumulated = currentAccumulatedTimes.get(problemIdToLeave) || 0;
            currentAccumulatedTimes.set(problemIdToLeave, prevAccumulated + elapsed);
        }

        if (problemIdToStart) {
            const accumulatedTime = currentAccumulatedTimes.get(problemIdToStart) || 0;
            
            set({
                accumulatedTimes: currentAccumulatedTimes,
                activeProblemId: problemIdToStart,
                currentTimer: accumulatedTime,
                timerStartTime: Date.now(),
            });
            
            problemTimerIntervalId = setInterval(() => {
                const { timerStartTime: newTimerStartTime, activeProblemId: currentActiveId } = get();
                if (newTimerStartTime && currentActiveId === problemIdToStart) {
                    const elapsed = (Date.now() - newTimerStartTime) / 1000;
                    set({ currentTimer: accumulatedTime + elapsed });
                }
            }, 1000);
        } else {
            set({
                accumulatedTimes: currentAccumulatedTimes,
                activeProblemId: null,
                timerStartTime: null,
            });
        }
    },

    finalizeProblemTime: (problemId) => {
        // [핵심 수정] 이전에 시간이 기록되었더라도 덮어쓸 수 있도록 return 문을 제거합니다.
        // 이를 통해 수정된 문제의 누적 시간이 정상적으로 다시 저장됩니다.
        // if (get().problemTimes.has(problemId)) return;
        
        const { timerStartTime, accumulatedTimes } = get();
        let finalTime = accumulatedTimes.get(problemId) || 0;

        if (get().activeProblemId === problemId && timerStartTime) {
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
        problemTimerIntervalId = null;
        examTimerIntervalId = null;
        set(initialTimeState);
    },
}));