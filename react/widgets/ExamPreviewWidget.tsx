import React from 'react';
// [수정] 사용하지 않는 Problem 타입 import 제거
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
    isCalculating: boolean;
    headerInfo: any;
    
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    problemBoxMinHeight: number;
    
    onHeightUpdate: (uniqueId: string, height: number) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
    onDeselectProblem: (uniqueId: string) => void;
}

const ExamPreviewWidget: React.FC<ExamPreviewWidgetProps> = (props) => {
    const { 
        distributedPages = [],
        distributedSolutionPages = [],
        isCalculating, 
        allProblems, 
        selectedProblems = [],
        placementMap, 
        solutionPlacementMap,
        onHeightUpdate,
    } = props;
    
    const problemsWithSolutions = React.useMemo(() => 
        selectedProblems.filter(p => p.solution_text && p.solution_text.trim() !== ''),
        [selectedProblems]
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

    if (totalProblemPages === 0 && !isCalculating) {
         return (
            <div className="status-message">
                상단 테이블에서 문제를 선택해주세요.
            </div>
        );
    }
    
    return (
        <div className="exam-preview-widget">
            {isCalculating && <div className="status-message">문제 배치 중...</div>}
            
            {/* 1. 문제 페이지 렌더링 */}
            {distributedPages.map((pageItems, pageIndex) => {
                const pageProblems = pageItems
                    .filter((item): item is Extract<LayoutItem, { type: 'problem' }> => item.type === 'problem')
                    .map(item => item.data);

                return (
                    <div key={`page-container-${pageIndex}-${pageProblems[0]?.uniqueId || ''}`} id={`page-${pageIndex + 1}`} className="page-container">
                        <ExamPage
                            {...props}
                            pageNumber={pageIndex + 1}
                            totalPages={totalPages}
                            problems={pageProblems}
                            placementMap={placementMap}
                        />
                    </div>
                );
            })}
            
            {/* 2. 빠른 정답 페이지 렌더링 */}
            {distributedAnswerPages.map((pageProblems, pageIndex) => {
                const pageNumber = totalProblemPages + pageIndex + 1;
                return (
                    <div key={`quick-answer-page-${pageIndex}`} id={`page-${pageNumber}`} className="page-container">
                        <QuickAnswerPage
                            pageNumber={pageNumber}
                            totalPages={totalPages}
                            problems={pageProblems}
                            headerInfo={props.headerInfo}
                            baseFontSize={props.baseFontSize}
                            useSequentialNumbering={props.useSequentialNumbering}
                            allProblems={allProblems}
                        />
                    </div>
                );
            })}
            
            {/* 3. 해설 페이지 렌더링 */}
            {distributedSolutionPages.map((pageItems, pageIndex) => {
                const pageNumber = totalProblemPages + totalAnswerPages + pageIndex + 1;
                return (
                    <div key={`solution-page-container-${pageIndex}-${pageItems[0]?.uniqueId || ''}`} id={`page-${pageNumber}`} className="page-container">
                        <SolutionPage
                            {...props}
                            pageNumber={pageNumber}
                            totalPages={totalPages}
                            items={pageItems} 
                            placementMap={solutionPlacementMap}
                            onHeightUpdate={onHeightUpdate} 
                        />
                    </div>
                );
            })}
            
            {/* 해설 페이지 높이 계산을 위한 숨겨진 렌더링 영역 */}
            <div style={{ position: 'absolute', zIndex: -1, opacity: 0, pointerEvents: 'none', top: '-9999px', left: '-9999px' }}>
                <SolutionPage
                    {...props}
                    pageNumber={-1}
                    totalPages={-1}
                    // [수정] 해설 조각 아이템으로 변환
                    items={problemsWithSolutions.flatMap(p => 
                        // p.solution_text가 null이 아님을 filter에서 확인했으므로 non-null assertion(!) 사용 가능
                        p.solution_text!.split(/\n\s*\n/).filter(c => c.trim()).map((chunk, cIndex) => ({
                            type: 'solutionChunk' as const, // 타입을 명확히 함
                            data: { text: chunk, parentProblem: p },
                            uniqueId: `${p.uniqueId}-sol-${cIndex}`
                        }))
                    )}
                    placementMap={new Map()}
                    onHeightUpdate={onHeightUpdate} 
                />
            </div>
        </div>
    );
};

export default ExamPreviewWidget;