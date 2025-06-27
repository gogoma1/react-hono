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
                // [수정] 두 번째 인자인 problemBoxMinHeight를 전달합니다.
                startLayoutCalculation(selectedProblems, problemBoxMinHeight);
            } else {
                resetLayout();
            }
        }
    // [수정] 의존성 배열에 problemBoxMinHeight 추가
    }, [selectedProblems, problemBoxMinHeight, startLayoutCalculation, resetLayout]);

    useEffect(() => {
        return () => {
            resetLayout();
        };
    }, [resetLayout]);
}