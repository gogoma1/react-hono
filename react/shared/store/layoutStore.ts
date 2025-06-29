import { create } from 'zustand';
import { useMemo } from 'react';
import { layoutConfigMap, type PageLayoutConfig } from './layout.config';
import type { Student } from '../../entities/student/model/useStudentDataWithRQ';
import type { ProcessedProblem } from '../../features/problem-publishing'; // [추가] 타입 임포트

/**
 * [수정] TableSearch 컴포넌트가 필요로 하는 모든 props를 포함하는 완전한 인터페이스.
 * 각 페이지의 훅은 이 인터페이스에 맞는 객체를 만들어 스토어에 저장하게 됩니다.
 */
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
  openJsonViewSidebar: () => void; // [추가] 파라미터 없음
  openEditSidebar: (student: Student) => void;
  onClose: () => void;
}

interface SidebarContentConfig {
    type: 'register' | 'settings' | 'prompt' | 'problemEditor' | 'edit' | 'latexHelp' | 'jsonViewer' | null; // [추가] 'jsonViewer'
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
    openJsonViewSidebar: () => console.warn('openJsonViewSidebar action not registered.'), // [추가] 초기 액션
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

  setRightSidebarConfig: (config) => {
    const currentState = get().rightSidebar;
    if (!config.contentConfig) {
        if (currentState.contentConfig.type !== null) {
            set({ rightSidebar: { contentConfig: { type: null }, isExtraWide: false } });
        }
        return;
    }

    if (
        currentState.contentConfig.type !== config.contentConfig.type ||
        JSON.stringify(currentState.contentConfig.props) !== JSON.stringify(config.contentConfig.props) ||
        currentState.isExtraWide !== (config.isExtraWide ?? false)
    ) {
        set({ 
            rightSidebar: {
                contentConfig: config.contentConfig,
                isExtraWide: config.isExtraWide ?? false
            } 
        });
    }
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
    jsonViewTrigger?: SidebarTrigger; // [추가]
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
        // [추가] JSON 뷰어 트리거 로직
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