import React, { useRef, useEffect, useCallback } from 'react';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamAnswerStore } from '../../features/mobile-exam-session/model/mobileExamAnswerStore'; // [핵심]
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore'; // [핵심]
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import type { MarkingStatus } from '../../features/omr-marking';
import './MobileExamView.css';

const HEADER_OFFSET = 60;

const MobileExamView: React.FC = () => {
    // [핵심] 각 Store에서 필요한 상태와 액션을 구조 분해 할당
    const { orderedProblems, activeProblemId, skippedProblemIds, isSessionActive,
            setActiveProblemId, skipProblem, completeExam, initializeSession, resetSession 
    } = useMobileExamSessionStore();
    
    const { answers, subjectiveAnswers, statuses, markAnswer, markSubjectiveAnswer, markStatus 
    } = useMobileExamAnswerStore();

    const { finalizeProblemTime } = useMobileExamTimeStore();
    
    const { baseFontSize, contentFontSizeEm, useSequentialNumbering } = useExamLayoutStore();

    const isNavigating = useRef(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const problemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // [핵심] initializeSession/resetSession은 이제 props가 아닌 hook에서 직접 가져옴
    useEffect(() => {
        if (orderedProblems.length > 0 && !isSessionActive) {
            initializeSession(orderedProblems);
        }
        return () => {
            if(isSessionActive) {
                // resetSession(); // 페이지 이동 시 초기화는 MobileExamPage에서 담당
            }
        };
    }, [orderedProblems, initializeSession, resetSession, isSessionActive]);

    const handleNavClick = useCallback((problemId: string) => {
        if (activeProblemId === problemId) return;
        isNavigating.current = true;
        setActiveProblemId(problemId);
        
        const problemElement = problemRefs.current.get(problemId);
        if (problemElement) {
            const navContainer = document.querySelector('.mobile-exam-nav-container') as HTMLElement;
            const navHeight = navContainer?.offsetHeight || 0;
            const scrollTop = window.scrollY + problemElement.getBoundingClientRect().top - navHeight - HEADER_OFFSET;
            window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
        setTimeout(() => { isNavigating.current = false; }, 1000);
    }, [activeProblemId, setActiveProblemId]);

    const handleNextClick = useCallback((problemId: string) => {
        skipProblem(problemId);
        const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
        if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
            handleNavClick(orderedProblems[currentIndex + 1].uniqueId);
        }
    }, [orderedProblems, skipProblem, handleNavClick]);

    const handleMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        // [핵심] 각 Store의 액션을 순서대로 호출
        markStatus(problemId, status);
        finalizeProblemTime(problemId);
        
        const problem = orderedProblems.find(p => p.uniqueId === problemId);
        if (!problem) return;

        const currentAnswers = useMobileExamAnswerStore.getState().answers;
        const currentSubjectiveAnswers = useMobileExamAnswerStore.getState().subjectiveAnswers;

        const isAnswered = (problem.problem_type === '서답형')
            ? (currentSubjectiveAnswers.get(problemId) || '').trim() !== ''
            : (currentAnswers.get(problemId)?.size || 0) > 0;
        
        if (status === 'C' || isAnswered) {
            const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
            if (currentIndex > -1 && currentIndex < orderedProblems.length - 1) {
                setTimeout(() => handleNavClick(orderedProblems[currentIndex + 1].uniqueId), 100);
            }
        }
    }, [markStatus, finalizeProblemTime, orderedProblems, handleNavClick]);

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
                const currentActiveIdInStore = useMobileExamSessionStore.getState().activeProblemId;

                if (problemId && problemId !== currentActiveIdInStore) {
                    setActiveProblemId(problemId);
                }
            }
        }, options);

        problemRefs.current.forEach(el => observer.current?.observe(el));
        return () => {
            observer.current?.disconnect();
        };
    }, [orderedProblems, setActiveProblemId]);

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
                        
                        const hasAnswer = problem.problem_type === '서답형'
                            ? (subjectiveAnswers.get(problem.uniqueId) || '').trim() !== ''
                            : (answers.get(problem.uniqueId)?.size ?? 0) > 0;
                        
                        const hasCompletingStatus = finalStatus === 'A' || finalStatus === 'B' || finalStatus === 'D';
                        
                        const isSolved = hasAnswer && hasCompletingStatus;
                        const isMarkedAsUnknown = finalStatus === 'C';

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