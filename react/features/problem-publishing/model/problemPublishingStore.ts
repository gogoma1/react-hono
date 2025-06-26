import { create } from 'zustand';
import { produce } from 'immer';
import type { Problem } from '../../../entities/problem/model/types';

export type ProcessedProblem = Problem & { display_question_number: string; uniqueId: string; };

interface ProblemPublishingState {
  initialProblems: ProcessedProblem[];
  draftProblems: ProcessedProblem[] | null;
  editingProblemId: string | null;
}

interface ProblemPublishingActions {
  setInitialData: (problems: ProcessedProblem[]) => void;
  startEditing: () => void;
  revertChanges: () => void;
  updateDraftProblem: (updatedProblem: ProcessedProblem) => void;
  revertSingleProblem: (problemId: string) => void;
  setEditingProblemId: (problemId: string | null) => void;
  saveProblem: (problemToSave: ProcessedProblem) => void; // 저장 후 상태 동기화를 위한 액션
}

export const useProblemPublishingStore = create<ProblemPublishingState & ProblemPublishingActions>((set, get) => ({
  initialProblems: [],
  draftProblems: null,
  editingProblemId: null,

  setInitialData: (problems) => {
    set({ initialProblems: problems, draftProblems: null, editingProblemId: null });
  },

  startEditing: () => {
    if (get().draftProblems === null) {
      set(state => ({
        draftProblems: JSON.parse(JSON.stringify(state.initialProblems))
      }));
    }
  },

  revertChanges: () => {
    set({ draftProblems: null });
  },

  updateDraftProblem: (updatedProblem) => {
    console.log('[LOG] problemPublishingStore: 📝 updateDraftProblem 액션 실행', { uniqueId: updatedProblem.uniqueId, textLength: updatedProblem.question_text.length });
    set(produce((state: ProblemPublishingState) => {
      if (state.draftProblems) {
        const index = state.draftProblems.findIndex(p => p.uniqueId === updatedProblem.uniqueId);
        if (index !== -1) {
          state.draftProblems[index] = updatedProblem;
        }
      }
    }));
  },

  revertSingleProblem: (problemId) => {
    set(produce((state: ProblemPublishingState) => {
      const originalProblem = state.initialProblems.find(p => p.uniqueId === problemId);
      if (originalProblem && state.draftProblems) {
        const index = state.draftProblems.findIndex(p => p.uniqueId === problemId);
        if (index !== -1) {
          state.draftProblems[index] = originalProblem;
        }
      }
    }));
  },
  
  setEditingProblemId: (problemId) => {
    set({ editingProblemId: problemId });
  },

  saveProblem: (problemToSave) => {
    set(produce((state: ProblemPublishingState) => {
        const initialIndex = state.initialProblems.findIndex(p => p.uniqueId === problemToSave.uniqueId);
        if (initialIndex !== -1) {
            state.initialProblems[initialIndex] = problemToSave;
        }
        if (state.draftProblems) {
            const draftIndex = state.draftProblems.findIndex(p => p.uniqueId === problemToSave.uniqueId);
            if (draftIndex !== -1) {
                state.draftProblems[draftIndex] = problemToSave;
            }
        }
    }));
  }
}));