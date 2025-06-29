import { useState, useMemo, useCallback } from 'react';
import type { ProcessedProblem } from './problemPublishingStore';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import { useRowSelection } from '../../row-selection/model/useRowSelection';

export function useProblemSelection(sourceProblems: ProcessedProblem[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
    
    const [startNumber, setStartNumber] = useState('');
    const [endNumber, setEndNumber] = useState('');
    const [problemTypeFilter, setProblemTypeFilter] = useState('all');

    const problemUniqueIds = useMemo(() => sourceProblems.map(p => p.uniqueId), [sourceProblems]);

    const {
        selectedIds,
        setSelectedIds,
        toggleRow,
        toggleItems,
        clearSelection
    } = useRowSelection<string>({ allItems: problemUniqueIds });

    const problemsFilteredByCustomControls = useMemo(() => {
        let items = [...sourceProblems];

        if (problemTypeFilter !== 'all') {
            items = items.filter(item => item.problem_type === problemTypeFilter);
        }

        const numStart = parseInt(startNumber, 10);
        const numEnd = parseInt(endNumber, 10);
        const isStartValid = !isNaN(numStart);
        const isEndValid = !isNaN(numEnd);

        if (isStartValid || isEndValid) {
            items = items.filter(item => {
                const qNum = item.question_number;
                if (isStartValid && isEndValid) {
                    return qNum >= numStart && qNum <= numEnd;
                }
                if (isStartValid) {
                    return qNum >= numStart;
                }
                if (isEndValid) {
                    return qNum <= numEnd;
                }
                return true;
            });
        }
        
        return items;
    }, [sourceProblems, startNumber, endNumber, problemTypeFilter]);


    const filteredProblems = useTableSearch({
        data: problemsFilteredByCustomControls,
        searchTerm,
        searchableKeys: ['display_question_number', 'source', 'grade', 'semester', 'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category'],
        activeFilters,
    }) as ProcessedProblem[];

    const filteredProblemIds = useMemo(() => new Set(filteredProblems.map(p => p.uniqueId)), [filteredProblems]);
    const hasActiveSearchOrFilter = searchTerm.trim() !== '' || Object.keys(activeFilters).length > 0 || startNumber !== '' || endNumber !== '' || problemTypeFilter !== 'all';

    const isAllSelected = useMemo(() => {
        if (!hasActiveSearchOrFilter || filteredProblems.length === 0) return false;
        return filteredProblems.every(p => selectedIds.has(p.uniqueId));
    }, [filteredProblems, selectedIds, hasActiveSearchOrFilter]);

    const handleToggleAll = useCallback(() => {
        toggleItems(Array.from(filteredProblemIds));
    }, [filteredProblemIds, toggleItems]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentSet = new Set(newFilters[key] || []);
            currentSet.has(value) ? currentSet.delete(value) : currentSet.add(value);
            if (currentSet.size === 0) delete newFilters[key]
            else newFilters[key] = currentSet;
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm('');
      setSelectedIds(new Set());
      setStartNumber('');
      setEndNumber('');
      setProblemTypeFilter('all');
    }, [setSelectedIds]);

    // [신규] 헤더의 필터(번호, 유형)만 초기화하는 함수
    const handleResetHeaderFilters = useCallback(() => {
        setStartNumber('');
        setEndNumber('');
        setProblemTypeFilter('all');
    }, []);


    return {
        searchTerm,
        setSearchTerm,
        activeFilters,
        handleFilterChange,
        handleResetFilters,
        selectedIds,
        clearSelection,
        toggleRow,
        handleToggleAll,
        isAllSelected,
        filteredProblems,
        startNumber,
        setStartNumber,
        endNumber,
        setEndNumber,
        problemTypeFilter,
        setProblemTypeFilter,
        handleResetHeaderFilters, // [신규] 부분 초기화 함수 반환
    };
}