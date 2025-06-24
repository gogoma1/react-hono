import { create } from 'zustand';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
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


interface RightSidebarState {
    content: ReactNode | null;
    isExtraWide: boolean;
}

interface LayoutState {
  rightSidebar: RightSidebarState; 
  currentPageConfig: PageLayoutConfig;
  pageActions: Partial<RegisteredPageActions>;
  studentSearchProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarConfig: (config: { content: ReactNode | null, isExtraWide?: boolean }) => void;
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
  rightSidebar: {
    content: null,
    isExtraWide: false,
  },
  currentPageConfig: {},
  pageActions: initialPageActions,
  studentSearchProps: null,
  
  setRightSidebarConfig: (config) => set({ 
    rightSidebar: {
      content: config.content,
      isExtraWide: config.isExtraWide ?? false
    } 
  }),

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


export const selectRightSidebarConfig = (state: LayoutState) => state.rightSidebar;
export const selectStudentSearchProps = (state: LayoutState) => state.studentSearchProps;


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
    }, [currentPageConfig, pageActions]);

    return triggers;
};