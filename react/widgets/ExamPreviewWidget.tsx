import React from 'react';
import type { Problem } from '../entities/problem/model/types';
import ExamPage from '../entities/exam/ui/ExamPage';
import './ExamPreviewWidget.css';

// [수정] 위젯이 받을 문제 타입 정의
type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ExamPreviewWidgetProps {
    // [수정] distributedPages 타입 구체화
    distributedPages: ProcessedProblem[][];
    // [수정] allProblems 타입 구체화
    allProblems: ProcessedProblem[];
    // [수정] placementMap의 키를 string으로 변경
    placementMap: Map<string, { page: number; column: number }>;
    isCalculating: boolean;
    headerInfo: any;
    
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    problemBoxMinHeight: number;
    
    // [수정] onHeightUpdate의 첫 번째 인자 타입을 string으로 변경
    onHeightUpdate: (uniqueId: string, height: number) => void;
    // onProblemUpdate는 DB의 question_number를 기준으로 하므로 그대로 둡니다.
    onProblemUpdate: (id: string | number, updatedFields: Partial<Problem>) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
}

const ExamPreviewWidget: React.FC<ExamPreviewWidgetProps> = (props) => {
    const { distributedPages, isCalculating, allProblems, placementMap } = props;

    if (distributedPages.length > 0) {
        return (
            <div className="exam-preview-widget">
                {distributedPages.map((pageProblems, pageIndex) => (
                    // [수정] ExamPage에 전달하는 key를 고유하게 변경
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