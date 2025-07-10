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

    resetSession: () => {
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
            // [핵심 수정] finalizeProblemTime 호출 시 activeProblemId를 전달
            useMobileExamTimeStore.getState().finalizeProblemTime(activeProblemId, activeProblemId);
        }
        useMobileExamTimeStore.getState().stopExam();
        set({ isSessionActive: false, activeProblemId: null });
    },
}));