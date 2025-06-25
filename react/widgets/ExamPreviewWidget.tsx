// ./react/widgets/ExamPreviewWidget.tsx
import React from 'react';
import type { Problem } from '../entities/problem/model/types';
import ExamPage from '../entities/exam/ui/ExamPage';
import './ExamPreviewWidget.css';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ExamPreviewWidgetProps {
    distributedPages: ProcessedProblem[][];
    allProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
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
}

const ExamPreviewWidget: React.FC<ExamPreviewWidgetProps> = (props) => {
    const { distributedPages, isCalculating, allProblems, placementMap } = props;

    if (distributedPages.length > 0) {
        return (
            <div className="exam-preview-widget">
                {distributedPages.map((pageProblems, pageIndex) => (
                    <div key={`page-container-${pageIndex}-${pageProblems[0]?.uniqueId || ''}`} id={`page-${pageIndex + 1}`} className="page-container">
                        <ExamPage
                            {...props}
                            pageNumber={pageIndex + 1}
                            totalPages={distributedPages.length}
                            problems={pageProblems}
                            allProblems={allProblems}
                            placementMap={placementMap}
                        />
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="status-message">
            {isCalculating ? '문제 배치 중...' : '상단 테이블에서 문제를 선택해주세요.'}
        </div>
    );
};

export default ExamPreviewWidget;