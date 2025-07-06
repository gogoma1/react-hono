import { create } from 'zustand';
import type { Student } from '../../entities/student/model/types'; // Student 타입 임포트

interface ProblemSetStudentState {
  students: Student[]; // [수정] string[] -> Student[]
  setStudents: (students: Student[]) => void; // [수정] 이름 및 타입 변경
  clearStudents: () => void; // [수정] 이름 변경
}

export const useProblemSetStudentStore = create<ProblemSetStudentState>((set) => ({
  students: [], // [수정] 초기값 변경
  setStudents: (students) => set({ students: students }), // [수정] 액션 구현
  clearStudents: () => set({ students: [] }), // [수정] 액션 구현
}));