// ----- ./react/features/mobile-exam-session/model/mobileExamSessionStore.ts -----
import { create } from 'zustand';
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

export const useMobileExamSessionStore = create<MobileExamSessionState & MobileExamSessionActions>((set, get) => ({
    ...initialState,

    initializeSession: (problems) => {
        if (get().isSessionActive || problems.length === 0) return;
        
        console.log("[SessionStore] initializeSession: 시험 세션을 시작합니다.", { problemCount: problems.length });
        
        const firstProblemId = problems[0].uniqueId;
        
        // 다른 스토어들을 먼저 초기화합니다.
        useMobileExamTimeStore.getState().reset();
        useMobileExamAnswerStore.getState().reset();
        
        // 현재 스토어 상태를 설정합니다.
        set({
            orderedProblems: problems,
            activeProblemId: firstProblemId,
            isSessionActive: true,
            skippedProblemIds: new Set(),
        });
        
        // 시간 측정을 시작합니다.
        useMobileExamTimeStore.getState().startExam();
        useMobileExamTimeStore.getState().setActiveProblemTimer(firstProblemId);
    },

    resetSession: () => {
        console.log("[SessionStore] resetSession: 모든 시험 관련 상태를 초기화합니다.");
        useMobileExamTimeStore.getState().reset();
        useMobileExamAnswerStore.getState().reset();
        set(initialState);
    },

    setActiveProblemId: (problemId) => {
        const currentActiveId = get().activeProblemId;
        if (currentActiveId === problemId) return;

        console.log(`[SessionStore] setActiveProblemId: 활성 문제를 ${currentActiveId}에서 ${problemId}로 변경합니다.`);
        
        // [핵심] 타이머 상태 변경을 이 곳에서 책임집니다.
        useMobileExamTimeStore.getState().setActiveProblemTimer(problemId);
        
        set({ activeProblemId: problemId });
    },

    skipProblem: (problemId) => {
        console.log(`[SessionStore] skipProblem: 문제 ${problemId}를 스킵 처리합니다.`);
        set(state => ({
            skippedProblemIds: new Set(state.skippedProblemIds).add(problemId)
        }));
    },

    completeExam: () => {
        console.log("[SessionStore] completeExam: 시험을 종료합니다.");
        const { activeProblemId } = get();
        if (activeProblemId) {
             useMobileExamTimeStore.getState().finalizeProblemTime(activeProblemId);
        }
        useMobileExamTimeStore.getState().stopExam();
        set({ isSessionActive: false, activeProblemId: null });
    },
}));