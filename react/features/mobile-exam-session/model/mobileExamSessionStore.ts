import { create } from 'zustand';
import type { ProcessedProblem } from '../../problem-publishing';
import { useMobileExamTimeStore } from './mobileExamTimeStore';
import { useMobileExamAnswerStore } from './mobileExamAnswerStore'; // [핵심] AnswerStore 임포트

// 시험 세션의 '흐름'만 관리
interface MobileExamSessionState {
    orderedProblems: ProcessedProblem[];
    activeProblemId: string | null;
    skippedProblemIds: Set<string>;
    isSessionActive: boolean;
}

// 세션 흐름 제어 액션
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
        
        // 다른 원자적 스토어들 초기화 및 시작
        const timeStore = useMobileExamTimeStore.getState();
        const answerStore = useMobileExamAnswerStore.getState();
        
        timeStore.reset();
        answerStore.reset();
        
        timeStore.startExam();
        if (firstProblemId) {
            // 의존성 주입: timeStore는 answerStore의 상태를 모르므로, 여기서 빈 Map을 전달.
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
        const problemBeingLeft = orderedProblems.find(p => p.uniqueId === activeProblemId);
        
        set({ activeProblemId: problemId });

        // Time Store에 타이머 전환 요청
        // 이제 AnswerStore에서 직접 답안 정보를 가져와 전달
        const { answers, subjectiveAnswers } = useMobileExamAnswerStore.getState();
        useMobileExamTimeStore.getState().setActiveProblemTimer(
            problemId,
            problemBeingLeft,
            answers,
            subjectiveAnswers
        );
    },

    skipProblem: (problemId) => {
        // 빈 문자열을 전달하여 현재 문제 타이머를 멈춤
        get().setActiveProblemId('');
        set(state => ({
            skippedProblemIds: new Set(state.skippedProblemIds).add(problemId)
        }));
    },

    completeExam: () => {
        get().setActiveProblemId(''); // 모든 문제 타이머 중지
        useMobileExamTimeStore.getState().stopExam(); // 전체 시험 타이머 중지
        set({ isSessionActive: false });
    },
}));