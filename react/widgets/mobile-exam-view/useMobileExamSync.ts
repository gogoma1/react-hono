import { useRef, useEffect, useCallback, RefObject } from 'react'; // [수정] useCallback 임포트 추가
import { useMobileExamSessionStore } from '../../features/mobile-exam-session/model/mobileExamSessionStore';
import type { ProcessedProblem } from '../../features/problem-publishing';

const HEADER_OFFSET = 60; // MobileExamView에서 사용하던 상수

interface UseMobileExamSyncProps {
    orderedProblems: ProcessedProblem[];
    problemRefs: RefObject<Map<string, HTMLDivElement>>;
}

/**
 * MobileExamView의 DOM과 상태를 동기화하는 Side Effect를 관리하는 훅.
 * - IntersectionObserver를 통해 현재 보이는 문제를 감지하고 상태를 업데이트합니다.
 * - activeProblemId가 변경되면 해당 문제로 부드럽게 스크롤합니다.
 * @param {UseMobileExamSyncProps} props - 동기화에 필요한 데이터와 ref
 */
export function useMobileExamSync({ orderedProblems, problemRefs }: UseMobileExamSyncProps) {
    const { activeProblemId, setActiveProblemId } = useMobileExamSessionStore();
    const isNavigatingByUser = useRef(false); // 사용자 클릭에 의한 네비게이션 여부
    const observer = useRef<IntersectionObserver | null>(null);

    // 1. activeProblemId가 변경될 때 스크롤 위치와 네비게이션 버튼을 동기화하는 Effect
    useEffect(() => {
        if (activeProblemId && problemRefs.current) {
            const problemElement = problemRefs.current.get(activeProblemId);
            if (problemElement) {
                // 사용자가 버튼을 클릭해서 스크롤이 필요한 경우에만 실행
                if (isNavigatingByUser.current) {
                    const navContainer = document.querySelector('.mobile-exam-nav-container') as HTMLElement;
                    const navHeight = navContainer?.offsetHeight || 0;
                    
                    const scrollTop = window.scrollY + problemElement.getBoundingClientRect().top - navHeight - HEADER_OFFSET;
                    window.scrollTo({ top: scrollTop, behavior: 'smooth' });

                    // 스크롤 애니메이션이 끝날 시간을 고려하여 플래그를 리셋
                    setTimeout(() => { isNavigatingByUser.current = false; }, 800);
                }
                
                // 현재 활성화된 문제에 해당하는 네비게이션 버튼을 가운데로 스크롤
                const navButton = document.querySelector(`.mobile-exam-nav-container [data-problem-id="${activeProblemId}"]`);
                navButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [activeProblemId, problemRefs]);

    // 2. IntersectionObserver를 설정하고, 스크롤에 따라 activeProblemId를 동기화하는 Effect
    useEffect(() => {
        // 기존 Observer가 있다면 연결 해제
        if (observer.current) {
            observer.current.disconnect();
        }

        const handleIntersect: IntersectionObserverCallback = (entries) => {
            // 사용자가 직접 클릭하여 스크롤 중일 때는 Observer의 감지를 무시
            if (isNavigatingByUser.current) return;

            // 화면 중앙에 가장 가까운 요소를 찾음
            const intersectingEntry = entries.find(entry => entry.isIntersecting);

            if (intersectingEntry) {
                const problemId = intersectingEntry.target.getAttribute('data-unique-id');
                const currentActiveId = useMobileExamSessionStore.getState().activeProblemId;
                
                if (problemId && problemId !== currentActiveId) {
                    setActiveProblemId(problemId);
                }
            }
        };

        // 화면 상하 48% 지점을 교차할 때 감지하도록 설정 (화면 중앙 부근)
        const options: IntersectionObserverInit = {
            root: null,
            rootMargin: `-48% 0px -48% 0px`,
            threshold: 0,
        };

        observer.current = new IntersectionObserver(handleIntersect, options);

        // 모든 문제 요소에 Observer 연결
        problemRefs.current?.forEach(el => observer.current?.observe(el));

        // 컴포넌트 언마운트 시 Observer 연결 해제
        return () => observer.current?.disconnect();
    }, [orderedProblems, problemRefs, setActiveProblemId]);

    // 사용자가 네비게이션 버튼을 클릭했을 때 호출될 함수
    const startNavigating = useCallback(() => {
        isNavigatingByUser.current = true;
    }, []);

    return { startNavigating };
}