import { create } from 'zustand';
import type { ProcessedProblem } from '../../problem-publishing';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

let timerIntervalId: NodeJS.Timeout | null = null;
let examTimerIntervalId: NodeJS.Timeout | null = null; 

interface MobileExamState {
    orderedProblems: ProcessedProblem[];
    answers: Map<string, Set<AnswerNumber>>;
    subjectiveAnswers: Map<string, string>;
    statuses: Map<string, MarkingStatus>;
    skippedProblemIds: Set<string>;
    problemTimes: Map<string, number>;
    accumulatedTimes: Map<string, number>;
    activeProblemId: string | null;
    timerStartTime: number | null;
    currentTimer: number;
    totalElapsedTime: number;
    examStartTime: Date | null;
    examEndTime: Date | null;
    answerHistory: Map<string, (AnswerNumber | MarkingStatus | string)[]>;
}

interface MobileExamActions {
    initializeSession: (problems: ProcessedProblem[]) => void;
    resetSession: () => void;
    markAnswer: (problemId: string, answer: AnswerNumber) => void;
    markSubjectiveAnswer: (problemId: string, answer: string) => void;
    
    startTimerForProblem: (problemId: string) => void;
    pauseCurrentTimer: () => void;
    markProblemAsSolved: (problemId: string, status: MarkingStatus) => void;
    skipProblem: (problemId: string) => void;

    startExamTimer: () => void;
    stopExamTimer: () => void;

    completeExam: () => void;
}

const initialState: MobileExamState = {
    orderedProblems: [],
    answers: new Map(),
    subjectiveAnswers: new Map(),
    statuses: new Map(),
    skippedProblemIds: new Set(),
    problemTimes: new Map(),
    accumulatedTimes: new Map(),
    activeProblemId: null,
    timerStartTime: null,
    currentTimer: 0,
    totalElapsedTime: 0,
    examStartTime: null,
    examEndTime: null,
    answerHistory: new Map(),
};

export const useMobileExamStore = create<MobileExamState & MobileExamActions>((set, get) => ({
    ...initialState,

    initializeSession: (problems) => {
        if (get().orderedProblems.length > 0 && get().orderedProblems[0].uniqueId === problems[0]?.uniqueId) return;
        console.log(`[MobileExamStore] 🟢 INITIALIZE_SESSION`);
        get().resetSession();
        set({
            orderedProblems: problems,
            activeProblemId: problems[0]?.uniqueId || null,
            examStartTime: new Date(),
        });
        if (problems.length > 0) {
            get().startTimerForProblem(problems[0].uniqueId);
            get().startExamTimer();
        }
    },

    resetSession: () => {
        if (timerIntervalId) clearInterval(timerIntervalId);
        timerIntervalId = null;
        get().stopExamTimer();
        set(initialState);
    },

    markAnswer: (problemId, answer) => set(state => {
        const newAnswers = new Map(state.answers);
        const answerSet = new Set(newAnswers.get(problemId) || []);
        
        if (answerSet.has(answer)) {
            answerSet.delete(answer);
        } else {
            answerSet.add(answer);
        }

        if (answerSet.size === 0) {
            newAnswers.delete(problemId);
        } else {
            newAnswers.set(problemId, answerSet);
        }
        
        const newHistory = new Map(state.answerHistory);
        const history = [...(newHistory.get(problemId) || [])];
        history.push(answer);
        newHistory.set(problemId, history);

        return { answers: newAnswers, answerHistory: newHistory };
    }),

    markSubjectiveAnswer: (problemId, answer) => set(state => {
        const newSubjectiveAnswers = new Map(state.subjectiveAnswers).set(problemId, answer);
        
        const newHistory = new Map(state.answerHistory);
        const history = [...(newHistory.get(problemId) || [])];
        history.push(answer);
        newHistory.set(problemId, history);

        return { subjectiveAnswers: newSubjectiveAnswers, answerHistory: newHistory };
    }),

    startTimerForProblem: (problemId) => {
        console.log(`[MobileExamStore] Action: startTimerForProblem 호출됨. targetId: ${problemId}`);
        get().pauseCurrentTimer();
        set({ activeProblemId: problemId });
        
        const { accumulatedTimes, problemTimes } = get();
        const accumulatedTime = accumulatedTimes.get(problemId) || 0;
        set({ currentTimer: accumulatedTime });
        
        if (problemTimes.has(problemId)) {
            console.log(`[MobileExamStore] 🛑 TIMER_STOP: 문제[${problemId}]는 이미 풀었습니다.`);
            return;
        }

        console.log(`[MobileExamStore] ⏰ TIMER_START: 문제 [${problemId}] 타이머 시작. (누적: ${accumulatedTime.toFixed(2)}초)`);
        set({ timerStartTime: Date.now() });

        timerIntervalId = setInterval(() => {
            const { timerStartTime: newTimerStartTime, activeProblemId: currentActiveId } = get();
            if(newTimerStartTime && currentActiveId === problemId) {
                const elapsed = (Date.now() - newTimerStartTime) / 1000;
                set({ currentTimer: accumulatedTime + elapsed });
            }
        }, 1000);
    },
    
    pauseCurrentTimer: () => {
        if (timerIntervalId) clearInterval(timerIntervalId);
        timerIntervalId = null;

        const { activeProblemId, timerStartTime, accumulatedTimes } = get();
        if (activeProblemId && timerStartTime) {
            const elapsed = (Date.now() - timerStartTime) / 1000;
            const prevAccumulated = accumulatedTimes.get(activeProblemId) || 0;
            const newAccumulated = prevAccumulated + elapsed;
            
            console.log(`[MobileExamStore] ⏸️ PAUSE_TIMER: 문제 [${activeProblemId}]를 떠납니다. 누적 시간: ${newAccumulated.toFixed(2)}초.`);
            set({
                accumulatedTimes: new Map(accumulatedTimes).set(activeProblemId, newAccumulated),
                timerStartTime: null,
            });
        }
    },
    
    markProblemAsSolved: (problemId, status) => {
        get().pauseCurrentTimer();
        set(state => {
            const finalTime = state.accumulatedTimes.get(problemId) || 0;
            console.log(`[MobileExamStore] ✅ MARK_SOLVED: 문제 [${problemId}] 최종 풀이 완료. 최종 시간: ${finalTime.toFixed(2)}초.`);
            
            const newProblemTimes = new Map(state.problemTimes).set(problemId, finalTime);
            const newStatuses = new Map(state.statuses).set(problemId, status);
            
            const newHistory = new Map(state.answerHistory);
            const history = [...(newHistory.get(problemId) || [])];
            history.push(status);
            newHistory.set(problemId, history);

            return {
                problemTimes: newProblemTimes,
                statuses: newStatuses,
                answerHistory: newHistory,
            };
        });
    },

    skipProblem: (problemId) => {
        get().pauseCurrentTimer();
        set(state => ({
            skippedProblemIds: new Set(state.skippedProblemIds).add(problemId)
        }));
    },
    
    startExamTimer: () => {
        if (examTimerIntervalId) return;
        console.log('[MobileExamStore] ⏱️ EXAM_TIMER_START: 시험 전체 타이머 시작');
        examTimerIntervalId = setInterval(() => {
            set(state => ({ totalElapsedTime: state.totalElapsedTime + 1 }));
        }, 1000);
    },

    stopExamTimer: () => {
        if (examTimerIntervalId) {
            console.log('[MobileExamStore] 🛑 EXAM_TIMER_STOP: 시험 전체 타이머 정지');
            clearInterval(examTimerIntervalId);
            examTimerIntervalId = null;
        }
    },

    completeExam: () => {
        console.log('[MobileExamStore] 🏁 EXAM_COMPLETE: 시험 종료');
        get().stopExamTimer();
        set({ examEndTime: new Date() });
    },
}));