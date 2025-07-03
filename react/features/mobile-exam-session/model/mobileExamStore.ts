import { create } from 'zustand';
import type { ProcessedProblem } from '../../problem-publishing';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';

let timerIntervalId: NodeJS.Timeout | null = null;
let examTimerIntervalId: NodeJS.Timeout | null = null;

interface RevisitState {
    problemId: string;
    initialAnswer: Set<AnswerNumber> | undefined;
    initialSubjectiveAnswer: string | undefined;
}

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
    revisitState: RevisitState | null;
    modifiedProblemIds: Set<string>;
}

interface MobileExamActions {
    initializeSession: (problems: ProcessedProblem[]) => void;
    resetSession: () => void;
    markAnswer: (problemId: string, answer: AnswerNumber) => void;
    markSubjectiveAnswer: (problemId:string, answer: string) => void;
    startTimerForProblem: (problemId: string) => void;
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
    revisitState: null,
    modifiedProblemIds: new Set(),
};

const areAnswersEqual = (
    problem: ProcessedProblem | undefined,
    initialAnswers: RevisitState['initialAnswer'],
    initialSubjective: RevisitState['initialSubjectiveAnswer'],
    currentAnswers: MobileExamState['answers'],
    currentSubjective: MobileExamState['subjectiveAnswers']
): boolean => {
    if (!problem) return true;

    if (problem.problem_type === '서답형') {
        const currentSubj = currentSubjective.get(problem.uniqueId) || '';
        return initialSubjective === currentSubj;
    } else {
        const currentSet = currentAnswers.get(problem.uniqueId);
        // 두 Set이 모두 없거나(undefined) 비어있는(size 0) 경우
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

export const useMobileExamStore = create<MobileExamState & MobileExamActions>((set, get) => ({
    ...initialState,

    initializeSession: (problems) => {
        if (get().orderedProblems.length > 0 && get().orderedProblems[0]?.uniqueId === problems[0]?.uniqueId) return;
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
        if (examTimerIntervalId) clearInterval(examTimerIntervalId);
        timerIntervalId = null;
        examTimerIntervalId = null;
        set(initialState);
    },

    // [핵심 수정] 복수정답 토글 로직
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
        const history = [...(newHistory.get(problemId) || []), answer];
        newHistory.set(problemId, history);

        return { answers: newAnswers, answerHistory: newHistory };
    }),

    markSubjectiveAnswer: (problemId, answer) => set(state => {
        const newSubjectiveAnswers = new Map(state.subjectiveAnswers).set(problemId, answer);
        const newHistory = new Map(state.answerHistory);
        const history = [...(newHistory.get(problemId) || []), answer];
        newHistory.set(problemId, history);
        return { subjectiveAnswers: newSubjectiveAnswers, answerHistory: newHistory };
    }),

    startTimerForProblem: (problemIdToStart) => {
        if (timerIntervalId) clearInterval(timerIntervalId);
        timerIntervalId = null;

        const {
            activeProblemId: problemIdToLeave,
            timerStartTime,
            revisitState,
            orderedProblems,
            answers,
            subjectiveAnswers,
        } = get();
        
        let nextState: Partial<MobileExamState> = {};
        let currentAccumulatedTimes = new Map(get().accumulatedTimes);

        if (problemIdToLeave && timerStartTime) {
            const elapsed = (Date.now() - timerStartTime) / 1000;
            const prevAccumulated = currentAccumulatedTimes.get(problemIdToLeave) || 0;
            const newAccumulated = prevAccumulated + elapsed;
            currentAccumulatedTimes.set(problemIdToLeave, newAccumulated);
            console.log(`[MobileExamStore] ⏸️ PAUSE_TIMER: 문제 [${problemIdToLeave}]를 떠납니다. 누적 시간: ${newAccumulated.toFixed(2)}초.`);

            if (revisitState && revisitState.problemId === problemIdToLeave) {
                const problemBeingLeft = orderedProblems.find(p => p.uniqueId === problemIdToLeave);
                const answerIsUnchanged = areAnswersEqual(problemBeingLeft, revisitState.initialAnswer, revisitState.initialSubjectiveAnswer, answers, subjectiveAnswers);

                if (answerIsUnchanged) {
                    const originalTime = get().problemTimes.get(problemIdToLeave);
                    if (originalTime !== undefined) {
                        currentAccumulatedTimes.set(problemIdToLeave, originalTime);
                        console.log(`[MobileExamStore] ⏪ REVERT_TIME: 문제 [${problemIdToLeave}] 답 변경 없어 시간 원복. 시간: ${originalTime.toFixed(2)}초`);
                    }
                } else {
                    const finalTime = newAccumulated;
                    const newProblemTimes = new Map(get().problemTimes).set(problemIdToLeave, finalTime);
                    const newModifiedProblemIds = new Set(get().modifiedProblemIds).add(problemIdToLeave);
                    nextState.problemTimes = newProblemTimes;
                    nextState.modifiedProblemIds = newModifiedProblemIds;
                    console.log(`[MobileExamStore] 🔄 COMMIT_MODIFIED_TIME: 문제 [${problemIdToLeave}] 답 변경되어 시간 갱신. 시간: ${finalTime.toFixed(2)}초`);
                }
            }
        }
        nextState.accumulatedTimes = currentAccumulatedTimes;
        nextState.revisitState = null;

        if (problemIdToStart) {
            const isRevisiting = get().problemTimes.has(problemIdToStart);
            if (isRevisiting) {
                console.log(`[MobileExamStore] 🔄 REVISIT_START: 이미 푼 문제 [${problemIdToStart}] 재방문`);
                nextState.revisitState = {
                    problemId: problemIdToStart,
                    initialAnswer: answers.get(problemIdToStart) ? new Set(answers.get(problemIdToStart)) : undefined,
                    initialSubjectiveAnswer: subjectiveAnswers.get(problemIdToStart),
                };
            }

            const accumulatedTimeForNewProblem = currentAccumulatedTimes.get(problemIdToStart) || 0;
            nextState.activeProblemId = problemIdToStart;
            nextState.currentTimer = accumulatedTimeForNewProblem;
            nextState.timerStartTime = Date.now();
            
            console.log(`[MobileExamStore] ⏰ TIMER_START: 문제 [${problemIdToStart}] 타이머 시작. (누적: ${accumulatedTimeForNewProblem.toFixed(2)}초)`);

            timerIntervalId = setInterval(() => {
                const { timerStartTime: newTimerStartTime, activeProblemId: currentActiveId } = get();
                if (newTimerStartTime && currentActiveId === problemIdToStart) {
                    const elapsed = (Date.now() - newTimerStartTime) / 1000;
                    set({ currentTimer: accumulatedTimeForNewProblem + elapsed });
                }
            }, 1000);
        } else {
            nextState.activeProblemId = null;
            nextState.timerStartTime = null;
        }

        set(nextState);
    },

    markProblemAsSolved: (problemId, status) => {
        if (timerIntervalId) clearInterval(timerIntervalId);
        timerIntervalId = null;

        const { timerStartTime, accumulatedTimes } = get();
        let finalTime = accumulatedTimes.get(problemId) || 0;

        if(timerStartTime) {
            const elapsed = (Date.now() - timerStartTime) / 1000;
            finalTime += elapsed;
        }

        console.log(`[MobileExamStore] ✅ MARK_SOLVED: 문제 [${problemId}] 첫 풀이 완료. 최종 시간: ${finalTime.toFixed(2)}초.`);
        
        set(state => {
            const newAccumulatedTimes = new Map(state.accumulatedTimes).set(problemId, finalTime);
            const newProblemTimes = new Map(state.problemTimes).set(problemId, finalTime);
            const newStatuses = new Map(state.statuses).set(problemId, status);
            const newHistory = new Map(state.answerHistory);
            const history = [...(newHistory.get(problemId) || []), status];
            newHistory.set(problemId, history);

            const newRevisitState = state.revisitState?.problemId === problemId ? null : state.revisitState;

            return {
                accumulatedTimes: newAccumulatedTimes,
                problemTimes: newProblemTimes,
                statuses: newStatuses,
                answerHistory: newHistory,
                revisitState: newRevisitState,
                timerStartTime: null,
            };
        });
    },

    skipProblem: (problemId) => {
        get().startTimerForProblem('');
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
        get().startTimerForProblem('');
        get().stopExamTimer();
        set({ examEndTime: new Date() });
    },
}));