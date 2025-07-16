import React, { useMemo } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import './ExamPage.css';
import { LuCircleX } from "react-icons/lu";
import { useHeightMeasurer } from '../../../features/problem-publishing/hooks/useHeightMeasurer';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemItemProps {
    problem: ProcessedProblem;
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string, height: number) => void;
    useSequentialNumbering: boolean;
    contentFontSizeEm: number;
    contentFontFamily: string;
    onProblemClick: (problem: ProcessedProblem) => void;
    onDeselectProblem: (uniqueId: string) => void;
    measuredHeight?: number; 
}

const ProblemItem: React.FC<ProblemItemProps> = React.memo(({ problem, allProblems, onRenderComplete, useSequentialNumbering, contentFontSizeEm, contentFontFamily, onProblemClick, onDeselectProblem, measuredHeight }) => {
    
    const globalProblemIndex = useMemo(() => allProblems.findIndex(p => p.uniqueId === problem.uniqueId) + 1, [allProblems, problem.uniqueId]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProblemClick(problem); } };
    
    const measureRef = useHeightMeasurer(onRenderComplete, problem.uniqueId);

    if (!problem) return null;

    return (
        <div ref={measureRef} className="problem-container" data-unique-id={problem.uniqueId}>
             <div role="button" tabIndex={0} onKeyDown={handleKeyDown} className="text-trigger" onClick={() => onProblemClick(problem)} aria-label={`${problem.display_question_number}번 문제 수정`}>
                <div className="problem-header">
                    <div className="header-inner">
                        <span className="problem-number">{useSequentialNumbering ? `${globalProblemIndex}.` : `${problem.display_question_number}.`}</span>
                        <span className="global-index">({globalProblemIndex})</span>
                        {problem.score && <span className="problem-score">[{problem.score}]</span>}
                        {measuredHeight && <span className="measured-height">({measuredHeight.toFixed(0)}px)</span>}
                    </div>
                    <button type="button" className="problem-deselect-button" aria-label="문제 선택 해제" onClick={(e) => { e.stopPropagation(); onDeselectProblem(problem.uniqueId); }}>
                        <LuCircleX size={18} />
                    </button>
                </div>
                <div 
                    className="problem-content-wrapper" 
                    style={{ 
                        '--content-font-size-em': `${contentFontSizeEm}em`, 
                        '--content-font-family': contentFontFamily 
                    } as React.CSSProperties}
                >
                    <div className="mathpix-wrapper prose">
                        <MathpixRenderer text={problem.question_text ?? ''} />
                    </div>
                </div>
             </div>
        </div>
    );
});
ProblemItem.displayName = 'ProblemItem';

type ExamHeaderInfo = Pick<React.ComponentProps<typeof ExamHeader>, 
    | 'title' 
    | 'titleFontSize' 
    | 'titleFontFamily' 
    | 'school' 
    | 'schoolFontSize' 
    | 'schoolFontFamily' 
    | 'subject' 
    | 'subjectFontSize' 
    | 'subjectFontFamily' 
    | 'simplifiedSubjectText'
    | 'simplifiedSubjectFontSize'
    | 'simplifiedSubjectFontFamily'
    | 'simplifiedGradeText'
    | 'subtitle' // [수정] source -> subtitle
>;

interface ExamPageProps {
    pageNumber: number;
    totalPages: number;
    problems: ProcessedProblem[];
    allProblems: ProcessedProblem[];
    placementMap: Map<string, { page: number; column: number }>;
    onHeightUpdate: (uniqueId: string, height: number) => void;
    onProblemClick: (problem: ProcessedProblem) => void;
    useSequentialNumbering: boolean;
    baseFontSize: string;
    contentFontSizeEm: number;
    contentFontFamily: string;
    headerInfo: ExamHeaderInfo;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
    onDeselectProblem: (uniqueId: string) => void;
    measuredHeights: Map<string, number>; 
}

const ExamPage: React.FC<ExamPageProps> = (props) => {
    const {
        pageNumber, totalPages, problems, allProblems, placementMap, onHeightUpdate,
        useSequentialNumbering, baseFontSize, contentFontSizeEm, contentFontFamily,
        headerInfo, onHeaderUpdate, onProblemClick, onDeselectProblem,
        measuredHeights, 
    } = props;
    
    
    const leftColumnProblems = useMemo(() => 
        problems.filter((p: ProcessedProblem) => placementMap.get(p.uniqueId)?.column === 1),
        [problems, placementMap]
    );

    const rightColumnProblems = useMemo(() => 
        problems.filter((p: ProcessedProblem) => placementMap.get(p.uniqueId)?.column === 2),
        [problems, placementMap]
    );
    
    const renderColumn = (problemList: ProcessedProblem[]) => {
        return problemList.map((problem) => (
            <ProblemItem
                key={problem.uniqueId}
                problem={problem}
                allProblems={allProblems}
                onRenderComplete={onHeightUpdate}
                useSequentialNumbering={useSequentialNumbering}
                contentFontSizeEm={contentFontSizeEm}
                contentFontFamily={contentFontFamily}
                onProblemClick={onProblemClick}
                onDeselectProblem={onDeselectProblem}
                measuredHeight={measuredHeights.get(problem.uniqueId)} 
            />
        ));
    };
    
    return (
        <div 
            className="exam-page-component problem-page-type" 
            style={{ '--base-font-size': baseFontSize } as React.CSSProperties}
        >
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
                    totalPages={totalPages}
                    additionalBoxContent="이름"
                    {...headerInfo}
                    onUpdate={onHeaderUpdate}
                />
                <div className="exam-columns-container">
                    <div className="exam-column">{renderColumn(leftColumnProblems)}</div>
                    <div className="exam-column">{renderColumn(rightColumnProblems)}</div>
                    <div className="column-divider"></div>
                </div>
                <div className="page-footer">
                    <div className="page-counter-box">{pageNumber} / {totalPages}</div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ExamPage);