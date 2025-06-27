import { create } from 'zustand';
import type { ProcessedProblem } from './problemPublishingStore';
import { calculateInitialLayout, recalculateProblemLayout, recalculateSolutionLayout, type LayoutItem, type ProblemPlacementInfo } from './examLayoutEngine';
import { useProblemPublishingStore } from './problemPublishingStore';

let itemHeightsMap = new Map<string, number>();
let debounceTimer: number | null = null;

interface ExamUIOptions {
    baseFontSize: string;
    contentFontSizeEm: number;
    useSequentialNumbering: boolean;
}

interface ExamLayoutState extends ExamUIOptions {
    distributedPages: LayoutItem[][];
    placementMap: Map<string, ProblemPlacementInfo>;
    distributedSolutionPages: LayoutItem[][];
    solutionPlacementMap: Map<string, ProblemPlacementInfo>;
    problemsForLayout: ProcessedProblem[];
    isLayoutFinalized: boolean; 
    isDraggingControl: boolean;
}

interface ExamLayoutActions {
    setItemHeight: (uniqueId: string, height: number) => void;
    startLayoutCalculation: (selectedProblems: ProcessedProblem[], problemBoxMinHeight: number) => void;
    resetLayout: () => void;
    setBaseFontSize: (size: string) => void;
    setContentFontSizeEm: (size: number) => void;
    setUseSequentialNumbering: (use: boolean) => void;
    setDraggingControl: (isDragging: boolean) => void;
    forceRecalculateLayout: (minHeight: number) => void;
}

const logLayoutResult = (problems: ProcessedProblem[], problemPlacements: Map<string, ProblemPlacementInfo>, solutionPlacements: Map<string, ProblemPlacementInfo>) => {
    console.groupCollapsed('--- Layout Calculation Result ---');
    
    problemPlacements.forEach((placement, uniqueId) => {
        const problem = problems.find(p => p.uniqueId === uniqueId);
        const height = itemHeightsMap.get(uniqueId) || 'N/A';
        if (problem) {
            console.log(
                `[Problem] Num: ${problem.display_question_number}, Page: ${placement.page}, Col: ${placement.column}, Height: ${typeof height === 'number' ? height.toFixed(1) + 'px' : height}`
            );
        }
    });

    solutionPlacements.forEach((placement, uniqueId) => {
        const parentProblemId = uniqueId.split('-sol-')[0];
        const problem = problems.find(p => p.uniqueId === parentProblemId);
        const height = itemHeightsMap.get(uniqueId) || 'N/A';
        if (problem) {
            console.log(
                `  [Solution Chunk] For: ${problem.display_question_number}, Page: ${placement.page}, Col: ${placement.column}, Height: ${typeof height === 'number' ? height.toFixed(1) + 'px' : height}`
            );
        }
    });

    console.groupEnd();
};

const runDebouncedRecalculation = (get: () => ExamLayoutState & ExamLayoutActions) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(() => {
        const state = get();
        const isEditing = !!useProblemPublishingStore.getState().editingProblemId;

        if (state.isLayoutFinalized || state.isDraggingControl || isEditing) {
             console.log("[LOG] examLayoutStore: 레이아웃이 확정되었거나, 드래그 중이거나, 편집 중이므로 디바운스된 재계산을 건너뜁니다.");
            return;
        }

    }, 500);
};

// [수정] export const useLayoutStore -> export const useExamLayoutStore
export const useExamLayoutStore = create<ExamLayoutState & ExamLayoutActions>((set, get) => ({
    baseFontSize: '12px',
    contentFontSizeEm: 1,
    useSequentialNumbering: false,
    
    distributedPages: [],
    placementMap: new Map(),
    distributedSolutionPages: [],
    solutionPlacementMap: new Map(),
    problemsForLayout: [],
    isLayoutFinalized: true,
    isDraggingControl: false,

    setDraggingControl: (isDragging) => set({ isDraggingControl: isDragging }),

    setItemHeight: (uniqueId, height) => {
        const oldHeight = itemHeightsMap.get(uniqueId);
        if (oldHeight !== height) {
            itemHeightsMap.set(uniqueId, height);
        }
    },
    
    forceRecalculateLayout: (minHeight) => {
        if (get().isDraggingControl) return;
        if (debounceTimer) clearTimeout(debounceTimer);

        console.log(`[LOG] examLayoutStore: ⚡️ 강제 레이아웃 재계산 (minHeight: ${minHeight})`);
        const { problemsForLayout } = get();
        if (problemsForLayout.length === 0) return;

        const problemResult = recalculateProblemLayout(problemsForLayout, itemHeightsMap, minHeight);
        const solutionResult = recalculateSolutionLayout(problemsForLayout, itemHeightsMap);

        set({
            distributedPages: problemResult.pages,
            placementMap: problemResult.placements,
            distributedSolutionPages: solutionResult.pages,
            solutionPlacementMap: solutionResult.placements,
            isLayoutFinalized: true,
        });
        logLayoutResult(problemsForLayout, problemResult.placements, solutionResult.placements);
    },

    resetLayout: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        itemHeightsMap = new Map<string, number>();
        set({
            distributedPages: [],
            placementMap: new Map(),
            distributedSolutionPages: [],
            solutionPlacementMap: new Map(),
            problemsForLayout: [],
            isLayoutFinalized: true,
        });
    },

    startLayoutCalculation: (selectedProblems, problemBoxMinHeight) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        
        const newHeightsMap = new Map<string, number>();
        const selectedIds = new Set(selectedProblems.map(p => p.uniqueId));
        itemHeightsMap.forEach((height, id) => {
            const problemId = id.includes('-sol-') ? id.split('-sol-')[0] : id;
            if (selectedIds.has(problemId)) {
                newHeightsMap.set(id, height);
            }
        });
        itemHeightsMap = newHeightsMap;

        const { problems, solutions } = calculateInitialLayout(selectedProblems, problemBoxMinHeight, itemHeightsMap);
        
        set({ 
            problemsForLayout: selectedProblems,
            distributedPages: problems.pages,
            placementMap: problems.placements,
            distributedSolutionPages: solutions.pages,
            solutionPlacementMap: solutions.placements,
            isLayoutFinalized: false,
        });

        logLayoutResult(selectedProblems, problems.placements, solutions.placements);
    },

    setBaseFontSize: (size) => {
        set({ baseFontSize: size, isLayoutFinalized: false });
        runDebouncedRecalculation(get);
    },
    setContentFontSizeEm: (size) => {
        set({ contentFontSizeEm: size, isLayoutFinalized: false });
        runDebouncedRecalculation(get);
    },
    setUseSequentialNumbering: (use) => set({ useSequentialNumbering: use }),
}));