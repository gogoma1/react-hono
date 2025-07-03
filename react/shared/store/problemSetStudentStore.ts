import { create } from 'zustand';

interface ProblemSetStudentState {
  studentIds: string[];
  setStudentIds: (ids: string[]) => void;
  clearStudentIds: () => void;
}

export const useProblemSetStudentStore = create<ProblemSetStudentState>((set) => ({
  studentIds: [],
  setStudentIds: (ids) => set({ studentIds: ids }),
  clearStudentIds: () => set({ studentIds: [] }),
}));