import React, { useMemo } from 'react';
import ExamPage from '../entities/exam/ui/ExamPage';
import QuickAnswerPage from '../entities/exam/ui/QuickAnswerPage';
import SolutionPage from '../entities/exam/ui/SolutionPage';
import type { LayoutItem, ProcessedProblem } from '../features/problem-publishing/model/useProblemPublishing';
import './ExamPreviewWidget.css';

const ANSWERS_PER_PAGE = 80;

interface ExamPreviewWidgetProps {
    distributedPages: LayoutItem[][];
    distributedSolutionPages: LayoutItem[][];
    allProblems: ProcessedProblem[];
    selectedProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    solutionPlacementMap: Map<string, { page: number; column: number }>;
    headerInfo: any;
    
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    problemBoxMinHeight: number;
    
    onHeightUpdate: (uniqueId: string, height: number) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
    onDeselectProblem: (uniqueId:string) => void;
    measuredHeights: Map<string, number>;
}

const ExamPreviewWidget: React.FC<ExamPreviewWidgetProps> = (props) => {
    const { 
        distributedPages = [],
        distributedSolutionPages = [],
        allProblems, // [핵심] 최신 데이터가 담긴 이 배열을 사용합니다.
        selectedProblems = [],
        placementMap, 
        solutionPlacementMap,
        onHeightUpdate,
    } = props;
    
    // [추가] 최신 문제 데이터를 빠르게 찾기 위한 Map을 생성합니다.
    const latestProblemsMap = useMemo(() => 
        new Map(allProblems.map(p => [p.uniqueId, p])),
        [allProblems]
    );

    const distributedAnswerPages = React.useMemo(() => {
        if (selectedProblems.length === 0) return [];
        const pages: ProcessedProblem[][] = [];
        for (let i = 0; i < selectedProblems.length; i += ANSWERS_PER_PAGE) {
            pages.push(selectedProblems.slice(i, i + ANSWERS_PER_PAGE));
        }
        return pages;
    }, [selectedProblems]);

    const totalProblemPages = distributedPages.length;
    const totalAnswerPages = distributedAnswerPages.length;
    const totalSolutionPages = distributedSolutionPages.length;
    const totalPages = totalProblemPages + totalAnswerPages + totalSolutionPages;

    if (selectedProblems.length === 0) {
         return (
            <div className="status-message">
                상단 테이블에서 문제를 선택해주세요.
            </div>
        );
    }
    
    if (distributedPages.length === 0 && selectedProblems.length > 0) {
        return <div className="status-message">시험지 구성 중...</div>;
    }

    return (
        <div className="exam-preview-widget">
            <>
                {/* 1. 문제 페이지 렌더링 */}
                {distributedPages.map((pageItems, pageIndex) => {
                    // [수정] 레이아웃의 ID를 이용해 최신 문제 데이터를 찾아옵니다.
                    const pageProblems = pageItems
                        .filter((item): item is Extract<LayoutItem, { type: 'problem' }> => item.type === 'problem')
                        .map(item => latestProblemsMap.get(item.data.uniqueId))
                        .filter((p): p is ProcessedProblem => !!p);

                    return (
                        <div key={`page-container-${pageIndex}`} id={`page-${pageIndex + 1}`} className="page-container">
                            <ExamPage {...props} allProblems={allProblems} pageNumber={pageIndex + 1} totalPages={totalPages} problems={pageProblems} placementMap={placementMap} />
                        </div>
                    );
                })}
                
                {/* 2. 빠른 정답 페이지 렌더링 */}
                {distributedAnswerPages.map((pageProblems, pageIndex) => {
                    const pageNumber = totalProblemPages + pageIndex + 1;
                    return (
                        <div key={`quick-answer-page-${pageIndex}`} id={`page-${pageNumber}`} className="page-container">
                            <QuickAnswerPage {...props} allProblems={allProblems} pageNumber={pageNumber} totalPages={totalPages} problems={pageProblems} />
                        </div>
                    );
                })}
                
                {/* 3. 해설 페이지 렌더링 */}
                {distributedSolutionPages.map((pageItems, pageIndex) => {
                    const pageNumber = totalProblemPages + totalAnswerPages + pageIndex + 1;

                    // [수정] 해설 아이템의 부모 문제 데이터를 최신 버전으로 교체합니다.
                    const updatedPageItems = pageItems.map(item => {
                        if (item.type === 'solutionChunk') {
                            const latestParentProblem = latestProblemsMap.get(item.data.parentProblem.uniqueId);
                            if (latestParentProblem) {
                                // 새로운 부모 문제 데이터로 교체한 새 아이템 객체 반환
                                return {
                                    ...item,
                                    data: {
                                        ...item.data,
                                        parentProblem: latestParentProblem
                                    }
                                };
                            }
                        }
                        return item;
                    }).filter((item): item is LayoutItem => !!item);

                    return (
                        <div key={`solution-page-container-${pageIndex}`} id={`page-${pageNumber}`} className="page-container">
                            <SolutionPage 
                                {...props} 
                                allProblems={allProblems}
                                pageNumber={pageNumber} 
                                totalPages={totalPages} 
                                items={updatedPageItems} // 업데이트된 아이템 사용
                                placementMap={solutionPlacementMap}
                                onHeightUpdate={onHeightUpdate} 
                            />
                        </div>
                    );
                })}
            </>
        </div>
    );
};

export default ExamPreviewWidget;