import { create } from 'zustand';
import { useMemo } from 'react';
import { layoutConfigMap, type PageLayoutConfig, type SidebarButtonType } from './layout.config';
import type { Student } from '../../entities/student/model/types';
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

// [1. 타입 수정] openTeacherRegisterSidebar 액션 추가
export interface RegisteredPageActions {
  openRegisterSidebar: () => void;
  openTeacherRegisterSidebar: () => void; // 신규 액션
  openSettingsSidebar: () => void;
  openPromptSidebar: () => void;
  openLatexHelpSidebar: () => void;
  openSearchSidebar: () => void; 
  openJsonViewSidebar: () => void;
  openSelectedStudentsSidebar: () => void;
  openEditSidebar: (student: Student) => void;
  onClose: () => void;
}

// [2. 타입 수정] teacherRegister 콘텐츠 타입 추가
type RightSidebarContent =
  | { type: 'closed' }
  | { type: 'register'; academyId: string }
  | { type: 'teacherRegister'; academyId: string } // 신규 콘텐츠 타입
  | { type: 'edit'; student: Student; academyId: string }
  | { type: 'settings' }
  | { type: 'prompt'; props?: { workbenchContent?: string } }
  | { type: 'problemEditor'; props: { onProblemChange: (updatedProblem: ProcessedProblem) => void; onSave: (problem: ProcessedProblem) => void; onRevert: (problemId: string) => void; onClose: () => void; isSaving: boolean; } }
  | { type: 'latexHelp' }
  | { type: 'jsonViewer'; props: { problems: ProcessedProblem[] } }
  | { type: 'selectedStudents' };

interface RightSidebarState {
    content: RightSidebarContent;
    isExtraWide: boolean;
}

export interface SidebarTrigger {
    type: SidebarButtonType;
    tooltip: string;
}

interface LayoutState {
  rightSidebar: RightSidebarState; 
  availableTriggers: SidebarTrigger[];
  pageActions: Partial<RegisteredPageActions>;
  searchBoxProps: StoredSearchProps | null;
}

type PageActionType = keyof RegisteredPageActions;

interface LayoutActions {
  setRightSidebarContent: (content: RightSidebarContent, isExtraWide?: boolean) => void;
  closeRightSidebar: () => void;
  updateLayoutForPath: (path: string) => void;
  registerPageActions: (actions: Partial<RegisteredPageActions>) => void;
  unregisterPageActions: (actionNames: PageActionType[]) => void;
  setSearchBoxProps: (props: StoredSearchProps | null) => void;
}

// [3. 초기값 수정] openTeacherRegisterSidebar 초기 액션 추가
const initialPageActions: Partial<RegisteredPageActions> = {
    openRegisterSidebar: () => console.warn('openRegisterSidebar action not registered.'),
    openTeacherRegisterSidebar: () => console.warn('openTeacherRegisterSidebar action not registered.'), // 신규 초기값
    openSettingsSidebar: () => console.warn('openSettingsSidebar action not registered.'),
    openPromptSidebar: () => console.warn('openPromptSidebar action not registered.'),
    openLatexHelpSidebar: () => console.warn('openLatexHelpSidebar action not registered.'),
    openSearchSidebar: () => console.warn('openSearchSidebar action not registered.'),
    openJsonViewSidebar: () => console.warn('openJsonViewSidebar action not registered.'),
    openSelectedStudentsSidebar: () => console.warn('openSelectedStudentsSidebar action not registered.'),
    openEditSidebar: (student: Student) => console.warn('openEditSidebar action not registered for student:', student.id),
    onClose: () => console.warn('onClose action not registered.'),
};

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebar: {
    content: { type: 'closed' },
    isExtraWide: false,
  },
  availableTriggers: [],
  pageActions: initialPageActions,
  searchBoxProps: null,

  setRightSidebarContent: (content, isExtraWide = false) => set({ rightSidebar: { content, isExtraWide } }),
  closeRightSidebar: () => set({ rightSidebar: { content: { type: 'closed' }, isExtraWide: false } }),
  
  updateLayoutForPath: (path) => {
    const config = Object.entries(layoutConfigMap)
        .find(([key]) => path.startsWith(key))?.[1] || {};
    
    const triggers: SidebarTrigger[] = [];
    if (config.sidebarButtons) {
        Object.keys(config.sidebarButtons).forEach(key => {
            const buttonType = key as SidebarButtonType;
            const buttonConfig = config.sidebarButtons?.[buttonType];
            if (buttonConfig) {
                triggers.push({ type: buttonType, tooltip: buttonConfig.tooltip });
            }
        });
    }
    set({ availableTriggers: triggers });
  },

  registerPageActions: (actions) => {
    set(state => ({
        pageActions: { ...state.pageActions, ...actions }
    }));
  },
  
  unregisterPageActions: (actionNames) => {
    set(state => {
        const newPageActions = { ...state.pageActions };
        actionNames.forEach(name => {
            if (initialPageActions[name]) {
                (newPageActions as any)[name] = initialPageActions[name];
            }
        });
        return { pageActions: newPageActions };
    });
  },

  setSearchBoxProps: (props) => set({ searchBoxProps: props }),
}));

export const selectRightSidebarConfig = (state: LayoutState) => state.rightSidebar;
export const selectSearchBoxProps = (state: LayoutState) => state.searchBoxProps;

export const useSidebarTriggers = () => {
    const { availableTriggers, pageActions } = useLayoutStore();

    return useMemo(() => {
        // [4. 훅 수정] actionMap에 openTeacherRegisterSidebar 추가
        const actionMap: Record<SidebarButtonType, (() => void) | undefined> = {
            register: pageActions.openRegisterSidebar,
            teacherRegister: pageActions.openTeacherRegisterSidebar, // 신규 액션 맵핑
            settings: pageActions.openSettingsSidebar,
            prompt: pageActions.openPromptSidebar,
            latexHelp: pageActions.openLatexHelpSidebar,
            search: pageActions.openSearchSidebar,
            jsonView: pageActions.openJsonViewSidebar,
            selectedStudents: pageActions.openSelectedStudentsSidebar,
        };

        const triggers = availableTriggers.map(triggerInfo => {
            const action = actionMap[triggerInfo.type];
            return action ? { ...triggerInfo, onClick: action } : null;
        }).filter((t): t is (SidebarTrigger & { onClick: () => void; }) => t !== null);
        
        return {
            onClose: pageActions.onClose,
            triggers: triggers,
        };
    }, [availableTriggers, pageActions]);
};