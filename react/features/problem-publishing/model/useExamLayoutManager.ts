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
            prevSelectedIdsRef.current = currentSelectedIds; // 이전 ID 목록을 현재 목록으로 업데이트

            if (selectedProblems.length > 0) {
                startLayoutCalculation(selectedProblems, problemBoxMinHeight);
            } else {
                resetLayout();
            }
        }
    }, [selectedProblems, problemBoxMinHeight, startLayoutCalculation, resetLayout]);

    // [핵심 수정] 페이지 이동 시 레이아웃을 초기화하던 useEffect 클린업 함수를 제거합니다.
    // 이로써 `ProblemPublishingPage`를 벗어나도 `MobileExamPage`에서 상태를 유지할 수 있습니다.
}