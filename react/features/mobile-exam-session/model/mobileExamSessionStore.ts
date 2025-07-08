// ./react/features/mobile-exam-session/model/mobileExamSessionStore.ts
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
        if (get().isSessionActive) return;
        
        const firstProblemId = problems[0]?.uniqueId || null;
        set({
            orderedProblems: problems,
            activeProblemId: firstProblemId,
            isSessionActive: true,
            skippedProblemIds: new Set(),
        });
        
        const timeStore = useMobileExamTimeStore.getState();
        const answerStore = useMobileExamAnswerStore.getState();
        
        timeStore.reset();
        answerStore.reset();
        
        timeStore.startExam();
        if (firstProblemId) {
            timeStore.setActiveProblemTimer(firstProblemId);
        }
    },

    resetSession: () => {
        useMobileExamTimeStore.getState().reset();
        useMobileExamAnswerStore.getState().reset();
        set(initialState);
    },

    setActiveProblemId: (problemId) => {
        const { activeProblemId: currentActiveId } = get();
        if (currentActiveId === problemId) return;

        if (currentActiveId) {
            useMobileExamTimeStore.getState().finalizeProblemTime(currentActiveId);
        }
        
        set({ activeProblemId: problemId });
        
        useMobileExamTimeStore.getState().setActiveProblemTimer(problemId);
    },

    skipProblem: (problemId) => {
        // 🐛 [디버깅 로그] 상태가 실제로 변경되는 시점을 확인합니다.
        console.log(`[Store] skipProblem 실행. ID: ${problemId}를 skippedProblemIds에 추가합니다.`);
        set(state => {
            const newSkippedIds = new Set(state.skippedProblemIds).add(problemId);
            console.log(`[Store] 상태 변경 후 skippedProblemIds:`, newSkippedIds);
            return { skippedProblemIds: newSkippedIds };
        });
    },

    completeExam: () => {
        const { activeProblemId } = get();
        if (activeProblemId) {
             useMobileExamTimeStore.getState().finalizeProblemTime(activeProblemId);
        }
        useMobileExamTimeStore.getState().stopExam();
        set({ isSessionActive: false, activeProblemId: null });
    },
}));