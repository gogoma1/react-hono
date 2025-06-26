import { useEffect, useRef } from 'react';
import { useExamLayoutStore } from './examLayoutStore';
import type { ProcessedProblem } from './problemPublishingStore';

interface ExamLayoutManagerProps {
    selectedProblems: ProcessedProblem[];
}

/**
 * 선택된 문제 목록을 받아 시험지 레이아웃 계산을 관리하는 훅.
 */
export function useExamLayoutManager({ selectedProblems }: ExamLayoutManagerProps) {
    const { startLayoutCalculation, resetLayout } = useExamLayoutStore();
    
    // [수정] 이전 uniqueId 목록을 저장하기 위한 ref
    const prevSelectedIdsRef = useRef<string>('');

    useEffect(() => {
        // [수정] 현재 선택된 문제들의 ID를 정렬하여 고유한 문자열로 만듭니다.
        // 이렇게 하면 순서가 바뀌어도 동일한 문제 세트이면 같은 문자열이 됩니다.
        const currentSelectedIds = selectedProblems.map(p => p.uniqueId).sort().join(',');

        // [수정] ID 목록 문자열이 이전과 다를 경우에만 전체 재계산을 실행합니다.
        if (currentSelectedIds !== prevSelectedIdsRef.current) {
            console.log('[useExamLayoutManager] Detected change in selected problems. Triggering full layout calculation.');
            prevSelectedIdsRef.current = currentSelectedIds; // 이전 ID 목록을 현재 목록으로 업데이트

            if (selectedProblems.length > 0) {
                startLayoutCalculation(selectedProblems);
            } else {
                resetLayout();
            }
        }
        // ID 목록이 같다면 (예: 수정 모드 진입으로 인한 참조 변경) 아무 작업도 하지 않습니다.
        // 텍스트 수정으로 인한 높이 변경은 setItemHeight -> debounced recalculation 플로우가 담당합니다.

    }, [selectedProblems, startLayoutCalculation, resetLayout]);

    useEffect(() => {
        // 컴포넌트가 언마운트될 때 레이아웃을 초기화합니다.
        return () => {
            resetLayout();
        };
    }, [resetLayout]);
}