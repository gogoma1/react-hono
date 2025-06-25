import React, { useMemo, useCallback, forwardRef } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import ExamHeader from './ExamHeader';
import './ExamPage.css';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface ProblemItemProps {
    problem: ProcessedProblem;
    allProblems: ProcessedProblem[];
    onRenderComplete: (uniqueId: string) => void;
    useSequentialNumbering: boolean;
    problemBoxMinHeight: number;
    contentFontSizeEm: number;
    contentFontFamily: string;
    onProblemClick: (problem: ProcessedProblem) => void;
}

const ProblemItem = forwardRef<HTMLDivElement, ProblemItemProps>(({ problem, allProblems, onRenderComplete, useSequentialNumbering, problemBoxMinHeight, contentFontSizeEm, contentFontFamily, onProblemClick }, ref) => {
    
    const globalProblemIndex = useMemo(() => 
        allProblems.indexOf(problem) + 1,
        [allProblems, problem]
    );

    return (
        <div ref={ref} className="problem-container" data-unique-id={problem.uniqueId}>
             <button type="button" className="text-trigger" onClick={() => onProblemClick(problem)} aria-label={`${problem.display_question_number}번 문제 수정`}>
                <div className="problem-header">
                    <div className="header-inner">
                        <span className="problem-number">{useSequentialNumbering ? `${globalProblemIndex}.` : `${problem.display_question_number}.`}</span>
                        <span className="global-index">({globalProblemIndex})</span>
                        {problem.score && <span className="problem-score">[{problem.score}]</span>}
                    </div>
                </div>
                <div className="problem-content-wrapper" style={{ fontSize: `${contentFontSizeEm}em`, fontFamily: contentFontFamily, minHeight: `${problemBoxMinHeight}em` }}>
                    <div className="mathpix-wrapper prose">
                        <MathpixRenderer text={problem.question_text ?? ''} onRenderComplete={() => onRenderComplete(problem.uniqueId)} />
                    </div>
                </div>
             </button>
        </div>
    );
});
ProblemItem.displayName = 'ProblemItem';

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
    problemBoxMinHeight: number;
    headerInfo: any;
    onHeaderUpdate: (targetId: string, field: string, value: any) => void;
}

const ExamPage: React.FC<ExamPageProps> = (props) => {
    const {
        pageNumber, totalPages, problems, allProblems, placementMap,
        onHeightUpdate, useSequentialNumbering,
        baseFontSize, contentFontSizeEm, contentFontFamily, problemBoxMinHeight,
        headerInfo,
        onHeaderUpdate,
        onProblemClick
    } = props;

    const leftColumnProblems = useMemo(() => 
        problems.filter(p => placementMap.get(p.uniqueId)?.column === 1),
        [problems, placementMap]
    );

    const rightColumnProblems = useMemo(() => 
        problems.filter(p => placementMap.get(p.uniqueId)?.column === 2),
        [problems, placementMap]
    );
    
    const registerElement = useCallback((uniqueId: string, node: HTMLDivElement | null) => {
        if (node) {
            requestAnimationFrame(() => {
                const styles = window.getComputedStyle(node);
                const marginBottom = parseFloat(styles.marginBottom);
                const totalHeight = node.offsetHeight + (isNaN(marginBottom) ? 0 : marginBottom);
                onHeightUpdate(uniqueId, totalHeight);
            });
        }
    }, [onHeightUpdate]);

    const handleRenderComplete = useCallback((uniqueId: string) => {
        const node = document.querySelector(`[data-unique-id="${uniqueId}"]`) as HTMLDivElement | null;
        if(node) registerElement(uniqueId, node);
    }, [registerElement]);
    
    const renderColumn = (problemList: ProcessedProblem[]) => {
        return problemList.map((problem) => {
            return (
                <ProblemItem
                    key={problem.uniqueId}
                    ref={(node) => registerElement(problem.uniqueId, node)}
                    problem={problem}
                    allProblems={allProblems}
                    onRenderComplete={handleRenderComplete}
                    useSequentialNumbering={useSequentialNumbering}
                    problemBoxMinHeight={problemBoxMinHeight}
                    contentFontSizeEm={contentFontSizeEm}
                    contentFontFamily={contentFontFamily}
                    onProblemClick={onProblemClick}
                />
            );
        });
    };

    return (
        <div className="exam-page-component" style={{ fontSize: baseFontSize }}>
            <div className="exam-paper">
                <ExamHeader 
                    page={pageNumber}
                    additionalBoxContent={problems[0]?.source ?? '정보 없음'}
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