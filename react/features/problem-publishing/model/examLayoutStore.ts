import { create } from 'zustand';
import type { ProcessedProblem } from './problemPublishingStore';
import { calculateInitialLayout, recalculateProblemLayout, recalculateSolutionLayout, type LayoutItem, type ProblemPlacementInfo } from './examLayoutEngine';
import { useProblemPublishingStore } from './problemPublishingStore';

let itemHeightsMap = new Map<string, number>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let recalculateTimer: ReturnType<typeof setTimeout> | null = null; // 이 변수는 이제 사용되지 않을 수 있지만, 다른 곳에서 쓸 수 있으니 남겨둡니다.

interface ExamUIOptions {
    baseFontSize: string;
    contentFontSizeEm: number;
    useSequentialNumbering: boolean;
    problemBoxMinHeight: number; 
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
    setProblemBoxMinHeight: (height: number) => void; 
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

    debounceTimer = setTimeout(() => {
        const state = get();
        const isEditing = !!useProblemPublishingStore.getState().editingProblemId;

        if (state.isLayoutFinalized || state.isDraggingControl || isEditing) {
             console.log("[LOG] examLayoutStore: 레이아웃이 확정되었거나, 드래그 중이거나, 편집 중이므로 디바운스된 재계산을 건너뜁니다.");
            return;
        }
        get().forceRecalculateLayout(get().problemBoxMinHeight);
    }, 500);
};

export const useExamLayoutStore = create<ExamLayoutState & ExamLayoutActions>((set, get) => ({
    baseFontSize: '12px',
    contentFontSizeEm: 1,
    useSequentialNumbering: false,
    problemBoxMinHeight: 31, 
    
    distributedPages: [],
    placementMap: new Map(),
    distributedSolutionPages: [],
    solutionPlacementMap: new Map(),
    problemsForLayout: [],
    isLayoutFinalized: true,
    isDraggingControl: false,

    setDraggingControl: (isDragging) => set({ isDraggingControl: isDragging }),

    // [핵심 수정] setItemHeight는 순수하게 높이 맵만 업데이트합니다. 재계산 트리거를 제거합니다.
    setItemHeight: (uniqueId, height) => {
        itemHeightsMap.set(uniqueId, height);
    },
    
    forceRecalculateLayout: (minHeight) => {
        if (get().isDraggingControl) {
            console.log('[LOG] examLayoutStore: 드래그 중이므로 강제 재계산을 건너뜁니다.');
            return;
        }
        if (debounceTimer) clearTimeout(debounceTimer);

        console.log(`[examLayoutStore] ⚡️ 강제 레이아웃 재계산 실행. 적용될 최소 높이: ${minHeight}`);
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
        if (recalculateTimer) clearTimeout(recalculateTimer);
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
        if (recalculateTimer) clearTimeout(recalculateTimer);
        
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
    
    // [핵심 수정] setProblemBoxMinHeight가 재계산을 트리거하되, setTimeout으로 지연을 줍니다.
    setProblemBoxMinHeight: (height) => {
        console.log(`[examLayoutStore] 📥 setProblemBoxMinHeight 액션 호출됨. 새로운 최소 높이: ${height}em`);
        
        set({ problemBoxMinHeight: height, isLayoutFinalized: false });
        
        // 이전에 실행되던 타이머가 있다면 취소합니다.
        if (recalculateTimer) clearTimeout(recalculateTimer);

        // setTimeout으로 재계산을 이벤트 루프의 다음 틱으로 넘깁니다.
        // 이렇게 하면 React 렌더링과 상태 업데이트가 먼저 처리될 시간을 벌 수 있습니다.
        recalculateTimer = setTimeout(() => {
            console.log('[LOG] examLayoutStore: 지연된 재계산 트리거 실행.');
            get().forceRecalculateLayout(get().problemBoxMinHeight);
        }, 10); // 아주 짧은 지연으로 충분합니다.
    },
}));