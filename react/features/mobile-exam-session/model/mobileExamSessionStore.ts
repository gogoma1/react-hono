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
            timeStore.setActiveProblemTimer(firstProblemId, undefined, new Map(), new Map());
        }
    },

    resetSession: () => {
        useMobileExamTimeStore.getState().reset();
        useMobileExamAnswerStore.getState().reset();
        set(initialState);
    },

    setActiveProblemId: (problemId) => {
        const { orderedProblems, activeProblemId } = get();

        if (activeProblemId) {
            useMobileExamTimeStore.getState().finalizeProblemTime(activeProblemId);
        }

        const problemBeingLeft = orderedProblems.find(p => p.uniqueId === activeProblemId);
        
        set({ activeProblemId: problemId });

        const { answers, subjectiveAnswers } = useMobileExamAnswerStore.getState();
        useMobileExamTimeStore.getState().setActiveProblemTimer(
            problemId,
            problemBeingLeft,
            answers,
            subjectiveAnswers
        );
    },

    skipProblem: (problemId) => {
        // ✨ [핵심 수정] 불필요한 setActiveProblemId 호출을 제거합니다.
        // 이 액션은 오직 'skipped' 상태만 책임지도록 수정합니다.
        set(state => ({
            skippedProblemIds: new Set(state.skippedProblemIds).add(problemId)
        }));
    },

    completeExam: () => {
        get().setActiveProblemId(''); 
        useMobileExamTimeStore.getState().stopExam(); // 전체 시험 타이머 중지
        set({ isSessionActive: false });
    },
}));