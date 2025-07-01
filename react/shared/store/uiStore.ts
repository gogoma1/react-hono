import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { PROBLEM_PUBLISHING_COLUMN_CONFIG } from '../hooks/useColumnPermissions';

const breakpoints = {
    mobile: 768,
    tablet: 1024,
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export type ProblemPublishingColumnKey = typeof PROBLEM_PUBLISHING_COLUMN_CONFIG[number]['key'];

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
    columnVisibility: Record<string, boolean>;
    toggleColumnVisibility: (key: string) => void;
    setColumnVisibility: (visibility: Record<string, boolean>) => void;
    problemPublishingColumnOrder: ProblemPublishingColumnKey[];
    setProblemPublishingColumnOrder: (newOrder: ProblemPublishingColumnKey[]) => void;
}

type PersistedUIState = {
    columnVisibility: Record<string, boolean>;
    problemPublishingColumnOrder: ProblemPublishingColumnKey[];
}

const log = (action: string, payload?: any) => {
    console.log(`[UIStore] Action: ${action}`, payload !== undefined ? { payload } : '');
};


export const useUIStore = create(
    subscribeWithSelector(
        persist<UIState, [], [], PersistedUIState>(
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
        
                columnVisibility: {},
                toggleColumnVisibility: (key: string) => {
                    log('toggleColumnVisibility', key);
                    set((state) => {
                        const config = PROBLEM_PUBLISHING_COLUMN_CONFIG.find(c => c.key === key);
                        const isCurrentlyVisible = state.columnVisibility[key] ?? !(config?.defaultHidden ?? false);
                        return {
                            columnVisibility: {
                                ...state.columnVisibility,
                                [key]: !isCurrentlyVisible,
                            }
                        };
                    });
                },
                setColumnVisibility: (visibility) => {
                    log('setColumnVisibility', visibility);
                    set({ columnVisibility: visibility });
                },
        
                problemPublishingColumnOrder: PROBLEM_PUBLISHING_COLUMN_CONFIG.map(col => col.key),
                setProblemPublishingColumnOrder: (newOrder: ProblemPublishingColumnKey[]) => {
                    log('setProblemPublishingColumnOrder', newOrder);
                    set({ problemPublishingColumnOrder: newOrder });
                },
            }),
            {
                name: 'ui-settings-storage',
                storage: createJSONStorage(() => localStorage), 
                
                partialize: (state): PersistedUIState => ({
                    columnVisibility: state.columnVisibility,
                    problemPublishingColumnOrder: state.problemPublishingColumnOrder,
                }),

                merge: (persistedState, currentState) => {
                    const typedPersistedState = persistedState as Partial<UIState>;
                    
                    const persistedOrder = typedPersistedState.problemPublishingColumnOrder || [];
                    const persistedOrderSet = new Set(persistedOrder);
                    const newColumnsInCurrentState = currentState.problemPublishingColumnOrder.filter(
                        key => !persistedOrderSet.has(key)
                    );

                    return {
                        ...currentState,
                        ...typedPersistedState,
                        problemPublishingColumnOrder: [...persistedOrder, ...newColumnsInCurrentState],
                    };
                },

                onRehydrateStorage: () => (state) => {
                    if (state) {
                        console.log('[UIStore] Hydration finished from localStorage.');
                    }
                }
            }
        )
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