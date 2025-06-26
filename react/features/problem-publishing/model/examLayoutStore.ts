import { create } from 'zustand';
import type { ProcessedProblem } from './problemPublishingStore';
import { calculateInitialLayout, recalculateProblemLayout, recalculateSolutionLayout, type LayoutItem, type ProblemPlacementInfo } from './examLayoutEngine';
import { useProblemPublishingStore } from './problemPublishingStore';

let itemHeightsMap = new Map<string, number>();
let debounceTimer: number | null = null;

interface ExamUIOptions {
    problemBoxMinHeight: number;
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
    startLayoutCalculation: (selectedProblems: ProcessedProblem[]) => void;
    resetLayout: () => void;
    updateMinHeightAndRecalculate: (height: number) => void;
    setBaseFontSize: (size: string) => void;
    setContentFontSizeEm: (size: number) => void;
    setUseSequentialNumbering: (use: boolean) => void;
    setDraggingControl: (isDragging: boolean) => void;
    forceRecalculateLayout: () => void;
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

const runDebouncedRecalculation = (get: () => ExamLayoutState & ExamLayoutActions, set: (partial: Partial<ExamLayoutState & ExamLayoutActions>) => void) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(() => {
        // [수정] 이 함수는 디바운스된 재계산만 담당하므로, 상태 체크는 호출하는 쪽에서 처리하는 것이 더 명확합니다.
        // 또는 get()을 통해 항상 최신 상태를 가져와야 합니다.
        const state = get();
        const isEditing = !!useProblemPublishingStore.getState().editingProblemId;

        if (state.isLayoutFinalized || state.isDraggingControl || isEditing) {
             console.log("[LOG] examLayoutStore: 레이아웃이 확정되었거나, 드래그 중이거나, 편집 중이므로 디바운스된 재계산을 건너뜁니다.", {
                isLayoutFinalized: state.isLayoutFinalized,
                isDraggingControl: state.isDraggingControl,
                isEditing
            });
            return;
        }

        console.log("[LOG] examLayoutStore: ⏳ 디바운스 타이머 실행! 레이아웃 재계산 시작.");
        const { problemsForLayout, problemBoxMinHeight } = state;
        if (problemsForLayout.length === 0) {
            console.log("[LOG] examLayoutStore: problemsForLayout이 비어있어 재계산 중단.");
            return;
        }

        console.log("[LOG] examLayoutStore: 🚀 Debounced: RE-calculating ALL layouts based on new heights.");

        const problemResult = recalculateProblemLayout(problemsForLayout, itemHeightsMap, problemBoxMinHeight);
        const solutionResult = recalculateSolutionLayout(problemsForLayout, itemHeightsMap);

        set({
            distributedPages: problemResult.pages,
            placementMap: problemResult.placements,
            distributedSolutionPages: solutionResult.pages,
            solutionPlacementMap: solutionResult.placements,
            isLayoutFinalized: true, // 재계산 후에는 레이아웃을 확정합니다.
        });

        logLayoutResult(problemsForLayout, problemResult.placements, solutionResult.placements);
    }, 500); // 디바운스 시간
};


export const useExamLayoutStore = create<ExamLayoutState & ExamLayoutActions>((set, get) => ({
    problemBoxMinHeight: 31,
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
        // [핵심 수정] isLayoutFinalized 체크를 제거합니다.
        // ResizeObserver가 주는 높이 정보는 항상 최신이고 유효하므로, 무조건 맵에 저장하고 재계산을 시도합니다.
        // 재계산 실행 여부는 runDebouncedRecalculation 내부에서 최신 상태를 보고 결정합니다.
        itemHeightsMap.set(uniqueId, height);
        runDebouncedRecalculation(get, set);
    },
    
    forceRecalculateLayout: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        console.log("[LOG] examLayoutStore: ⚡️ 강제 레이아웃 재계산을 시작합니다.");
        const { problemsForLayout, problemBoxMinHeight } = get();
        if (problemsForLayout.length === 0) return;

        const problemResult = recalculateProblemLayout(problemsForLayout, itemHeightsMap, problemBoxMinHeight);
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

    startLayoutCalculation: (selectedProblems) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        const { problemBoxMinHeight } = get();

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
            isLayoutFinalized: false, // 최초 계산 시작 시 플래그를 false로 설정
        });

        logLayoutResult(selectedProblems, problems.placements, solutions.placements);
    },
    
    // [핵심 수정] 사용자가 컨트롤 패널에서 값을 변경하면, isLayoutFinalized를 false로 만들어
    // 높이 측정이 다시 동작하도록 유도합니다.
    updateMinHeightAndRecalculate: (height) => {
        set({ problemBoxMinHeight: height, isLayoutFinalized: false });
        runDebouncedRecalculation(get, set);
    },

    setBaseFontSize: (size) => {
        set({ baseFontSize: size, isLayoutFinalized: false });
        runDebouncedRecalculation(get, set);
    },
    setContentFontSizeEm: (size) => {
        set({ contentFontSizeEm: size, isLayoutFinalized: false });
        runDebouncedRecalculation(get, set);
    },
    setUseSequentialNumbering: (use) => set({ useSequentialNumbering: use }),
}));