import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useMobileExamStore } from '../../features/mobile-exam-session/model/mobileExamStore';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import { useLayoutStore } from '../../shared/store/layoutStore';
import type { MarkingStatus } from '../../features/omr-marking';
import './MobileExamView.css';

const HEADER_OFFSET = 60;

const formatTimer = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const MobileExamView: React.FC = () => {
    const store = useMobileExamStore();
    const { 
        orderedProblems, activeProblemId, currentTimer, answers, statuses, subjectiveAnswers, skippedProblemIds, problemTimes,
        initializeSession, resetSession, startTimerForProblem, markAnswer, markSubjectiveAnswer, markProblemAsSolved, skipProblem
    } = store;
    
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();
    const { setTimerDisplay } = useLayoutStore.getState();

    const isNavigating = useRef(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const solvedProblemIds = useMemo(() => {
        return new Set(
            orderedProblems.filter(p => {
                const isMarked = statuses.has(p.uniqueId);
                const hasAnswer = (p.problem_type === '서답형')
                    ? (subjectiveAnswers.get(p.uniqueId) || '').trim() !== ''
                    : (answers.get(p.uniqueId)?.size || 0) > 0;
                return isMarked && hasAnswer;
            }).map(p => p.uniqueId)
        );
    }, [answers, statuses, subjectiveAnswers, orderedProblems]);

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
        const isAnswered = (orderedProblems.find(p => p.uniqueId === problemId)?.problem_type === '서답형')
            ? (subjectiveAnswers.get(problemId) || '').trim() !== ''
            : (answers.get(problemId)?.size || 0) > 0;

        markProblemAsSolved(problemId, status);
        
        if (isAnswered) {
             console.log(`[MobileExamView] 🚀 '자동 다음 문제 넘기기' 로직 실행. 마킹 문제 ID: [${problemId}]`);
            const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
            if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
                setTimeout(() => handleNavClick(orderedProblems[currentIndex + 1].uniqueId), 100);
            }
        }
    }, [markProblemAsSolved, orderedProblems, answers, subjectiveAnswers, handleNavClick]);
    
    useEffect(() => {
        setTimerDisplay({ isVisible: true, text: formatTimer(currentTimer) });
        // [로그 복원]
        if (useMobileExamStore.getState().timerStartTime) {
            console.log(`[MobileExamView] ⏳ TIMER_TICK: 문제[${activeProblemId}] 풀이 중... ${Math.floor(currentTimer)}초 경과`);
        }
    }, [currentTimer, activeProblemId, setTimerDisplay]);

    useEffect(() => {
        const navButton = document.querySelector(`.mobile-exam-nav-container [data-problem-id="${activeProblemId}"]`);
        navButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [activeProblemId]);

    useEffect(() => {
        // [로그 추가] 옵저버가 언제 설정되는지 확인
        console.log(`[MobileExamView] 🔎 Observer useEffect 실행: ${problemRefs.current.size}개의 문제 요소를 감시합니다.`);

        if (observer.current) observer.current.disconnect();
        
        const options = {
            root: null,
            rootMargin: `-48% 0px -48% 0px`,
            threshold: 0
        };

        observer.current = new IntersectionObserver(entries => {
            // [로그 추가] 옵저버 콜백이 실행되는지 확인
            console.log(`[MobileExamView] 👁️ Observer 콜백 실행됨. 감지된 entries:`, entries);

            if (isNavigating.current) {
                console.log("[MobileExamView] 👁️ 탐색 중이므로 Observer 콜백을 무시합니다.");
                return;
            }
            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                const problemId = intersectingEntry.target.getAttribute('data-unique-id');
                const currentActiveIdInStore = useMobileExamStore.getState().activeProblemId;

                // [로그 추가] 조건문 내부 값 확인
                console.log(`[MobileExamView] 👁️ 겹치는 요소 발견. ID: ${problemId}, 현재 활성 ID: ${currentActiveIdInStore}`);
                
                if (problemId && problemId !== currentActiveIdInStore) {
                    console.log(`[MobileExamView] 👀 SCROLL_DETECT: [${problemId}] 활성 문제로 변경합니다.`);
                    useMobileExamStore.getState().startTimerForProblem(problemId);
                } else {
                    console.log(`[MobileExamView] 👁️ 감지된 ID(${problemId})가 현재 활성 ID와 동일하거나 유효하지 않아 무시합니다.`);
                }
            }
        }, options);

        problemRefs.current.forEach(el => observer.current?.observe(el));
        return () => {
            console.log("[MobileExamView] 🔎 Observer 클린업 실행.");
            observer.current?.disconnect();
        };
    }, [orderedProblems]);

    useEffect(() => {
        initializeSession(orderedProblems);
        return () => {
            resetSession();
        };
    }, [initializeSession, resetSession, orderedProblems]);

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
                        const isSolved = solvedProblemIds.has(problem.uniqueId);
                        const isSkipped = skippedProblemIds.has(problem.uniqueId);
                        const buttonClass = `nav-button ${isCurrent ? 'active' : ''} ${!isCurrent && isSolved ? 'solved' : ''} ${!isCurrent && !isSolved && isSkipped ? 'skipped' : ''}`.trim();
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
                <button type="button" className="omr-button submit-exam-button" onClick={() => alert("제출 완료!")}>
                    시험지 제출하기
                </button>
            </div>
        </div>
    );
};

export default MobileExamView;