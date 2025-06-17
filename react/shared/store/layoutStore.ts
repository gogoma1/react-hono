import { create } from 'zustand';
import type { ReactNode } from 'react';

interface LayoutState {
  rightSidebarContent: ReactNode | null;
  rightSidebarTrigger: ReactNode | null;
}

interface LayoutActions {
  setRightSidebarContent: (content: ReactNode | null) => void;
 
  setRightSidebarTrigger: (trigger: ReactNode | null) => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebarContent: null,
  rightSidebarTrigger: null, 
  setRightSidebarContent: (content) => set({ rightSidebarContent: content }),
  setRightSidebarTrigger: (trigger) => set({ rightSidebarTrigger: trigger }), // 
}));

// 선택자(selector)는 그대로 유지해도 됩니다.
export const selectRightSidebarContent = (state: LayoutState) => state.rightSidebarContent;