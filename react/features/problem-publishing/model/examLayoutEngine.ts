import type { ProcessedProblem } from './problemPublishingStore';

const PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE = 920;
const PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES = 990; 
const SOLUTION_COLUMN_MAX_HEIGHT = 980; 
const DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT = 40;

export type ProblemPlacementInfo = { page: number; column: number };

export type LayoutItem = 
    | { type: 'problem'; data: ProcessedProblem; uniqueId: string; }
    | { type: 'solutionChunk'; data: { text: string; parentProblem: ProcessedProblem }; uniqueId: string; };

type ProblemGroup = { items: LayoutItem[]; totalHeight: number };

const runLayoutCalculation = (
    itemsToLayout: LayoutItem[],
    heightsMap: Map<string, number>,
    defaultHeight: number, 
    getMaxHeight: (pageNumber: number) => number 
): { pages: LayoutItem[][]; placements: Map<string, ProblemPlacementInfo> } => {
    
    // [핵심 로그 추가] 각 문제에 적용될 높이를 계산 시작 전에 출력
    console.groupCollapsed(`[LayoutEngine] 📐 레이아웃 계산에 사용될 각 아이템의 높이 (${itemsToLayout[0]?.type}s)`);
    itemsToLayout.forEach(item => {
        const height = heightsMap.get(item.uniqueId);
        const usedHeight = height || defaultHeight;
        const source = height ? '(측정값)' : '(대체 높이)';
        
        if (item.type === 'problem') {
            console.log(`[Problem] 번호: ${item.data.display_question_number}, ID: ${item.uniqueId}, Height: ${usedHeight.toFixed(1)}px ${source}`);
        } else if (item.type === 'solutionChunk') {
            console.log(`[Solution] 부모: ${item.data.parentProblem.display_question_number}, ID: ${item.uniqueId}, Height: ${usedHeight.toFixed(1)}px ${source}`);
        }
    });
    console.groupEnd();
    
    const problemGroups: ProblemGroup[] = [];
    let currentGroupItems: LayoutItem[] = [];
    let currentGroupHeight = 0;
    
    const conservativeMaxHeight = Math.min(getMaxHeight(1), getMaxHeight(2));

    for (const item of itemsToLayout) {
        const itemHeight = heightsMap.get(item.uniqueId) || defaultHeight;
        if (itemHeight > conservativeMaxHeight) {
            if (currentGroupItems.length > 0) problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });
            problemGroups.push({ items: [item], totalHeight: itemHeight });
            currentGroupItems = [];
            currentGroupHeight = 0;
        } else if (currentGroupHeight + itemHeight <= conservativeMaxHeight || currentGroupItems.length === 0) {
            currentGroupItems.push(item);
            currentGroupHeight += itemHeight;
        } else {
            problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });
            currentGroupItems = [item];
            currentGroupHeight = itemHeight;
        }
    }
    if (currentGroupItems.length > 0) problemGroups.push({ items: currentGroupItems, totalHeight: currentGroupHeight });

    const newPages: LayoutItem[][] = [];
    const newPlacementMap = new Map<string, ProblemPlacementInfo>();
    
    let currentPageNumber = 1;
    let currentColumnIndex = 0; 
    let currentColumnHeight = 0;
    let pageItemBuffer: LayoutItem[] = [];

    for (const group of problemGroups) {
        const currentMaxHeight = getMaxHeight(currentPageNumber);

        if (currentColumnHeight + group.totalHeight <= currentMaxHeight) {
            pageItemBuffer.push(...group.items);
            currentColumnHeight += group.totalHeight;
            group.items.forEach(item => {
                newPlacementMap.set(item.uniqueId, { page: currentPageNumber, column: currentColumnIndex + 1 });
            });
        } else {
            currentColumnIndex++;
            currentColumnHeight = 0;

            if (currentColumnIndex > 1) { 
                newPages.push([...pageItemBuffer]);
                pageItemBuffer = [];
                currentPageNumber++;
                currentColumnIndex = 0;
            }

            pageItemBuffer.push(...group.items);
            currentColumnHeight += group.totalHeight;
            group.items.forEach(item => {
                newPlacementMap.set(item.uniqueId, { page: currentPageNumber, column: currentColumnIndex + 1 });
            });
        }
    }
    
    if (pageItemBuffer.length > 0) newPages.push([...pageItemBuffer]);
    return { pages: newPages, placements: newPlacementMap };
};


export const calculateInitialLayout = (selectedProblems: ProcessedProblem[], problemBoxMinHeight: number, itemHeightsMap: Map<string, number>) => {
    console.log(`[LayoutEngine] 🎬 Calculating layout using existing height map.`);
    const initialEstimatedProblemHeight = problemBoxMinHeight * 12;
    const problemLayoutItems: LayoutItem[] = selectedProblems.map(p => ({ type: 'problem', data: p, uniqueId: p.uniqueId }));
    
    const problemResult = runLayoutCalculation(
        problemLayoutItems, 
        itemHeightsMap,
        initialEstimatedProblemHeight,
        (page) => page === 1 ? PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE : PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES
    );

    const solutionLayoutItems: LayoutItem[] = [];
    selectedProblems.forEach(p => {
        if (p.solution_text?.trim()) {
            p.solution_text.split(/\n\s*\n/).filter(c => c.trim()).forEach((chunk, index) => {
                solutionLayoutItems.push({
                    type: 'solutionChunk',
                    data: { text: chunk, parentProblem: p },
                    uniqueId: `${p.uniqueId}-sol-${index}`
                });
            });
        }
    });
    
    const solutionResult = runLayoutCalculation(
        solutionLayoutItems,
        itemHeightsMap,
        DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT,
        () => SOLUTION_COLUMN_MAX_HEIGHT
    );
    
    console.log(`[LayoutEngine] ✅ Layout calculation finished.`);
    return {
        problems: problemResult,
        solutions: solutionResult,
    };
};

export const recalculateProblemLayout = (problemsForLayout: ProcessedProblem[], itemHeightsMap: Map<string, number>, problemBoxMinHeight: number) => {
    console.log(`[LayoutEngine] 🚀 RE-calculating PROBLEM layout ONLY with actual heights.`);
    
    const fallbackProblemHeight = problemBoxMinHeight * 12;

    const problemLayoutItems: LayoutItem[] = problemsForLayout.map(p => ({ type: 'problem', data: p, uniqueId: p.uniqueId }));
    
    const problemResult = runLayoutCalculation(
        problemLayoutItems, 
        itemHeightsMap, 
        fallbackProblemHeight, 
        (page) => page === 1 ? PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE : PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES
    );

    console.log(`[LayoutEngine] ✅ Problem re-calculation finished.`);
    return problemResult;
};

export const recalculateSolutionLayout = (selectedProblems: ProcessedProblem[], itemHeightsMap: Map<string, number>) => {
    console.log(`[LayoutEngine] 🚀 RE-calculating SOLUTION layout ONLY with actual heights.`);

    const solutionLayoutItems: LayoutItem[] = [];
    selectedProblems.forEach(p => {
        if (p.solution_text?.trim()) {
            p.solution_text.split(/\n\s*\n/).filter(c => c.trim()).forEach((chunk, index) => {
                solutionLayoutItems.push({
                    type: 'solutionChunk',
                    data: { text: chunk, parentProblem: p },
                    uniqueId: `${p.uniqueId}-sol-${index}`
                });
            });
        }
    });
    
    const solutionResult = runLayoutCalculation(
        solutionLayoutItems,
        itemHeightsMap,
        DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT,
        () => SOLUTION_COLUMN_MAX_HEIGHT
    );
    
    console.log(`[LayoutEngine] ✅ Solution re-calculation finished.`);
    return solutionResult;
};