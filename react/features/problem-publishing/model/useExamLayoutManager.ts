import { useEffect, useRef } from 'react';
import { useExamLayoutStore } from './examLayoutStore';
import type { ProcessedProblem } from './problemPublishingStore';

interface ExamLayoutManagerProps {
    selectedProblems: ProcessedProblem[];
    problemBoxMinHeight: number;
}

/**
 * 선택된 문제 목록을 받아 시험지 레이아웃 계산을 관리하는 훅.
 */
export function useExamLayoutManager({ selectedProblems, problemBoxMinHeight }: ExamLayoutManagerProps) {
    const { startLayoutCalculation, resetLayout } = useExamLayoutStore();
    
    const prevSelectedIdsRef = useRef<string>('');

    useEffect(() => {
        const currentSelectedIds = selectedProblems.map(p => p.uniqueId).sort().join(',');

        if (currentSelectedIds !== prevSelectedIdsRef.current) {
            console.log('[useExamLayoutManager] Detected change in selected problems. Triggering full layout calculation.');
            prevSelectedIdsRef.current = currentSelectedIds;

            if (selectedProblems.length > 0) {
                // 이 함수가 호출될 때의 problemBoxMinHeight 값을 인자로 넘겨줍니다.
                startLayoutCalculation(selectedProblems, problemBoxMinHeight);
            } else {
                resetLayout();
            }
        }
    // [핵심 수정] 의존성 배열에서 problemBoxMinHeight를 제거합니다.
    // 이제 이 useEffect는 selectedProblems가 변경될 때만 실행됩니다.
    }, [selectedProblems, startLayoutCalculation, resetLayout]);

}