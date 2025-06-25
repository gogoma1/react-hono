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
  openEditSidebar: (student: any) => void;
  onClose: () => void;
}

// 사이드바 콘텐츠 타입을 정의합니다.
interface SidebarContentConfig {
    // [수정] 'edit' 타입을 추가합니다.
    type: 'register' | 'settings' | 'prompt' | 'problemEditor' | 'edit' | null;
    props?: Record<string, any>; // problemId, student 등을 전달하기 위한 props
}

interface RightSidebarState {
    contentConfig: SidebarContentConfig; // ReactNode 대신 contentConfig를 사용합니다.
    isExtraWide: boolean;
}

interface LayoutState {
  rightSidebar: RightSidebarState; 
  currentPageConfig: PageLayoutConfig;
  pageActions: Partial<RegisteredPageActions>;
  studentSearchProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarConfig: (config: { contentConfig: SidebarContentConfig, isExtraWide?: boolean }) => void;
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

export const useLayoutStore = create<LayoutState & LayoutActions>((set, get) => ({
  rightSidebar: {
    contentConfig: { type: null }, // 초기 상태 변경
    isExtraWide: false,
  },
  currentPageConfig: {},
  pageActions: initialPageActions,
  studentSearchProps: null,
  
  setRightSidebarConfig: (config) => {
    const currentState = get().rightSidebar;
    // 상태가 실제로 변경되었을 때만 업데이트하여 불필요한 리렌더링을 방지합니다.
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