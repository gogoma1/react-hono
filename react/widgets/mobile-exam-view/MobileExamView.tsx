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

// [신규] MobileExamView가 받을 props 타입 정의
interface MobileExamViewProps {
    problems: ProcessedProblem[];
    isPreview?: boolean;
}

const MobileExamView: React.FC<MobileExamViewProps> = ({ problems: orderedProblems, isPreview = false }) => {
    // [수정] 이제 props로 orderedProblems를 받으므로, 스토어에서 가져올 필요가 없습니다.
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
            
            const hasCompletingStatus = finalStatus === 'A' || finalStatus === 'B' || finalStatus === 'D';
            
            const isSolved = hasAnswer && hasCompletingStatus;
            const isMarkedAsUnknown = finalStatus === 'C';

            const className = [
                'nav-button',
                isCurrent && 'active',
                !isCurrent && isMarkedAsUnknown && 'marked-c',
                !isCurrent && isSolved && 'solved',
                !isCurrent && !isSolved && !isMarkedAsUnknown && isSkipped && 'skipped',
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
                {/* [수정] isPreview가 아닐 때만 제출 버튼 표시 */}
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