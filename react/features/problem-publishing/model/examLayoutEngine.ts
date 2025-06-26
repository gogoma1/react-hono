import type { ProcessedProblem } from './problemPublishingStore';

// [수정] 페이지별 최대 높이 상수를 명확하게 정의합니다.
const PROBLEM_COLUMN_MAX_HEIGHT_FIRST_PAGE = 920;
const PROBLEM_COLUMN_MAX_HEIGHT_OTHER_PAGES = 990; // 2페이지 이상부터 적용될 높이
const SOLUTION_COLUMN_MAX_HEIGHT = 980; // 해설 페이지는 동일하게 유지
const DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT = 40;

export type ProblemPlacementInfo = { page: number; column: number };

export type LayoutItem = 
    | { type: 'problem'; data: ProcessedProblem; uniqueId: string; }
    | { type: 'solutionChunk'; data: { text: string; parentProblem: ProcessedProblem }; uniqueId: string; };

type ProblemGroup = { items: LayoutItem[]; totalHeight: number };

/**
 * [핵심 수정] 레이아웃 계산 함수가 페이지 번호를 인자로 받아 최대 높이를 동적으로 결정하도록 변경합니다.
 * @param itemsToLayout - 배치할 아이템 목록
 * @param heightsMap - 각 아이템의 측정된 높이 맵
 * @param defaultHeight - 측정되지 않은 아이템의 기본 높이
 * @param getMaxHeight - 페이지 번호를 인자로 받아 해당 페이지의 최대 높이를 반환하는 함수
 */
const runLayoutCalculation = (
    itemsToLayout: LayoutItem[],
    heightsMap: Map<string, number>,
    defaultHeight: number, 
    getMaxHeight: (pageNumber: number) => number // maxHeight를 함수로 변경
): { pages: LayoutItem[][]; placements: Map<string, ProblemPlacementInfo> } => {
    const problemGroups: ProblemGroup[] = [];
    let currentGroupItems: LayoutItem[] = [];
    let currentGroupHeight = 0;
    
    // 이 부분은 페이지를 나누기 전, 아이템들을 높이에 맞게 '그룹'으로 묶는 과정입니다.
    // 이 단계에서는 페이지 번호를 알 수 없으므로, 가장 보수적인(가장 작은) 높이를 기준으로 그룹핑합니다.
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

    // 이제 그룹들을 실제 페이지와 컬럼에 배치합니다.
    const newPages: LayoutItem[][] = [];
    const newPlacementMap = new Map<string, ProblemPlacementInfo>();
    
    let currentPageNumber = 1;
    let currentColumnIndex = 0; // 0: 왼쪽 단, 1: 오른쪽 단
    let currentColumnHeight = 0;
    let pageItemBuffer: LayoutItem[] = [];

    for (const group of problemGroups) {
        // [핵심 수정] 현재 페이지 번호에 맞는 최대 높이를 가져옵니다.
        const currentMaxHeight = getMaxHeight(currentPageNumber);

        if (currentColumnHeight + group.totalHeight <= currentMaxHeight) {
            // 현재 컬럼에 그룹을 추가할 수 있는 경우
            pageItemBuffer.push(...group.items);
            currentColumnHeight += group.totalHeight;
            group.items.forEach(item => {
                newPlacementMap.set(item.uniqueId, { page: currentPageNumber, column: currentColumnIndex + 1 });
            });
        } else {
            // 현재 컬럼에 추가할 수 없는 경우, 다음 컬럼으로 이동
            currentColumnIndex++;
            currentColumnHeight = 0;

            if (currentColumnIndex > 1) { // 오른쪽 단도 꽉 찼으면 다음 페이지로
                newPages.push([...pageItemBuffer]);
                pageItemBuffer = [];
                currentPageNumber++;
                currentColumnIndex = 0;
            }

            // 새 컬럼/페이지에 그룹 추가
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
    
    // [수정] 페이지 번호에 따라 다른 높이를 반환하는 함수를 전달합니다.
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
    
    // [수정] 해설 페이지는 모든 페이지의 높이가 동일하므로 간단한 함수를 전달합니다.
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
    
    // [수정] 재계산 시에도 페이지 번호별 높이 함수를 전달합니다.
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
    
    // [수정] 해설 페이지 재계산 시에도 높이 함수를 전달합니다.
    const solutionResult = runLayoutCalculation(
        solutionLayoutItems,
        itemHeightsMap,
        DEFAULT_SOLUTION_CHUNK_ESTIMATED_HEIGHT,
        () => SOLUTION_COLUMN_MAX_HEIGHT
    );
    
    console.log(`[LayoutEngine] ✅ Solution re-calculation finished.`);
    return solutionResult;
};