// ----- ./react/widgets/mobile-exam-view/MobileExamView.tsx -----
import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
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
    
    const [initialAnswersOnFocus, setInitialAnswersOnFocus] = useState<Map<string, Set<number> | string>>(new Map());

    useEffect(() => {
        if (activeProblemId) {
            console.log(`[View] activeProblemId 변경됨: ${activeProblemId}. 초기 답안 상태를 저장합니다.`);
            const currentProblem = orderedProblems.find(p => p.uniqueId === activeProblemId);
            if (!currentProblem) return;

            const newInitialAnswers = new Map(initialAnswersOnFocus);
            if (currentProblem.problem_type === '서답형') {
                newInitialAnswers.set(activeProblemId, subjectiveAnswers.get(activeProblemId) || '');
            } else {
                newInitialAnswers.set(activeProblemId, new Set(answers.get(activeProblemId)));
            }
            setInitialAnswersOnFocus(newInitialAnswers);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProblemId]);

    const moveToNextProblem = useCallback((currentProblemId: string) => {
        console.log(`[View] moveToNextProblem 호출됨. currentProblemId: ${currentProblemId}`);
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === currentProblemId);
        if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
            const nextProblemId = orderedProblems[currentIndex + 1].uniqueId;
            startNavigating();
            controller.handleNavClick(nextProblemId);
        } else {
            console.log(`[View] 마지막 문제이거나 문제를 찾을 수 없음. 이동 안 함.`);
        }
    }, [orderedProblems, controller, startNavigating]);

    const handleCommitAndProceed = useCallback((problemId: string, status?: MarkingStatus) => {
        console.log(`[View] handleCommitAndProceed 호출됨. problemId: ${problemId}, status: ${status || '없음(넘기기)'}`);
        const currentProblem = orderedProblems.find(p => p.uniqueId === problemId);
        if (!currentProblem) return;

        const finalStatus = statuses.get(problemId);
        const isCompleted = finalStatus === 'A' || finalStatus === 'B';
        
        let answerChanged = false;
        const initialAnswer = initialAnswersOnFocus.get(problemId);
        if (currentProblem.problem_type === '서답형') {
            answerChanged = initialAnswer !== (subjectiveAnswers.get(problemId) || '');
        } else {
            const currentAnswerSet = answers.get(problemId) || new Set();
            const initialAnswerSet = (initialAnswer as Set<number>) || new Set();
            if (currentAnswerSet.size !== initialAnswerSet.size || ![...currentAnswerSet].every(val => initialAnswerSet.has(val))) {
                answerChanged = true;
            }
        }
        
        console.log(`[View] 컨트롤러 호출 전 상태 계산 완료.`, { isCompleted, answerChanged });
        
        if (status) {
            controller.handleMarkStatus(problemId, status);
        } else {
            controller.handleNextClick(problemId, { isCompleted, answerChanged });
        }
        
        moveToNextProblem(problemId);

    }, [controller, orderedProblems, statuses, initialAnswersOnFocus, answers, subjectiveAnswers, moveToNextProblem]);
    
    const handleNavClick = useCallback((problemId: string) => {
        console.log(`[View] 네비게이션 버튼 클릭. handleNavClick 호출. problemId: ${problemId}`);
        startNavigating();
        controller.handleNavClick(problemId);
    }, [controller, startNavigating]);

    const navButtonStates = useMemo(() => {
        console.log(`[View] navButtonStates 재계산 중...`, {
            activeProblemId,
            statuses: new Map(statuses),
            skippedProblemIds: new Set(skippedProblemIds),
        });
        return orderedProblems.map(problem => {
            const isCurrent = activeProblemId === problem.uniqueId;
            const finalStatus = statuses.get(problem.uniqueId);
            const isSkipped = skippedProblemIds.has(problem.uniqueId);
            
            const hasAnswer = problem.problem_type === '서답형'
                ? (subjectiveAnswers.get(problem.uniqueId) || '').trim() !== ''
                : (answers.get(problem.uniqueId)?.size ?? 0) > 0;
            
            const hasCompletingStatus = finalStatus === 'A' || finalStatus === 'B';
            
            const isSolved = hasAnswer && hasCompletingStatus;
            const isMarkedAsDifficultOrUnknown = finalStatus === 'C' || finalStatus === 'D';

            let statusClass = '';
            if (isCurrent) statusClass = 'active';
            else if (isSolved) statusClass = 'solved';
            else if (isSkipped) statusClass = 'skipped';
            else if (isMarkedAsDifficultOrUnknown) statusClass = 'marked-unknown';
            
            return { 
                uniqueId: problem.uniqueId, 
                className: ['nav-button', statusClass].filter(Boolean).join(' ') 
            };
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
                        onCommitAndProceed={handleCommitAndProceed}
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