import { create } from 'zustand';
import type { ReactNode } from 'react';
// [수정] TableSearchProps 타입을 정상적으로 임포트합니다.

// onSearchTermChange와 onFilterChange는 함수이므로 직렬화가 어렵고,
// 상태에 저장하기 부적합합니다. DashBoard에서 직접 상태를 관리하고,
// RootLayout에서는 그 상태를 변경하는 함수를 DashBoard로부터 받아 사용해야 합니다.
// 여기서는 상태를 변경하는 함수 참조를 저장하는 방식으로 구현합니다.
interface StoredSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeFilters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    suggestionGroups: string; // JSON 문자열로 저장
}

interface LayoutState {
  rightSidebarContent: ReactNode | null;
  rightSidebarTrigger: ReactNode | null;
  studentSearchProps: StoredSearchProps | null; // props 객체 또는 null
}

interface LayoutActions {
  setRightSidebarContent: (content: ReactNode | null) => void;
  setRightSidebarTrigger: (trigger: ReactNode | null) => void;
  setStudentSearchProps: (props: StoredSearchProps | null) => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebarContent: null,
  rightSidebarTrigger: null, 
  studentSearchProps: null,
  
  setRightSidebarContent: (content) => set({ rightSidebarContent: content }),
  setRightSidebarTrigger: (trigger) => set({ rightSidebarTrigger: trigger }),
  setStudentSearchProps: (props) => set({ studentSearchProps: props }),
}));

export const selectRightSidebarContent = (state: LayoutState) => state.rightSidebarContent;
export const selectStudentSearchProps = (state: LayoutState) => state.studentSearchProps;