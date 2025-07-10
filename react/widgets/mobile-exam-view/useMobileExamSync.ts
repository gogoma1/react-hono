import { useRef, useEffect, useCallback, RefObject } from 'react';
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import type { ProcessedProblem } from '../../features/problem-publishing';

const HEADER_OFFSET = 60; 

interface UseMobileExamSyncProps {
    orderedProblems: ProcessedProblem[];
    problemRefs: RefObject<Map<string, HTMLDivElement>>;
}

export function useMobileExamSync({ orderedProblems, problemRefs }: UseMobileExamSyncProps) {
    const { activeProblemId, setActiveProblemId } = useMobileExamSessionStore();
    const isNavigatingByUser = useRef(false);
    const observer = useRef<IntersectionObserver | null>(null);

    // [핵심 수정] 스크롤 로직을 단순화하여 activeProblemId 변경 시 항상 스크롤을 시도하도록 변경
    useEffect(() => {
        if (!activeProblemId || !problemRefs.current) return;
        
        const problemElement = problemRefs.current.get(activeProblemId);
        
        if (problemElement && isNavigatingByUser.current) {
            const navContainer = document.querySelector('.mobile-exam-nav-container') as HTMLElement;
            const navHeight = navContainer?.offsetHeight || 0;
            
            const scrollTop = window.scrollY + problemElement.getBoundingClientRect().top - navHeight - HEADER_OFFSET;
            
            window.scrollTo({ top: scrollTop, behavior: 'smooth' });
            
            // isNavigatingByUser 플래그는 부드러운 스크롤 애니메이션이 끝날 즈음 초기화
            const scrollTimeout = setTimeout(() => {
                isNavigatingByUser.current = false;
            }, 800);

            return () => clearTimeout(scrollTimeout);
        }

        // 하단 네비게이션 바의 버튼도 스크롤
        const navButton = document.querySelector(`.mobile-exam-nav-container [data-problem-id="${activeProblemId}"]`);
        navButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        
    }, [activeProblemId, problemRefs]); // 의존성 배열 유지

    // IntersectionObserver 로직 (변경 없음)
    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        const handleIntersect: IntersectionObserverCallback = (entries) => {
            if (isNavigatingByUser.current) return;

            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                const problemId = intersectingEntry.target.getAttribute('data-unique-id');
                const currentActiveId = useMobileExamSessionStore.getState().activeProblemId;
                
                if (problemId && problemId !== currentActiveId) {
                    setActiveProblemId(problemId);
                }
            }
        };

        const options: IntersectionObserverInit = { root: null, rootMargin: `-48% 0px -48% 0px`, threshold: 0 };
        observer.current = new IntersectionObserver(handleIntersect, options);
        problemRefs.current?.forEach(el => observer.current?.observe(el));

        return () => observer.current?.disconnect();
    }, [orderedProblems, problemRefs, setActiveProblemId]);

    const startNavigating = useCallback(() => {
        isNavigatingByUser.current = true;
    }, []);

    return { startNavigating };
}