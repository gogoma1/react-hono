// ./react/widgets/mobile-exam-view/MobileExamView.tsx
import React, { useRef, useCallback, useMemo } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import { useMobileExamController } from './useMobileExamController';
import { useMobileExamSync } from './useMobileExamSync';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import type { ProcessedProblem } from '../../features/problem-publishing';
import type { MarkingStatus } from '../../features/omr-marking';
import './MobileExamView.css';

interface MobileExamViewProps {
    problems: ProcessedProblem[];
    isPreview?: boolean;
}

const MobileExamView: React.FC<MobileExamViewProps> = ({ problems: orderedProblems, isPreview = false }) => {
    const { activeProblemId, skippedProblemIds } = useMobileExamSessionStore();
    const { answers, subjectiveAnswers, statuses, markAnswer, markSubjectiveAnswer } = useMobileExamAnswerStore();
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();
    
    const controller = useMobileExamController({ isPreview });
    
    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const { startNavigating } = useMobileExamSync({ orderedProblems, problemRefs });

    const handleNavClick = useCallback((problemId: string) => {
        startNavigating();
        controller.handleNavClick(problemId);
    }, [controller, startNavigating]);

    const moveToNextProblem = useCallback((currentProblemId: string) => {
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === currentProblemId);
        if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
            const nextProblemId = orderedProblems[currentIndex + 1].uniqueId;
            startNavigating();
            controller.handleNavClick(nextProblemId);
        }
    }, [orderedProblems, controller, startNavigating]);

    const onNextClick = useCallback((problemId: string) => {
        controller.handleNextClick(problemId);
        moveToNextProblem(problemId);
    }, [controller, moveToNextProblem]);

    const onMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        controller.handleMarkStatus(problemId, status);

        const problem = orderedProblems.find(p => p.uniqueId === problemId);
        if (!problem) return;
        
        const currentAnswers = useMobileExamAnswerStore.getState().answers;
        const currentSubjectiveAnswers = useMobileExamAnswerStore.getState().subjectiveAnswers;
        const isAnswered = (problem.problem_type === '서답형')
            ? (currentSubjectiveAnswers.get(problemId) || '').trim() !== ''
            : (currentAnswers.get(problemId)?.size || 0) > 0;
        
        if (status === 'C' || isAnswered) {
            moveToNextProblem(problemId);
        }
    }, [controller, orderedProblems, moveToNextProblem]);

    const navButtonStates = useMemo(() => {
        return orderedProblems.map(problem => {
            const isCurrent = activeProblemId === problem.uniqueId;
            const finalStatus = statuses.get(problem.uniqueId);
            const isSkipped = skippedProblemIds.has(problem.uniqueId);
            
            const hasAnswer = problem.problem_type === '서답형'
                ? (subjectiveAnswers.get(problem.uniqueId) || '').trim() !== ''
                : (answers.get(problem.uniqueId)?.size ?? 0) > 0;
            
            const hasCompletingStatus = finalStatus === 'A' || finalStatus === 'B';
            
            const isSolved = hasAnswer && hasCompletingStatus;
            // ✨ [핵심 수정 1] 'C' 또는 'D' 상태일 때 참이 되도록 조건을 확장합니다.
            const isMarkedAsDifficultOrUnknown = finalStatus === 'C' || finalStatus === 'D';

            const className = [
                'nav-button',
                isCurrent && 'active',
                // ✨ [핵심 수정 2] 변경된 조건과 더 명확한 클래스 이름을 사용합니다.
                !isCurrent && isMarkedAsDifficultOrUnknown && 'marked-unknown',
                !isCurrent && isSolved && 'solved',
                !isCurrent && !isSolved && !isMarkedAsDifficultOrUnknown && isSkipped && 'skipped',
            ].filter(Boolean).join(' ');

            return { uniqueId: problem.uniqueId, className };
        });
    }, [activeProblemId, statuses, skippedProblemIds, answers, subjectiveAnswers, orderedProblems]);

    if (orderedProblems.length === 0) {
        return (
            <div className="mobile-exam-status">
                <h2>모바일 시험지</h2>
                <p>문제를 불러오는 중이거나, 출제된 문제가 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="mobile-exam-view" style={{ '--base-font-size': baseFontSize } as React.CSSProperties}>
            <header className="mobile-exam-title-header">
                <h1>{isPreview ? '시험지 미리보기' : '모바일 시험지'}</h1>
            </header>
            
            <nav className="mobile-exam-nav-container">
                <div className="mobile-exam-nav-scroll-area">
                    {orderedProblems.map((problem, index) => {
                        const state = navButtonStates.find(s => s.uniqueId === problem.uniqueId);
                        return (
                            <button
                                key={problem.uniqueId}
                                type="button"
                                data-problem-id={problem.uniqueId}
                                className={state?.className || 'nav-button'}
                                onClick={() => handleNavClick(problem.uniqueId)}
                            >
                                {useSequentialNumbering ? index + 1 : problem.display_question_number}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className="mobile-exam-problem-list">
                {orderedProblems.map((problem) => (
                    <MobileExamProblem
                        ref={el => {
                            if (el) problemRefs.current.set(problem.uniqueId, el);
                            else problemRefs.current.delete(problem.uniqueId);
                        }}
                        key={problem.uniqueId}
                        problem={problem}
                        allProblems={orderedProblems}
                        useSequentialNumbering={useSequentialNumbering}
                        contentFontSizeEm={contentFontSizeEm}
                        contentFontFamily="'NanumGothic', 'Malgun Gothic', sans-serif"
                        currentAnswers={answers.get(problem.uniqueId) || null}
                        currentStatus={statuses.get(problem.uniqueId) || null}
                        onMarkAnswer={markAnswer}
                        onMarkStatus={onMarkStatus}
                        onNextClick={onNextClick}
                        isSubjective={problem.problem_type === '서답형'}
                        currentSubjectiveAnswer={subjectiveAnswers.get(problem.uniqueId) || ''}
                        onMarkSubjectiveAnswer={markSubjectiveAnswer}
                    />
                ))}
                {!isPreview && (
                    <button type="button" className="omr-button submit-exam-button" onClick={controller.handleSubmitExam}>
                        시험지 제출하기
                    </button>
                )}
            </div>
        </div>
    );
};

export default MobileExamView;