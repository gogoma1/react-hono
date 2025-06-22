// ./react/features/row-selection/model/useRowSelection.ts
import { useState, useCallback, useMemo } from 'react';

interface UseRowSelectionProps<T extends string | number> {
    initialSelectedIds?: Set<T>;
    allItems?: T[]; 
}

interface UseRowSelectionReturn<T extends string | number> {
    selectedIds: Set<T>;
    toggleRow: (id: T) => void;
    isRowSelected: (id: T) => boolean;
    toggleSelectAll: () => void;
    isAllSelected: boolean;
    clearSelection: () => void;
    toggleItems: (ids: T[]) => void; // [추가] 부분 선택/해제 함수
}

export function useRowSelection<T extends string | number>({
    initialSelectedIds = new Set<T>(),
    allItems = [],
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

    const isAllSelected = useMemo(() => {
        if (allItems.length === 0) return false;
        return allItems.every(id => selectedIds.has(id));
    }, [allItems, selectedIds]);

    const toggleSelectAll = useCallback(() => {
        if (allItems.length === 0) return;

        if (isAllSelected) {
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.delete(id));
            setSelectedIds(newSelectedIds);
        } else {
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.add(id));
            setSelectedIds(newSelectedIds);
        }
    }, [allItems, isAllSelected, selectedIds]);

    // [추가] 부분 선택/해제 함수 구현
    const toggleItems = useCallback((idsToToggle: T[]) => {
        if (idsToToggle.length === 0) return;

        const allFilteredAreSelected = idsToToggle.every(id => selectedIds.has(id));
        
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (allFilteredAreSelected) {
                // 모두 선택된 상태 -> 모두 해제
                idsToToggle.forEach(id => newSelected.delete(id));
            } else {
                // 하나라도 선택되지 않은 상태 -> 모두 선택
                idsToToggle.forEach(id => newSelected.add(id));
            }
            return newSelected;
        });
    }, [selectedIds]);

    return {
        selectedIds,
        toggleRow,
        isRowSelected,
        toggleSelectAll,
        isAllSelected,
        clearSelection,
        toggleItems, // [추가]
    };
}