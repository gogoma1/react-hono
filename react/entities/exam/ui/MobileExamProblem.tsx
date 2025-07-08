// ----- ./react/entities/exam/ui/MobileExamProblem.tsx -----
import React, { memo, forwardRef } from 'react';
import type { Problem } from '../../problem/model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import { OmrMarkingCard } from '../../../features/omr-marking';
import type { AnswerNumber, MarkingStatus } from '../../../features/omr-marking';
import './MobileExamProblem.css';

type ProcessedProblem = Problem & { uniqueId: string; display_question_number: string; };

interface MobileExamProblemProps {
    problem: ProcessedProblem;
    allProblems: ProcessedProblem[];
    useSequentialNumbering: boolean;
    contentFontSizeEm: number;
    contentFontFamily: string;
    currentAnswers: Set<AnswerNumber> | null;
    currentStatus: MarkingStatus | null;
    onMarkAnswer: (problemId: string, answer: AnswerNumber) => void;
    onCommitAndProceed: (problemId: string, status?: MarkingStatus) => void;
    isSubjective?: boolean;
    currentSubjectiveAnswer?: string;
    onMarkSubjectiveAnswer?: (problemId: string, answer: string) => void;
}

const MobileExamProblem = memo(forwardRef<HTMLDivElement, MobileExamProblemProps>(({ 
    problem, 
    allProblems, 
    useSequentialNumbering, 
    contentFontSizeEm, 
    contentFontFamily,
    currentAnswers,
    currentStatus,
    onMarkAnswer,
    onCommitAndProceed,
    isSubjective,
    currentSubjectiveAnswer,
    onMarkSubjectiveAnswer,
}, ref) => {
    
    const globalProblemIndex = allProblems.findIndex(p => p.uniqueId === problem.uniqueId) + 1;
    
    if (!problem) return null;

    return (
        <div ref={ref} className="mobile-problem-container" data-unique-id={problem.uniqueId}>
            <div className="mobile-problem-header">
                <div className="mobile-header-inner">
                    <span className="mobile-problem-number">{useSequentialNumbering ? `${globalProblemIndex}.` : `${problem.display_question_number}.`}</span>
                    {problem.score && <span className="mobile-problem-score">[{problem.score}]</span>}
                </div>
            </div>
            <div 
                className="mobile-problem-content-wrapper" 
                style={{ 
                    '--content-font-size-em': `${contentFontSizeEm}em`, 
                    '--content-font-family': contentFontFamily 
                } as React.CSSProperties}
            >
                <div className="mathpix-wrapper prose">
                    <MathpixRenderer text={problem.question_text ?? ''} />
                </div>
            </div>

            <div className="omr-separator"></div>

            <OmrMarkingCard
                problemId={problem.uniqueId}
                currentAnswers={currentAnswers}
                currentStatus={currentStatus}
                onMarkAnswer={onMarkAnswer}
                onCommitAndProceed={onCommitAndProceed}
                isSubjective={isSubjective}
                currentSubjectiveAnswer={currentSubjectiveAnswer}
                onMarkSubjectiveAnswer={onMarkSubjectiveAnswer}
            />
        </div>
    );
}));
MobileExamProblem.displayName = 'MobileExamProblem';

export default MobileExamProblem;