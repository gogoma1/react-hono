import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const breakpoints = { mobile: 768, tablet: 1024 };
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

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
    isRightSidebarExtraWide: boolean;
    setRightSidebarExtraWide: (isWide: boolean) => void;
    isLeftSidebarExpanded: boolean;
    toggleLeftSidebar: () => void;
    setLeftSidebarExpanded: (expanded: boolean) => void;
    mobileSidebarType: 'left' | 'right' | null;
    openMobileSidebar: (type: 'left' | 'right') => void;
    closeMobileSidebar: () => void;
    currentBreakpoint: Breakpoint;
    updateBreakpoint: () => void;
}

const log = (action: string, payload?: any) => {
    console.log(`[UIStore] Action: ${action}`, payload !== undefined ? { payload } : '');
};

export const useUIStore = create(
    subscribeWithSelector<UIState>(
        (set, get) => ({
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
    
            isRightSidebarExtraWide: false,
            setRightSidebarExtraWide: (isWide) => {
                log('setRightSidebarExtraWide', isWide);
                set({ isRightSidebarExtraWide: isWide });
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
        })
    )
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