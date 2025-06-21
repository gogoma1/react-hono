import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const breakpoints = {
    mobile: 768,
    tablet: 1024,
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

// [신규] 모든 토글 가능한 학생 테이블 컬럼의 키 목록
const allStudentTableColumns: string[] = [
    'grade', 'subject', 'status', 'teacher', 'student_phone', 
    'guardian_phone', 'school_name', 'tuition', 'admission_date', 'discharge_date'
];

// [신규] 컬럼 가시성의 초기 상태 (모두 보이도록 설정)
const initialColumnVisibility = allStudentTableColumns.reduce((acc, key) => {
    acc[key] = true;
    return acc;
}, {} as Record<string, boolean>);


const getCurrentBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= breakpoints.mobile) return 'mobile';
    if (width <= breakpoints.tablet) return 'tablet';
    return 'desktop';
};

export interface UIState {
    isRightSidebarExpanded: boolean;
    toggleRightSidebar: () => void;
    setRightSidebarExpanded: (expanded: boolean) => void;
    isLeftSidebarExpanded: boolean;
    toggleLeftSidebar: () => void;
    setLeftSidebarExpanded: (expanded: boolean) => void;
    mobileSidebarType: 'left' | 'right' | null;
    openMobileSidebar: (type: 'left' | 'right') => void;
    closeMobileSidebar: () => void;
    currentBreakpoint: Breakpoint;
    updateBreakpoint: () => void;
    // [신규] 컬럼 가시성 상태 및 액션 추가
    columnVisibility: Record<string, boolean>;
    toggleColumnVisibility: (key: string) => void;
}

const log = (action: string, payload?: any) => {
    console.log(`[UIStore] Action: ${action}`, payload !== undefined ? { payload } : '');
};


export const useUIStore = create(
    subscribeWithSelector<UIState>((set, get) => ({
        isRightSidebarExpanded: false,
        toggleRightSidebar: () => {
            log('toggleRightSidebar');
            const currentBp = get().currentBreakpoint;
            if (currentBp === 'mobile') {
                if (get().mobileSidebarType === 'right') {
                    get().closeMobileSidebar();
                } else {
                    get().openMobileSidebar('right');
                }
            } else {
                set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded }));
            }
        },
        setRightSidebarExpanded: (expanded: boolean) => {
            log('setRightSidebarExpanded', expanded);
            const { currentBreakpoint, openMobileSidebar, closeMobileSidebar } = get();
            if (currentBreakpoint === 'mobile') {
                if (expanded) {
                    openMobileSidebar('right');
                } else {
                    closeMobileSidebar();
                }
            } else {
                set({ isRightSidebarExpanded: expanded });
            }
        },

        isLeftSidebarExpanded: true,
        toggleLeftSidebar: () => {
            log('toggleLeftSidebar');
            const currentBp = get().currentBreakpoint;
            if (currentBp === 'mobile') {
                if (get().mobileSidebarType === 'left') {
                    get().closeMobileSidebar();
                } else {
                    get().openMobileSidebar('left');
                }
            } else {
                set((state) => ({ isLeftSidebarExpanded: !state.isLeftSidebarExpanded }));
            }
        },
        setLeftSidebarExpanded: (expanded) => {
            log('setLeftSidebarExpanded', expanded);
            set({ isLeftSidebarExpanded: expanded });
        },

        mobileSidebarType: null,
        openMobileSidebar: (type) => {
            log('openMobileSidebar', type);
            set({ mobileSidebarType: type });
        },
        closeMobileSidebar: () => {
            if (get().mobileSidebarType !== null) {
                log('closeMobileSidebar');
                set({ mobileSidebarType: null });
            }
        },
        
        currentBreakpoint: getCurrentBreakpoint(),
        updateBreakpoint: () => {
            const newBreakpoint = getCurrentBreakpoint();
            const oldBreakpoint = get().currentBreakpoint;
            if (newBreakpoint !== oldBreakpoint) {
                log('updateBreakpoint', { from: oldBreakpoint, to: newBreakpoint });
                set({ currentBreakpoint: newBreakpoint });
                get().closeMobileSidebar();

                if (newBreakpoint === 'desktop') {
                    get().setLeftSidebarExpanded(true);
                } else if (newBreakpoint === 'tablet') {
                    get().setLeftSidebarExpanded(false);
                }
            }
        },

        // [신규] 컬럼 가시성 상태 및 액션 구현
        columnVisibility: initialColumnVisibility,
        toggleColumnVisibility: (key: string) => {
            log('toggleColumnVisibility', key);
            set((state) => ({
                columnVisibility: {
                    ...state.columnVisibility,
                    [key]: !state.columnVisibility[key],
                }
            }));
        },
    }))
);

if (typeof window !== 'undefined') {
    const { updateBreakpoint, setLeftSidebarExpanded, currentBreakpoint } = useUIStore.getState();

    window.addEventListener('resize', updateBreakpoint);

    const initialBp = currentBreakpoint;
    if (initialBp === 'desktop') {
        setLeftSidebarExpanded(true);
    } else {
        setLeftSidebarExpanded(false);
    }
    useUIStore.getState().updateBreakpoint();
}