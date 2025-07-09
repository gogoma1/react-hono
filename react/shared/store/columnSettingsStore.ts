import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PROBLEM_PUBLISHING_COLUMN_CONFIG, STUDENT_DASHBOARD_COLUMN_CONFIG } from '../hooks/useColumnPermissions';

// [수정] 불필요한 import를 제거하고, 타입을 여기에 직접 정의합니다.
export type ProblemPublishingColumnKey = typeof PROBLEM_PUBLISHING_COLUMN_CONFIG[number]['key'];
export type StudentDashboardColumnKey = typeof STUDENT_DASHBOARD_COLUMN_CONFIG[number]['key'];


export interface ColumnSettingsState {
    visibility: Record<string, boolean>;
    order: {
        problemPublishing: ProblemPublishingColumnKey[];
        studentDashboard: StudentDashboardColumnKey[];
    };
    toggleVisibility: (key: string) => void;
    setOrder: (page: 'problemPublishing' | 'studentDashboard', newOrder: any[]) => void;
    isInitialized: boolean;
    initializeOrder: (page: 'problemPublishing' | 'studentDashboard', config: readonly { key: any }[]) => void;
}

type PersistedColumnSettingsState = {
    visibility: Record<string, boolean>;
    order: {
        problemPublishing: ProblemPublishingColumnKey[];
        studentDashboard: StudentDashboardColumnKey[];
    };
};

export const useColumnSettingsStore = create<ColumnSettingsState>()(
    persist(
        (set, get) => ({
            visibility: {},
            order: {
                problemPublishing: PROBLEM_PUBLISHING_COLUMN_CONFIG.map(col => col.key),
                studentDashboard: STUDENT_DASHBOARD_COLUMN_CONFIG.map(col => col.key),
            },
            isInitialized: false,

            toggleVisibility: (key) => {
                const config = [...PROBLEM_PUBLISHING_COLUMN_CONFIG, ...STUDENT_DASHBOARD_COLUMN_CONFIG].find(c => c.key === key);
                const isCurrentlyVisible = get().visibility[key] ?? !(config?.defaultHidden ?? false);
                
                set(state => ({
                    visibility: { ...state.visibility, [key]: !isCurrentlyVisible }
                }));
            },

            setOrder: (page, newOrder) => {
                set(state => ({
                    order: { ...state.order, [page]: newOrder }
                }));
            },

            initializeOrder: (page, config) => {
                const state = get();
                if (state.isInitialized) return;

                const currentOrder = state.order[page] || [];
                const currentOrderSet = new Set(currentOrder);
                const configKeys = config.map(c => c.key);
                
                const newKeys = configKeys.filter(key => !currentOrderSet.has(key));
                const finalOrder = [...currentOrder, ...newKeys];

                const finalOrderFiltered = finalOrder.filter(key => configKeys.includes(key));
                
                if (finalOrderFiltered.length !== currentOrder.length || newKeys.length > 0) {
                    get().setOrder(page, finalOrderFiltered);
                }
            },
        }),
        {
            name: 'column-settings-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state): PersistedColumnSettingsState => ({
                visibility: state.visibility,
                order: state.order,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.isInitialized = true;
                }
            }
        }
    )
);