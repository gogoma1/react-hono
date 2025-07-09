// ----- ./react/features/mobile-exam-session/ui/MboileProblemNavBar.tsx -----

import React, { useMemo } from 'react';
import type { ProcessedProblem } from '../../problem-publishing';

interface NavButtonState {
    uniqueId: string;
    displayNumber: string;
    className: string;
}

interface ProblemNavBarProps {
    orderedProblems: ProcessedProblem[];
    activeProblemId: string | null;
    statuses: Map<string, string>;
    answers: Map<string, Set<number>>;
    subjectiveAnswers: Map<string, string>;
    skippedProblemIds: Set<string>;
    useSequentialNumbering: boolean;
    onNavClick: (problemId: string) => void;
}

export const ProblemNavBar: React.FC<ProblemNavBarProps> = ({
    orderedProblems,
    activeProblemId,
    statuses,
    answers,
    subjectiveAnswers,
    skippedProblemIds,
    useSequentialNumbering,
    onNavClick,
}) => {
    const navButtonStates = useMemo<NavButtonState[]>(() => {
        return orderedProblems.map((problem, index) => {
            const isCurrent = activeProblemId === problem.uniqueId;
            const finalStatus = statuses.get(problem.uniqueId);
            const isSkipped = skippedProblemIds.has(problem.uniqueId);
            
            // [핵심 수정] isSubjective와 유사한 로직을 명시적으로 변경하여 OX 문제를 객관식 계열로 처리합니다.
            const hasAnswer = problem.problem_type === '서답형' || problem.problem_type === '논술형'
                ? (subjectiveAnswers.get(problem.uniqueId) || '').trim() !== ''
                : (answers.get(problem.uniqueId)?.size ?? 0) > 0;
            
            const isSolved = hasAnswer && (finalStatus === 'A' || finalStatus === 'B');
            const isMarkedAsDifficult = finalStatus === 'C' || finalStatus === 'D';

            let statusClass = '';
            if (isCurrent) statusClass = 'active';
            else if (isSolved) statusClass = 'solved';
            else if (isSkipped) statusClass = 'skipped';
            else if (isMarkedAsDifficult) statusClass = 'marked-unknown';
            
            return { 
                uniqueId: problem.uniqueId,
                displayNumber: useSequentialNumbering ? String(index + 1) : problem.display_question_number,
                className: ['nav-button', statusClass].filter(Boolean).join(' ') 
            };
        });
    }, [activeProblemId, statuses, skippedProblemIds, answers, subjectiveAnswers, orderedProblems, useSequentialNumbering]);

    return (
        <nav className="mobile-exam-nav-container">
            <div className="mobile-exam-nav-scroll-area">
                {navButtonStates.map((state) => (
                    <button
                        key={state.uniqueId}
                        type="button"
                        data-problem-id={state.uniqueId}
                        className={state.className}
                        onClick={() => onNavClick(state.uniqueId)}
                    >
                        {state.displayNumber}
                    </button>
                ))}
            </div>
        </nav>
    );
};