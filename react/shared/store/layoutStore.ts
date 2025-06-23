import { create } from 'zustand';
import type { ReactNode } from 'react';
import { useMemo } from 'react'; // React의 useMemo를 import합니다.
import { layoutConfigMap, type PageLayoutConfig } from './layout.config';

interface StoredSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeFilters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    suggestionGroups: string;
    onToggleFiltered: () => void;
    onCreateProblemSet: () => void;
    selectedCount: number;
}

interface RegisteredPageActions {
  openRegisterSidebar: () => void;
  openSettingsSidebar: () => void;
  openPromptSidebar: () => void;
  onClose: () => void;
}

interface LayoutState {
  rightSidebarContent: ReactNode | null;
  currentPageConfig: PageLayoutConfig;
  pageActions: Partial<RegisteredPageActions>;
  studentSearchProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarContent: (content: ReactNode | null) => void;
  updateLayoutForPath: (path: string) => void;
  registerPageActions: (actions: Partial<RegisteredPageActions>) => void;
  setStudentSearchProps: (props: StoredSearchProps | null) => void;
}

const initialPageActions: Partial<RegisteredPageActions> = {
    openRegisterSidebar: () => console.warn('openRegisterSidebar action not registered.'),
    openSettingsSidebar: () => console.warn('openSettingsSidebar action not registered.'),
    openPromptSidebar: () => console.warn('openPromptSidebar action not registered.'),
    onClose: () => console.warn('onClose action not registered.'),
};

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebarContent: null,
  currentPageConfig: {},
  pageActions: initialPageActions,
  studentSearchProps: null,
  
  setRightSidebarContent: (content) => set({ rightSidebarContent: content }),

  updateLayoutForPath: (path) => {
    const newConfig = Object.entries(layoutConfigMap)
        .find(([key]) => path.startsWith(key))?.[1] || {};
    
    set({ currentPageConfig: newConfig });
  },

  registerPageActions: (actions) => {
    set(state => ({
        pageActions: { ...state.pageActions, ...actions }
    }));
  },
  
  setStudentSearchProps: (props) => set({ studentSearchProps: props }),
}));


export const useSidebarTriggers = () => {
    const currentPageConfig = useLayoutStore(state => state.currentPageConfig);
    const pageActions = useLayoutStore(state => state.pageActions);

    const triggers = useMemo(() => {
        const result: any = { onClose: pageActions.onClose };

        if (currentPageConfig.sidebarButtons?.register) {
            result.registerTrigger = {
                onClick: pageActions.openRegisterSidebar,
                tooltip: currentPageConfig.sidebarButtons.register.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.settings) {
            result.settingsTrigger = {
                onClick: pageActions.openSettingsSidebar,
                tooltip: currentPageConfig.sidebarButtons.settings.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.prompt) {
            result.promptTrigger = {
                onClick: pageActions.openPromptSidebar,
                tooltip: currentPageConfig.sidebarButtons.prompt.tooltip,
            };
        }
        return result;
    }, [currentPageConfig, pageActions]); // 의존성 배열에 상태들을 넣어줍니다.

    return triggers;
};


export const selectRightSidebarContent = (state: LayoutState) => state.rightSidebarContent;
export const selectStudentSearchProps = (state: LayoutState) => state.studentSearchProps;