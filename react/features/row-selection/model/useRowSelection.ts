// filepath: monorepo/client/src2/features/row-selection/model/useRowSelection.ts
import { useState, useCallback, useMemo } from 'react';

interface UseRowSelectionProps<T extends string | number> {
    initialSelectedIds?: Set<T>;
    allItems?: T[]; // 전체 선택/해제 기능을 위해 모든 항목의 ID 목록 (선택 사항)
}

interface UseRowSelectionReturn<T extends string | number> {
    selectedIds: Set<T>;
    toggleRow: (id: T) => void;
    isRowSelected: (id: T) => boolean;
    toggleSelectAll: () => void; // 모든 항목 (allItems) 기준 또는 현재 보이는 항목 기준일 수 있음
    isAllSelected: boolean; // allItems 기준으로 계산
    clearSelection: () => void;
    // 필요에 따라 추가 함수들: addMultiple, removeMultiple 등
}

export function useRowSelection<T extends string | number>({
    initialSelectedIds = new Set<T>(),
    allItems = [], // 전체 항목 ID 배열
}: UseRowSelectionProps<T> = {}): UseRowSelectionReturn<T> {
    const [selectedIds, setSelectedIds] = useState<Set<T>>(initialSelectedIds);

    const toggleRow = useCallback((id: T) => {
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    }, []);

    const isRowSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // isAllSelected는 allItems가 제공되었을 때 의미가 있음
    const isAllSelected = useMemo(() => {
        if (allItems.length === 0) return false;
        return allItems.every(id => selectedIds.has(id));
    }, [allItems, selectedIds]);

    const toggleSelectAll = useCallback(() => {
        if (allItems.length === 0) return;

        if (isAllSelected) {
            // 모두 선택된 상태면, 모두 해제 (또는 allItems에 해당하는 것만 해제)
            // 여기서는 allItems 기준으로 동작
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.delete(id));
            setSelectedIds(newSelectedIds);
            // 또는 간단히: setSelectedIds(new Set()); // 모든 선택 해제
        } else {
            // 하나라도 미선택이면, allItems 모두 선택
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.add(id));
            setSelectedIds(newSelectedIds);
        }
    }, [allItems, isAllSelected, selectedIds]); // selectedIds 의존성 추가

    return {
        selectedIds,
        toggleRow,
        isRowSelected,
        toggleSelectAll,
        isAllSelected,
        clearSelection,
    };
}