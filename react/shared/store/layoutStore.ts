import { create } from 'zustand';
import type { ReactNode } from 'react';

interface LayoutState {
  rightSidebarContent: ReactNode | null;
}

interface LayoutActions {
  setRightSidebarContent: (content: ReactNode | null) => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebarContent: null,
  setRightSidebarContent: (content) => set({ rightSidebarContent: content }),
}));

// 성능 최적화를 위한 셀렉터 (선택적이지만 권장)
// 이 셀렉터들은 컴포넌트가 스토어의 특정 부분만 구독하게 하여 불필요한 리렌더링을 방지합니다.
export const selectRightSidebarContent = (state: LayoutState) => state.rightSidebarContent;