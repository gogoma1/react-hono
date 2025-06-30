import React from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer'; // [추가] MathpixRenderer 임포트
import './ExamPage.css';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };
interface HeaderInfo {
    title: string;
    titleFontFamily?: string;
    [key: string]: any;
}

interface QuickAnswerPageProps {
    pageNumber: number;
    totalPages: number;
    problems: ProcessedProblem[];
    headerInfo: HeaderInfo;
    baseFontSize: string;
    useSequentialNumbering: boolean;
    allProblems: ProcessedProblem[];
}

const QuickAnswerPage: React.FC<QuickAnswerPageProps> = ({
    pageNumber,
    totalPages,
    problems,
    headerInfo,
    baseFontSize,
    useSequentialNumbering,
    allProblems
}) => {
    const QuickAnswerHeader: React.FC<{ title: string; page: number }> = ({ title, page }) => (
        <div className="quick-answer-header">
            <h1 
                className="quick-answer-title" 
                style={{ '--title-font-family': headerInfo.titleFontFamily } as React.CSSProperties}
            >
                {title}
            </h1>
            <div className="exam-header-page-number quick-answer-page-number">{page}</div>
        </div>
    );
    
    const getProblemNumber = (problem: ProcessedProblem) => {
        if (useSequentialNumbering) {
            const globalIndex = allProblems.findIndex(p => p.uniqueId === problem.uniqueId);
            return (globalIndex + 1).toString(); // 순차 번호일 경우 숫자 반환
        }
        return problem.display_question_number; // 원본 번호일 경우 "서답형" 포함된 문자열 반환
    };

    const middleIndex = Math.ceil(problems.length / 2);
    const leftColumnProblems = problems.slice(0, middleIndex);
    const rightColumnProblems = problems.slice(middleIndex);

    const renderColumn = (columnProblems: ProcessedProblem[]) => (
        <div className="quick-answer-column">
            {columnProblems.map((problem) => (
                <div key={problem.uniqueId} className="quick-answer-item">
                    <span className="quick-answer-number">{getProblemNumber(problem)})</span>
                    {/* --- [핵심 수정] --- */}
                    {/* 기존의 span 태그를 MathpixRenderer를 사용하는 div로 교체합니다. */}
                    {/* 이렇게 하면 객관식(예: '①')과 서술형(예: '$x=2$') 정답 모두 올바르게 표시됩니다. */}
                    <div className="quick-answer-value">
                        <MathpixRenderer text={problem.answer ?? ''} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div 
            className="exam-page-component answer-page-type" 
            style={{ '--base-font-size': baseFontSize } as React.CSSProperties}
        >
            <div className="exam-paper">
                <QuickAnswerHeader title="빠른 정답" page={pageNumber} />
                <div className="quick-answer-columns-container">
                    {renderColumn(leftColumnProblems)}
                    {renderColumn(rightColumnProblems)}
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default QuickAnswerPage;