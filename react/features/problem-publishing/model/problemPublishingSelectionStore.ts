import { create } from 'zustand';

interface ProblemPublishingSelectionState {
  selectedProblemIds: Set<string>;
  setSelectedProblemIds: (ids: Set<string>) => void;
  toggleProblem: (id: string) => void;
  toggleProblems: (ids: string[]) => void;
  clearSelection: () => void;
}

/**
 * '문제 출제' 페이지 내에서 사용자가 선택하는 문제들의 ID를 관리하는 스토어.
 */
export const useProblemPublishingSelectionStore = create<ProblemPublishingSelectionState>((set) => ({
  selectedProblemIds: new Set(),
  setSelectedProblemIds: (ids) => set({ selectedProblemIds: ids }),
  toggleProblem: (id) => set((state) => {
    const newSelectedIds = new Set(state.selectedProblemIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    return { selectedProblemIds: newSelectedIds };
  }),
  toggleProblems: (idsToToggle) => set((state) => {
    if (idsToToggle.length === 0) return state;

    const allFilteredAreSelected = idsToToggle.every(id => state.selectedProblemIds.has(id));
    const newSelectedIds = new Set(state.selectedProblemIds);
    
    if (allFilteredAreSelected) {
      idsToToggle.forEach(id => newSelectedIds.delete(id));
    } else {
      idsToToggle.forEach(id => newSelectedIds.add(id));
    }
    return { selectedProblemIds: newSelectedIds };
  }),
  clearSelection: () => set({ selectedProblemIds: new Set() }),
}));