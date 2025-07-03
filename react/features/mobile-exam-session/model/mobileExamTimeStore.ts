import { create } from 'zustand';
import type { ProcessedProblem } from '../../problem-publishing';

let problemTimerIntervalId: NodeJS.Timeout | null = null;
let examTimerIntervalId: NodeJS.Timeout | null = null;

// 재방문한 문제의 시간 처리를 위한 상태
interface RevisitState {
    problemId: string;
    // 재방문 시작 시점의 정답 상태를 기록
    initialAnswer: Set<number> | undefined;
    initialSubjectiveAnswer: string | undefined;
}

// 시간 관련 상태 인터페이스
interface MobileExamTimeState {
    // 최종 확정된 문제별 풀이 시간
    problemTimes: Map<string, number>;
    // 재방문 등을 포함한 누적 풀이 시간 (타이머 계산용)
    accumulatedTimes: Map<string, number>;
    // 현재 타이머가 측정하고 있는 문제의 시작 시간 (Date.now())
    timerStartTime: number | null;
    // 현재 활성화된 문제의 타이머에 표시될 시간 (초)
    currentTimer: number;
    // 시험 전체 경과 시간 (초)
    totalElapsedTime: number;
    // 시험 시작/종료 시각
    examStartTime: Date | null;
    examEndTime: Date | null;
    // 재방문 문제 처리를 위한 상태
    revisitState: RevisitState | null;
    // 재방문 후 정답이 수정되어 시간이 갱신된 문제 ID Set
    modifiedProblemIds: Set<string>;
    // 현재 타이머가 동작 중인 문제의 ID
    activeProblemId: string | null;
}

// 시간 관련 액션 인터페이스
interface MobileExamTimeActions {
    startExam: () => void;
    stopExam: () => void;
    // 특정 문제의 타이머를 활성화 (가장 핵심적인 로직)
    setActiveProblemTimer: (
        problemIdToStart: string,
        // 의존성을 없애기 위해 필요한 데이터를 인자로 받음
        problemBeingLeft: ProcessedProblem | undefined, 
        currentAnswers: Map<string, Set<number>>,
        currentSubjectiveAnswers: Map<string, string>
    ) => void;
    // 문제 풀이를 완료하고 시간을 확정
    finalizeProblemTime: (problemId: string) => void;
    // 모든 시간 관련 상태 초기화
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
    revisitState: null,
    modifiedProblemIds: new Set(),
    activeProblemId: null,
};

// 정답이 변경되었는지 확인하는 헬퍼 함수
const areAnswersEqual = (
    problem: ProcessedProblem | undefined,
    initialAnswers: RevisitState['initialAnswer'],
    initialSubjective: RevisitState['initialSubjectiveAnswer'],
    currentAnswers: Map<string, Set<number>>,
    currentSubjective: Map<string, string>
): boolean => {
    if (!problem) return true;

    if (problem.problem_type === '서답형') {
        const currentSubj = currentSubjective.get(problem.uniqueId) || '';
        return initialSubjective === currentSubj;
    } else {
        const currentSet = currentAnswers.get(problem.uniqueId);
        if ((!initialAnswers || initialAnswers.size === 0) && (!currentSet || currentSet.size === 0)) {
            return true;
        }
        if (initialAnswers?.size !== currentSet?.size) return false;
        if (!initialAnswers || !currentSet) return false;

        for (const item of initialAnswers) {
            if (!currentSet.has(item)) return false;
        }
        return true;
    }
};

export const useMobileExamTimeStore = create<MobileExamTimeState & MobileExamTimeActions>((set, get) => ({
    ...initialTimeState,

    startExam: () => {
        if (get().examStartTime) return; // 이미 시작했다면 무시
        set({
            examStartTime: new Date(),
            totalElapsedTime: 0,
        });

        if (examTimerIntervalId) clearInterval(examTimerIntervalId);
        examTimerIntervalId = setInterval(() => {
            set(state => ({ totalElapsedTime: state.totalElapsedTime + 1 }));
        }, 1000);
        console.log('[TimeStore] ⏱️ EXAM_TIMER_START: 시험 전체 타이머 시작');
    },
    
    stopExam: () => {
        if (examTimerIntervalId) {
            clearInterval(examTimerIntervalId);
            examTimerIntervalId = null;
        }
        if (!get().examEndTime) {
            set({ examEndTime: new Date() });
            console.log('[TimeStore] 🏁 EXAM_COMPLETE: 시험 종료');
        }
    },

    setActiveProblemTimer: (problemIdToStart, problemBeingLeft, currentAnswers, currentSubjectiveAnswers) => {
        if (problemTimerIntervalId) clearInterval(problemTimerIntervalId);
        problemTimerIntervalId = null;

        const { timerStartTime, revisitState } = get();
        let nextState: Partial<MobileExamTimeState> = {};
        let currentAccumulatedTimes = new Map(get().accumulatedTimes);

        // 떠나는 문제에 대한 시간 처리
        if (problemBeingLeft && timerStartTime) {
            const problemIdToLeave = problemBeingLeft.uniqueId;
            const elapsed = (Date.now() - timerStartTime) / 1000;
            const prevAccumulated = currentAccumulatedTimes.get(problemIdToLeave) || 0;
            const newAccumulated = prevAccumulated + elapsed;
            currentAccumulatedTimes.set(problemIdToLeave, newAccumulated);

            // 재방문 상태였다면 정답 변경 여부 확인 후 시간 처리
            if (revisitState && revisitState.problemId === problemIdToLeave) {
                const answerIsUnchanged = areAnswersEqual(problemBeingLeft, revisitState.initialAnswer, revisitState.initialSubjectiveAnswer, currentAnswers, currentSubjectiveAnswers);

                if (answerIsUnchanged) {
                    const originalTime = get().problemTimes.get(problemIdToLeave);
                    if (originalTime !== undefined) {
                        currentAccumulatedTimes.set(problemIdToLeave, originalTime);
                    }
                } else {
                    const finalTime = newAccumulated;
                    nextState.problemTimes = new Map(get().problemTimes).set(problemIdToLeave, finalTime);
                    nextState.modifiedProblemIds = new Set(get().modifiedProblemIds).add(problemIdToLeave);
                }
            }
        }
        
        nextState.accumulatedTimes = currentAccumulatedTimes;
        nextState.revisitState = null;

        // 새로 시작할 문제에 대한 타이머 설정
        if (problemIdToStart) {
            if (get().problemTimes.has(problemIdToStart)) { // 이미 푼 문제(재방문)
                nextState.revisitState = {
                    problemId: problemIdToStart,
                    initialAnswer: currentAnswers.get(problemIdToStart) ? new Set(currentAnswers.get(problemIdToStart)) : undefined,
                    initialSubjectiveAnswer: currentSubjectiveAnswers.get(problemIdToStart),
                };
            }

            const accumulatedTime = currentAccumulatedTimes.get(problemIdToStart) || 0;
            nextState.activeProblemId = problemIdToStart;
            nextState.currentTimer = accumulatedTime;
            nextState.timerStartTime = Date.now();
            
            problemTimerIntervalId = setInterval(() => {
                const { timerStartTime: newTimerStartTime, activeProblemId: currentActiveId } = get();
                if (newTimerStartTime && currentActiveId === problemIdToStart) {
                    const elapsed = (Date.now() - newTimerStartTime) / 1000;
                    set({ currentTimer: accumulatedTime + elapsed });
                }
            }, 1000);
        } else { // 타이머를 끌 때 (예: 문제 스킵, 시험 종료)
            nextState.activeProblemId = null;
            nextState.timerStartTime = null;
        }

        set(nextState);
    },

    finalizeProblemTime: (problemId) => {
        if (get().problemTimes.has(problemId)) return; // 이미 확정된 시간은 변경하지 않음
        
        const { timerStartTime, accumulatedTimes } = get();
        let finalTime = accumulatedTimes.get(problemId) || 0;

        if (timerStartTime) {
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