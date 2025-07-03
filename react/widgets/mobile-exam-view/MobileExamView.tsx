import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useMobileExamStore } from '../../features/mobile-exam-session/model/mobileExamStore';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import type { MarkingStatus } from '../../features/omr-marking';
import './MobileExamView.css';

const HEADER_OFFSET = 60;

const MobileExamView: React.FC = () => {
    const store = useMobileExamStore();
    const { 
        orderedProblems, activeProblemId, answers, statuses, subjectiveAnswers, skippedProblemIds,
        initializeSession, resetSession, startTimerForProblem, markAnswer, markSubjectiveAnswer, markProblemAsSolved, skipProblem,
        completeExam
    } = store;
    
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();

    const isNavigating = useRef(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const handleNavClick = useCallback((problemId: string) => {
        if (activeProblemId === problemId) return;

        isNavigating.current = true;
        startTimerForProblem(problemId);
        
        const problemElement = problemRefs.current.get(problemId);
        if (problemElement) {
            const navContainer = document.querySelector('.mobile-exam-nav-container') as HTMLElement;
            const navHeight = navContainer?.offsetHeight || 0;
            const scrollTop = window.scrollY + problemElement.getBoundingClientRect().top - navHeight - HEADER_OFFSET;
            window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
        setTimeout(() => { isNavigating.current = false; }, 1000);
    }, [activeProblemId, startTimerForProblem]);

    const handleNextClick = useCallback((problemId: string) => {
        skipProblem(problemId);
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
        if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
            handleNavClick(orderedProblems[currentIndex + 1].uniqueId);
        }
    }, [orderedProblems, skipProblem, handleNavClick]);

    const handleMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        markProblemAsSolved(problemId, status);
        
        const problem = orderedProblems.find(p => p.uniqueId === problemId);
        if (!problem) return;

        const isAnswered = (problem.problem_type === '서답형')
            ? (subjectiveAnswers.get(problemId) || '').trim() !== ''
            : (answers.get(problemId)?.size || 0) > 0;
        
        if (status === 'C') {
            console.log(`[MobileExamView] 🚀 'C(모름)' 선택으로 자동 다음 문제 넘기기 실행. 문제 ID: [${problemId}]`);
            const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
            if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
                setTimeout(() => handleNavClick(orderedProblems[currentIndex + 1].uniqueId), 100);
            }
        } else if (isAnswered) {
            console.log(`[MobileExamView] 🚀 '자동 다음 문제 넘기기' 로직 실행. 마킹 문제 ID: [${problemId}]`);
            const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
            if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
                setTimeout(() => handleNavClick(orderedProblems[currentIndex + 1].uniqueId), 100);
            }
        }
    }, [markProblemAsSolved, orderedProblems, answers, subjectiveAnswers, handleNavClick]);

    useEffect(() => {
        const navButton = document.querySelector(`.mobile-exam-nav-container [data-problem-id="${activeProblemId}"]`);
        navButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [activeProblemId]);

    useEffect(() => {
        if (observer.current) observer.current.disconnect();
        
        const options = { root: null, rootMargin: `-48% 0px -48% 0px`, threshold: 0 };

        observer.current = new IntersectionObserver(entries => {
            if (isNavigating.current) return;
            
            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                const problemId = intersectingEntry.target.getAttribute('data-unique-id');
                const currentActiveIdInStore = useMobileExamStore.getState().activeProblemId;

                if (problemId && problemId !== currentActiveIdInStore) {
                    useMobileExamStore.getState().startTimerForProblem(problemId);
                }
            }
        }, options);

        problemRefs.current.forEach(el => observer.current?.observe(el));
        return () => {
            observer.current?.disconnect();
        };
    }, [orderedProblems]);

    useEffect(() => {
        initializeSession(orderedProblems);
        return () => {
            resetSession();
        };
    }, [initializeSession, resetSession, orderedProblems]);

    const handleSubmitExam = () => {
        completeExam();
        alert("시험이 제출되었습니다! 수고하셨습니다.");
    };

    if (orderedProblems.length === 0) {
        return <div className="mobile-exam-status"><h2>모바일 시험지</h2><p>문제를 불러오는 중이거나, 출제된 문제가 없습니다.</p></div>;
    }

    return (
        <div className="mobile-exam-view" style={{ '--base-font-size': baseFontSize } as React.CSSProperties}>
            <div className="mobile-exam-title-header"><h1>모바일 시험지</h1></div>
            <nav className="mobile-exam-nav-container">
                <div className="mobile-exam-nav-scroll-area">
                    {orderedProblems.map((problem, index) => {
                        const isCurrent = activeProblemId === problem.uniqueId;
                        const finalStatus = statuses.get(problem.uniqueId);
                        const isSkipped = skippedProblemIds.has(problem.uniqueId);
                        
                        // [핵심 수정] 완료 상태 로직 변경
                        // 1. 정답이 입력되었는지 확인
                        const hasAnswer = problem.problem_type === '서답형'
                            ? (subjectiveAnswers.get(problem.uniqueId) || '').trim() !== ''
                            : (answers.get(problem.uniqueId)?.size ?? 0) > 0;
                        
                        // 2. 'A', 'B', 'D' 상태인지 확인
                        const hasCompletingStatus = finalStatus === 'A' || finalStatus === 'B' || finalStatus === 'D';
                        
                        // 3. 최종 완료 상태 결정
                        const isSolved = hasAnswer && hasCompletingStatus;
                        const isMarkedAsUnknown = finalStatus === 'C';

                        // [핵심 수정] 클래스명 조합 로직 변경
                        const buttonClass = [
                            'nav-button',
                            isCurrent && 'active',
                            !isCurrent && isMarkedAsUnknown && 'marked-c',
                            !isCurrent && isSolved && 'solved',
                            !isCurrent && !isSolved && !isMarkedAsUnknown && isSkipped && 'skipped',
                        ].filter(Boolean).join(' ');

                        return (
                            <button key={problem.uniqueId} type="button" data-problem-id={problem.uniqueId} className={buttonClass} onClick={() => handleNavClick(problem.uniqueId)}>
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
                        onMarkStatus={handleMarkStatus}
                        onNextClick={handleNextClick}
                        isSubjective={problem.problem_type === '서답형'}
                        currentSubjectiveAnswer={subjectiveAnswers.get(problem.uniqueId) || ''}
                        onMarkSubjectiveAnswer={markSubjectiveAnswer}
                    />
                ))}
                <button type="button" className="omr-button submit-exam-button" onClick={handleSubmitExam}>
                    시험지 제출하기
                </button>
            </div>
        </div>
    );
};

export default MobileExamView;