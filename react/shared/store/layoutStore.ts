// ./react/shared/store/layoutStore.ts
import { create } from 'zustand';
import type { ReactNode } from 'react';

interface StoredSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeFilters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    suggestionGroups: string;
    // [추가] 새로운 버튼들을 위한 Props
    onToggleFiltered: () => void;
    onCreateProblemSet: () => void;
    selectedCount: number;
}

interface SidebarTriggers {
  onRegisterClick?: () => void;
  onSettingsClick?: () => void;
  onClose?: () => void;
}

interface LayoutState {
  rightSidebarContent: ReactNode | null;
  sidebarTriggers: SidebarTriggers;
  studentSearchProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarContent: (content: ReactNode | null) => void;
  setSidebarTriggers: (triggers: SidebarTriggers) => void;
  setStudentSearchProps: (props: StoredSearchProps | null) => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebarContent: null,
  sidebarTriggers: {},
  studentSearchProps: null,
  
  setRightSidebarContent: (content) => set({ rightSidebarContent: content }),
  setSidebarTriggers: (triggers) => set({ sidebarTriggers: triggers }),
  setStudentSearchProps: (props) => set({ studentSearchProps: props }),
}));

export const selectRightSidebarContent = (state: LayoutState) => state.rightSidebarContent;
export const selectStudentSearchProps = (state: LayoutState) => state.studentSearchProps;
export const selectSidebarTriggers = (state: LayoutState) => state.sidebarTriggers;