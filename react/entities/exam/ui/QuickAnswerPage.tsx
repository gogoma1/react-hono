import React from 'react';
import type { Problem } from '../../problem/model/types';
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
                    <span className="quick-answer-value">{problem.answer}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div 
            className="exam-page-component" 
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