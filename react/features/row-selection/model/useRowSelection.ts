import { useState, useCallback, useMemo } from 'react';

interface UseRowSelectionProps<T extends string | number> {
    initialSelectedIds?: Set<T>;
    allItems?: T[]; 
}

interface UseRowSelectionReturn<T extends string | number> {
    selectedIds: Set<T>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<T>>>; // [추가] 외부에서 직접 제어
    toggleRow: (id: T) => void;
    isRowSelected: (id: T) => boolean;
    toggleSelectAll: () => void;
    isAllSelected: boolean;
    clearSelection: () => void;
    toggleItems: (ids: T[]) => void;
    replaceSelection: (ids: T[]) => void; // [추가]
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

    const toggleItems = useCallback((idsToToggle: T[]) => {
        if (idsToToggle.length === 0) return;

        const allFilteredAreSelected = idsToToggle.every(id => selectedIds.has(id));
        
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (allFilteredAreSelected) {
                idsToToggle.forEach(id => newSelected.delete(id));
            } else {
                idsToToggle.forEach(id => newSelected.add(id));
            }
            return newSelected;
        });
    }, [selectedIds]);
    
    // [추가] 선택 상태를 완전히 새로운 ID 배열로 교체하는 함수
    const replaceSelection = useCallback((ids: T[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    return {
        selectedIds,
        setSelectedIds, // [추가]
        toggleRow,
        isRowSelected,
        toggleSelectAll,
        isAllSelected,
        clearSelection,
        toggleItems,
        replaceSelection, // [추가]
    };
}