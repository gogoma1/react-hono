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
    setActiveProblemTimer: (problemIdToStart: string | null) => void;
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
        // [핵심 수정] 기존 타이머를 확실하게 정리합니다.
        if (problemTimerIntervalId) clearInterval(problemTimerIntervalId);
        problemTimerIntervalId = null;

        // [핵심 수정] 상태 업데이트를 단일 'set' 호출로 묶어 원자적으로 처리합니다.
        set(state => {
            const { timerStartTime, activeProblemId: problemIdToLeave, accumulatedTimes } = state;
            const newAccumulatedTimes = new Map(accumulatedTimes);

            // 1. 떠나는 문제의 시간을 계산하고 누적합니다.
            if (problemIdToLeave && timerStartTime) {
                const elapsed = (Date.now() - timerStartTime) / 1000;
                const prevAccumulated = newAccumulatedTimes.get(problemIdToLeave) || 0;
                newAccumulatedTimes.set(problemIdToLeave, prevAccumulated + elapsed);
            }

            // 2. 새로 시작할 문제가 없다면 타이머를 멈추고 상태를 정리합니다.
            if (!problemIdToStart) {
                return {
                    ...state,
                    accumulatedTimes: newAccumulatedTimes,
                    activeProblemId: null,
                    timerStartTime: null,
                    currentTimer: 0,
                };
            }

            // 3. 새로 시작할 문제의 누적 시간을 가져옵니다.
            const newProblemBaseTime = newAccumulatedTimes.get(problemIdToStart) || 0;

            // 4. 새로운 문제에 대한 상태를 설정합니다.
            return {
                ...state,
                accumulatedTimes: newAccumulatedTimes,
                activeProblemId: problemIdToStart,
                timerStartTime: Date.now(), // 타이머 시작 시점을 현재로 리셋
                currentTimer: newProblemBaseTime, // UI에 표시될 타이머를 누적 시간으로 즉시 설정
            };
        });

        // [핵심 수정] 상태 업데이트 후, 새로운 setInterval을 설정합니다.
        // 이렇게 하면 항상 최신 상태를 기반으로 인터벌이 동작합니다.
        const { activeProblemId, timerStartTime, accumulatedTimes } = get();
        if (activeProblemId && timerStartTime) {
            const baseTime = accumulatedTimes.get(activeProblemId) || 0;
            const newStartTime = timerStartTime; // 이 타이머 세션의 시작 시간

            problemTimerIntervalId = setInterval(() => {
                const elapsedSinceStart = (Date.now() - newStartTime) / 1000;
                set({ currentTimer: baseTime + elapsedSinceStart });
            }, 1000);
        }
    },

    finalizeProblemTime: (problemId) => {
        const { timerStartTime, accumulatedTimes, activeProblemId } = get();
        let finalTime = accumulatedTimes.get(problemId) || 0;

        // 현재 활성 문제의 시간을 마지막으로 더해줍니다.
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
        problemTimerIntervalId = null;
        examTimerIntervalId = null;
        set(initialTimeState);
    },
}));