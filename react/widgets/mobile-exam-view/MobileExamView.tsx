import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useExamLayoutStore } from '../../features/problem-publishing/model/examLayoutStore';
import { useProblemPublishingStore, type ProcessedProblem } from '../../features/problem-publishing/model/problemPublishingStore';
import MobileExamProblem from '../../entities/exam/ui/MobileExamProblem';
import type { AnswerNumber, MarkingStatus } from '../../features/omr-marking';
import './MobileExamView.css';

const HEADER_OFFSET = 60;

const MobileExamView: React.FC = () => {
    const distributedPages = useExamLayoutStore(state => state.distributedPages);
    const placementMap = useExamLayoutStore(state => state.placementMap);
    const baseFontSize = useExamLayoutStore(state => state.baseFontSize);
    const contentFontSizeEm = useExamLayoutStore(state => state.contentFontSizeEm);
    const useSequentialNumbering = useExamLayoutStore(state => state.useSequentialNumbering);
    const allProblems = useProblemPublishingStore(
        state => state.draftProblems ?? state.initialProblems
    );
    
    // [핵심 수정] 정답 상태를 Set으로 변경하여 중복 선택을 지원
    const [answers, setAnswers] = useState<Map<string, Set<AnswerNumber>>>(new Map());
    const [statuses, setStatuses] = useState<Map<string, MarkingStatus>>(new Map());

    const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
    const problemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const navContainerRef = useRef<HTMLDivElement | null>(null);
    const isNavigating = useRef(false);

    // [핵심 수정] 정답 마킹 로직을 Set에 맞게 수정
    const handleMarkAnswer = useCallback((problemId: string, answer: AnswerNumber) => {
        setAnswers(prevAnswers => {
            const newAnswers = new Map(prevAnswers);
            const currentAnswerSet = new Set(newAnswers.get(problemId) || []);
            
            if (currentAnswerSet.has(answer)) {
                currentAnswerSet.delete(answer);
            } else {
                currentAnswerSet.add(answer);
            }

            if (currentAnswerSet.size === 0) {
                newAnswers.delete(problemId);
            } else {
                newAnswers.set(problemId, currentAnswerSet);
            }
            
            return newAnswers;
        });
    }, []);

    const latestProblemsMap = useMemo(() => new Map(allProblems.map(p => [p.uniqueId, p])), [allProblems]);

    const orderedProblems = useMemo(() => {
        const flatSortedItems = distributedPages.flatMap(pageItems => 
            [...pageItems].filter(item => item.type === 'problem')
            .sort((a, b) => (placementMap.get(a.uniqueId)?.column ?? 1) - (placementMap.get(b.uniqueId)?.column ?? 1))
        );
        return flatSortedItems.map(item => latestProblemsMap.get((item.data as ProcessedProblem).uniqueId)).filter((p): p is ProcessedProblem => !!p);
    }, [distributedPages, placementMap, latestProblemsMap]);

    const handleNavClick = useCallback((problemId: string) => {
        isNavigating.current = true;
        setActiveProblemId(problemId);

        const targetElement = problemRefs.current.get(problemId);
        const navElement = navContainerRef.current;
        
        if (targetElement && navElement) {
            const navHeight = navElement.offsetHeight;
            const targetRect = targetElement.getBoundingClientRect();
            
            const scrollTop = window.scrollY + targetRect.top - navHeight - HEADER_OFFSET;
            
            window.scrollTo({ top: scrollTop, behavior: 'smooth' });
            
            setTimeout(() => {
                isNavigating.current = false;
            }, 1000); 
        } else {
            console.error("Scroll failed: Target element or nav element not found.");
            isNavigating.current = false;
        }
    }, []);
    
    // [핵심 수정] 상태 마킹 시 자동 스크롤 기능 추가
    const handleMarkStatus = useCallback((problemId: string, status: MarkingStatus) => {
        setStatuses(prevStatuses => {
            const newStatuses = new Map(prevStatuses);
            if (newStatuses.get(problemId) === status) {
                newStatuses.delete(problemId);
            } else {
                newStatuses.set(problemId, status);
            }
            return newStatuses;
        });

        // 정답이 마킹된 상태에서 상태 버튼을 누르면 다음 문제로 이동
        const answerForProblem = answers.get(problemId);
        if (answerForProblem && answerForProblem.size > 0) {
            const currentIndex = orderedProblems.findIndex(p => p.uniqueId === problemId);
            if (currentIndex !== -1 && currentIndex < orderedProblems.length - 1) {
                const nextProblemId = orderedProblems[currentIndex + 1].uniqueId;
                // 약간의 딜레이를 주어 사용자가 상태 변경을 인지하게 한 후 스크롤
                setTimeout(() => handleNavClick(nextProblemId), 100);
            }
        }
    }, [answers, orderedProblems, handleNavClick]);

    useEffect(() => {
        const handleUserInteraction = () => { if (isNavigating.current) isNavigating.current = false; };
        window.addEventListener('wheel', handleUserInteraction, { passive: true });
        window.addEventListener('touchstart', handleUserInteraction, { passive: true });
        return () => {
            window.removeEventListener('wheel', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
        };
    }, []);

    useEffect(() => {
        const topMargin = (navContainerRef.current?.offsetHeight || 50) + HEADER_OFFSET;
        
        const observer = new IntersectionObserver(
            (entries) => {
                if (isNavigating.current) return;
                const topmostIntersectingEntry = entries.filter(e => e.isIntersecting).reduce((topmost, current) => !topmost || current.boundingClientRect.top < topmost.boundingClientRect.top ? current : topmost, null as IntersectionObserverEntry | null);
                if (topmostIntersectingEntry) {
                    const id = topmostIntersectingEntry.target.getAttribute('data-unique-id');
                    if (id) setActiveProblemId(id);
                }
            },
            { root: null, rootMargin: `-${topMargin}px 0px -85% 0px`, threshold: 0 }
        );

        const currentRefs = problemRefs.current;
        currentRefs.forEach(el => { if (el) observer.observe(el); });
        return () => { currentRefs.forEach(el => { if (el) observer.unobserve(el); }); observer.disconnect(); };
    }, [orderedProblems]);

    useEffect(() => {
        if (activeProblemId && navContainerRef.current) {
            navContainerRef.current.querySelector<HTMLButtonElement>(`[data-problem-id="${activeProblemId}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [activeProblemId]);

    if (orderedProblems.length === 0) {
        return (
            <div className="mobile-exam-status">
                <h2>모바일 시험지</h2>
                <p>문제가 선택되지 않았습니다. '문제 출제' 페이지에서 먼저 문제를 선택하고 시험지를 생성해주세요.</p>
            </div>
        );
    }
    
    return (
        <div className="mobile-exam-view" style={{ '--base-font-size': baseFontSize } as React.CSSProperties}>
            <div className="mobile-exam-title-header"><h1>모바일 시험지</h1></div>
            <nav ref={navContainerRef} className="mobile-exam-nav-container">
                <div className="mobile-exam-nav-scroll-area">
                    {orderedProblems.map((problem, index) => (
                        <button key={problem.uniqueId} type="button" data-problem-id={problem.uniqueId}
                            className={`nav-button ${activeProblemId === problem.uniqueId ? 'active' : ''}`}
                            onClick={() => handleNavClick(problem.uniqueId)}
                            aria-label={`${useSequentialNumbering ? index + 1 : problem.display_question_number}번 문제로 이동`}
                        >{useSequentialNumbering ? index + 1 : problem.display_question_number}</button>
                    ))}
                </div>
            </nav>
            <div className="mobile-exam-problem-list">
                {orderedProblems.map(problem => (
                    <MobileExamProblem ref={el => { if (el) problemRefs.current.set(problem.uniqueId, el); else problemRefs.current.delete(problem.uniqueId); }}
                        key={problem.uniqueId} problem={problem} allProblems={allProblems} useSequentialNumbering={useSequentialNumbering}
                        contentFontSizeEm={contentFontSizeEm} contentFontFamily="'NanumGothic', 'Malgun Gothic', sans-serif"
                        currentAnswers={answers.get(problem.uniqueId) || null} 
                        currentStatus={statuses.get(problem.uniqueId) || null}
                        onMarkAnswer={handleMarkAnswer} 
                        onMarkStatus={handleMarkStatus}
                    />
                ))}
            </div>
        </div>
    );
};

export default MobileExamView;