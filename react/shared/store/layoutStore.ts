import { create } from 'zustand';
import { useMemo } from 'react';
import { layoutConfigMap, type PageLayoutConfig } from './layout.config';
import type { Student } from '../../entities/student/model/useStudentDataWithRQ';
import type { ProcessedProblem } from '../../features/problem-publishing';

export interface StoredSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeFilters: Record<string, Set<string>>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    suggestionGroups: string;
    onToggleFiltered?: () => void;
    onCreateProblemSet?: () => void;
    showActionControls?: boolean;
    onHide?: () => void;
    selectedCount?: number;
    isSelectionComplete?: boolean;
}

interface RegisteredPageActions {
  openRegisterSidebar: () => void;
  openSettingsSidebar: () => void;
  openPromptSidebar: () => void;
  openLatexHelpSidebar: () => void;
  openSearchSidebar: () => void; 
  openJsonViewSidebar: () => void;
  openEditSidebar: (student: Student) => void;
  onClose: () => void;
}

interface SidebarContentConfig {
    type: 'register' | 'settings' | 'prompt' | 'problemEditor' | 'edit' | 'latexHelp' | 'jsonViewer' | null;
    props?: Record<string, any>;
}

interface RightSidebarState {
    contentConfig: SidebarContentConfig;
    isExtraWide: boolean;
}

interface LayoutState {
  rightSidebar: RightSidebarState; 
  currentPageConfig: PageLayoutConfig;
  pageActions: Partial<RegisteredPageActions>;
  searchBoxProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarConfig: (config: { contentConfig: SidebarContentConfig, isExtraWide?: boolean }) => void;
  updateLayoutForPath: (path: string) => void;
  registerPageActions: (actions: Partial<RegisteredPageActions>) => void;
  setSearchBoxProps: (props: StoredSearchProps | null) => void;
}

const initialPageActions: Partial<RegisteredPageActions> = {
    openRegisterSidebar: () => console.warn('openRegisterSidebar action not registered.'),
    openSettingsSidebar: () => console.warn('openSettingsSidebar action not registered.'),
    openPromptSidebar: () => console.warn('openPromptSidebar action not registered.'),
    openLatexHelpSidebar: () => console.warn('openLatexHelpSidebar action not registered.'),
    openSearchSidebar: () => console.warn('openSearchSidebar action not registered.'),
    openJsonViewSidebar: () => console.warn('openJsonViewSidebar action not registered.'),
    openEditSidebar: (student: Student) => console.warn('openEditSidebar action not registered for student:', student.id),
    onClose: () => console.warn('onClose action not registered.'),
};

export const useLayoutStore = create<LayoutState & LayoutActions>((set, get) => ({
  rightSidebar: {
    contentConfig: { type: null },
    isExtraWide: false,
  },
  currentPageConfig: {},
  pageActions: initialPageActions,
  searchBoxProps: null,

  // [핵심 수정] 복잡한 비교 로직을 제거하고 단순한 setter로 변경합니다.
  setRightSidebarConfig: (config) => {
    // props가 없는 경우, 사이드바를 닫는 것으로 간주합니다.
    if (!config.contentConfig || !config.contentConfig.type) {
      set({ rightSidebar: { contentConfig: { type: null }, isExtraWide: false } });
      return;
    }
    
    // 항상 새로운 설정으로 업데이트합니다.
    // 상위 컴포넌트의 useCallback이 참조 안정성을 보장해주는 것을 신뢰합니다.
    set({
      rightSidebar: {
        contentConfig: config.contentConfig,
        isExtraWide: config.isExtraWide ?? false,
      }
    });
  },

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
  
  setSearchBoxProps: (props) => set({ searchBoxProps: props }),
}));


export const selectRightSidebarConfig = (state: LayoutState) => state.rightSidebar;
export const selectSearchBoxProps = (state: LayoutState) => state.searchBoxProps;

interface SidebarTrigger {
    onClick: () => void;
    tooltip: string;
}

interface SidebarTriggers {
    onClose: (() => void) | undefined;
    registerTrigger?: SidebarTrigger;
    searchTrigger?: SidebarTrigger;
    settingsTrigger?: SidebarTrigger;
    promptTrigger?: SidebarTrigger;
    latexHelpTrigger?: SidebarTrigger;
    jsonViewTrigger?: SidebarTrigger;
}

export const useSidebarTriggers = (): SidebarTriggers => {
    const currentPageConfig = useLayoutStore(state => state.currentPageConfig);
    const pageActions = useLayoutStore(state => state.pageActions);

    const triggers = useMemo(() => {
        const result: SidebarTriggers = { onClose: pageActions.onClose };

        if (currentPageConfig.sidebarButtons?.register && pageActions.openRegisterSidebar) {
            result.registerTrigger = {
                onClick: pageActions.openRegisterSidebar,
                tooltip: currentPageConfig.sidebarButtons.register.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.search && pageActions.openSearchSidebar) {
            result.searchTrigger = {
                onClick: pageActions.openSearchSidebar,
                tooltip: currentPageConfig.sidebarButtons.search.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.settings && pageActions.openSettingsSidebar) {
            result.settingsTrigger = {
                onClick: pageActions.openSettingsSidebar,
                tooltip: currentPageConfig.sidebarButtons.settings.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.prompt && pageActions.openPromptSidebar) {
            result.promptTrigger = {
                onClick: pageActions.openPromptSidebar,
                tooltip: currentPageConfig.sidebarButtons.prompt.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.latexHelp && pageActions.openLatexHelpSidebar) {
            result.latexHelpTrigger = {
                onClick: pageActions.openLatexHelpSidebar,
                tooltip: currentPageConfig.sidebarButtons.latexHelp.tooltip,
            };
        }
        if (currentPageConfig.sidebarButtons?.jsonView && pageActions.openJsonViewSidebar) {
            result.jsonViewTrigger = {
                onClick: pageActions.openJsonViewSidebar,
                tooltip: currentPageConfig.sidebarButtons.jsonView.tooltip,
            };
        }
        return result;
    }, [currentPageConfig, pageActions]);

    return triggers;
};