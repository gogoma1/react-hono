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

export interface RegisteredPageActions {
  openRegisterSidebar: () => void;
  openTeacherRegisterSidebar: () => void;
  openSettingsSidebar: () => void;
  openPromptSidebar: () => void;
  openLatexHelpSidebar: () => void;
  openSearchSidebar: () => void; 
  openJsonViewSidebar: () => void;
  openSelectedStudentsSidebar: () => void;
  openMyLibrarySidebar: () => void; // [신규] '내 서재' 사이드바 열기 액션 추가
  openEditSidebar: (student: Student) => void;
  onClose: () => void;
}

type RightSidebarContent =
  | { type: 'closed' }
  | { type: 'register'; academyId: string }
  | { type: 'teacherRegister'; academyId: string }
  | { type: 'edit'; student: Student; academyId: string }
  | { type: 'settings' }
  | { type: 'prompt'; props?: { workbenchContent?: string } }
  | { type: 'problemEditor'; props: { onProblemChange: (updatedProblem: ProcessedProblem) => void; onSave: (problem: ProcessedProblem) => void; onRevert: (problemId: string) => void; onClose: () => void; isSaving: boolean; } }
  | { type: 'latexHelp' }
  | { type: 'jsonViewer'; props: { problems: ProcessedProblem[] } }
  | { type: 'selectedStudents' }
  | { type: 'myLibrary' }; // [신규] '내 서재' 콘텐츠 타입 추가

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

const initialPageActions: Partial<RegisteredPageActions> = {
    openRegisterSidebar: () => console.warn('openRegisterSidebar action not registered.'),
    openTeacherRegisterSidebar: () => console.warn('openTeacherRegisterSidebar action not registered.'),
    openSettingsSidebar: () => console.warn('openSettingsSidebar action not registered.'),
    openPromptSidebar: () => console.warn('openPromptSidebar action not registered.'),
    openLatexHelpSidebar: () => console.warn('openLatexHelpSidebar action not registered.'),
    openSearchSidebar: () => console.warn('openSearchSidebar action not registered.'),
    openJsonViewSidebar: () => console.warn('openJsonViewSidebar action not registered.'),
    openSelectedStudentsSidebar: () => console.warn('openSelectedStudentsSidebar action not registered.'),
    openMyLibrarySidebar: () => console.warn('openMyLibrarySidebar action not registered.'), // [신규] 초기 액션 정의
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
        const actionMap: Record<SidebarButtonType, (() => void) | undefined> = {
            register: pageActions.openRegisterSidebar,
            teacherRegister: pageActions.openTeacherRegisterSidebar,
            settings: pageActions.openSettingsSidebar,
            prompt: pageActions.openPromptSidebar,
            latexHelp: pageActions.openLatexHelpSidebar,
            search: pageActions.openSearchSidebar,
            jsonView: pageActions.openJsonViewSidebar,
            selectedStudents: pageActions.openSelectedStudentsSidebar,
            myLibrary: pageActions.openMyLibrarySidebar, // [신규] 액션과 버튼 타입 맵핑
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