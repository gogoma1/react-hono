import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProcessedProblem } from '../../problem-publishing';
import { useMobileExamTimeStore } from './mobileExamTimeStore';
import { useMobileExamAnswerStore } from './mobileExamAnswerStore';

interface MobileExamSessionState {
    orderedProblems: ProcessedProblem[];
    activeProblemId: string | null;
    skippedProblemIds: Set<string>;
    isSessionActive: boolean;
}

interface MobileExamSessionActions {
    initializeSession: (problems: ProcessedProblem[]) => void;
    resumeSession: (problems: ProcessedProblem[]) => void;
    resetSession: () => void;
    setActiveProblemId: (problemId: string) => void;
    skipProblem: (problemId: string) => void;
    completeExam: () => void;
}

const initialState: MobileExamSessionState = {
    orderedProblems: [],
    activeProblemId: null,
    skippedProblemIds: new Set(),
    isSessionActive: false,
};

export const useMobileExamSessionStore = create<MobileExamSessionState & MobileExamSessionActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            initializeSession: (problems) => {
                if (get().isSessionActive || problems.length === 0) return;
                
                // 새로운 세션 시작 시 모든 관련 스토어 초기화
                useMobileExamTimeStore.getState().reset();
                useMobileExamAnswerStore.getState().reset();
                
                const firstProblemId = problems[0].uniqueId;
                
                set({
                    orderedProblems: problems,
                    activeProblemId: firstProblemId,
                    isSessionActive: true,
                    skippedProblemIds: new Set(),
                });
                
                useMobileExamTimeStore.getState().startExam();
                useMobileExamTimeStore.getState().handleProblemTransition(null, firstProblemId);
            },
            
            resumeSession: (problems) => {
                if (get().isSessionActive || problems.length === 0) return;

                console.log('세션을 복원합니다. 활성 문제 ID:', get().activeProblemId);
                
                // 타이머를 다시 시작하고, 현재 활성 문제의 타이머를 이어서 흐르게 함
                const { examStartTime } = useMobileExamTimeStore.getState();
                if (examStartTime) {
                    const elapsedSinceStart = (new Date().getTime() - examStartTime.getTime()) / 1000;
                    useMobileExamTimeStore.setState({ totalElapsedTime: elapsedSinceStart });
                }
                
                set({
                    orderedProblems: problems,
                    isSessionActive: true
                });
                
                useMobileExamTimeStore.getState().handleProblemTransition(null, get().activeProblemId);
            },

            resetSession: () => {
                // 세션 및 관련 스토어의 모든 상태와 localStorage 데이터 삭제
                useMobileExamTimeStore.getState().reset();
                useMobileExamAnswerStore.getState().reset();
                set(initialState);
            },

            setActiveProblemId: (problemId) => {
                const currentActiveId = get().activeProblemId;
                if (currentActiveId === problemId) return;

                const { orderedProblems } = get();
                const problemToLeave = orderedProblems.find(p => p.uniqueId === currentActiveId);
                
                useMobileExamTimeStore.getState().handleProblemTransition(currentActiveId, problemId, problemToLeave?.problem_type);
                
                set({ activeProblemId: problemId });
            },

            skipProblem: (problemId) => {
                set(state => ({
                    skippedProblemIds: new Set(state.skippedProblemIds).add(problemId)
                }));
            },

            completeExam: () => {
                const { activeProblemId } = get();
                if (activeProblemId) {
                    useMobileExamTimeStore.getState().finalizeProblemTime(activeProblemId, activeProblemId);
                }
                useMobileExamTimeStore.getState().stopExam();
                set({ isSessionActive: false, activeProblemId: null });
            },
        }),
        {
            name: 'mobile-exam-session-storage',
            storage: createJSONStorage(() => localStorage, {
                replacer: (_key, value) => {
                    if (value instanceof Set) {
                        return { __type: 'Set', value: Array.from(value) };
                    }
                    return value;
                },
                reviver: (_key, value) => {
                    if (typeof value === 'object' && value !== null && '__type' in value) {
                        const typedValue = value as { __type: string, value: unknown };
                        if (typedValue.__type === 'Set' && Array.isArray(typedValue.value)) {
                            return new Set(typedValue.value);
                        }
                    }
                    return value;
                },
            }),
            partialize: (state) => ({
                activeProblemId: state.activeProblemId,
                skippedProblemIds: state.skippedProblemIds,
            }),
        }
    )
);