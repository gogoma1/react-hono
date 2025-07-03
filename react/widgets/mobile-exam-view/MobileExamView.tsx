import React, { useRef, useCallback, useMemo } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import { useMobileExamController } from './useMobileExamController';
import { useMobileExamSync } from './useMobileExamSync'; // [핵심] 신규 훅 임포트
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore';
import type { MarkingStatus } from '../../features/omr-marking';
import './MobileExamView.css';

const MobileExamView: React.FC = () => {
    // 1. 상태 및 컨트롤러 가져오기
    const { orderedProblems, activeProblemId, skippedProblemIds } = useMobileExamSessionStore();
    const { answers, subjectiveAnswers, statuses, markAnswer, markSubjectiveAnswer } = useMobileExamAnswerStore();
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();
    
    // 컨트롤러는 사용자 액션에 대한 순수 로직을 담당
    const controller = useMobileExamController();
    
    // 2. DOM 요소 참조 및 동기화 로직 분리
    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // [핵심] 모든 useEffect 로직을 useMobileExamSync 훅으로 위임
    const { startNavigating } = useMobileExamSync({ orderedProblems, problemRefs });

    // 3. 이벤트 핸들러 정의
    const handleNavClick = useCallback((problemId: string) => {
        startNavigating(); // 스크롤이 사용자 클릭에 의한 것임을 알림
        controller.handleNavClick(problemId);
    }, [controller, startNavigating]);

    const moveToNextProblem = useCallback((currentProblemId: string) => {
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === currentProblemId);
        if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
            const nextProblemId = orderedProblems[currentIndex + 1].uniqueId;
            startNavigating(); // 다음 문제로 이동하는 것도 사용자 액션으로 간주
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
        
        // C(모름)를 선택했거나, 답을 이미 마킹한 상태에서 상태를 선택하면 다음 문제로 이동
        if (status === 'C' || isAnswered) {
            moveToNextProblem(problemId);
        }
    }, [controller, orderedProblems, moveToNextProblem]);

    // 4. 렌더링 로직 (Memoization)
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

    // 5. 최종 JSX 렌더링
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
            <header className="mobile-exam-title-header"><h1>모바일 시험지</h1></header>
            
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
                <button type="button" className="omr-button submit-exam-button" onClick={controller.handleSubmitExam}>
                    시험지 제출하기
                </button>
            </div>
        </div>
    );
};

export default MobileExamView;