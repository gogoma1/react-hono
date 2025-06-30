// ./react/widgets/ProblemSelectionContainer.tsx
import React, { useMemo, useCallback, useEffect } from 'react';
import { useProblemPublishing } from '../features/problem-publishing';
import ProblemSelectionWidget from './ProblemSelectionWidget';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useTableSearch } from '../features/table-search/model/useTableSearch';
import type { ProcessedProblem } from '../features/problem-publishing/model/problemPublishingStore';


interface ProblemSelectionContainerProps {
    allProblems: ProcessedProblem[];
    isLoading: boolean;
    selectedIds: Set<string>;
    toggleRow: (id: string) => void;
    toggleItems: (ids: string[]) => void;
    clearSelection: () => void;
}

const ProblemSelectionContainer: React.FC<ProblemSelectionContainerProps> = ({
    allProblems,
    isLoading,
    selectedIds,
    toggleRow,
    toggleItems,
    clearSelection,
}) => {
    const { deleteProblems, isDeletingProblems } = useProblemPublishing();

    // 필터링 관련 상태는 이 컨테이너가 계속 소유함
    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeFilters, setActiveFilters] = React.useState<Record<string, Set<string>>>({});
    const [startNumber, setStartNumber] = React.useState('');
    const [endNumber, setEndNumber] = React.useState('');
    const [problemTypeFilter, setProblemTypeFilter] = React.useState('all');

    const problemsFilteredByCustomControls = useMemo(() => {
        let items = [...allProblems];
        if (problemTypeFilter !== 'all') {
            items = items.filter(item => item.problem_type === problemTypeFilter);
        }
        const numStart = parseInt(startNumber, 10);
        const numEnd = parseInt(endNumber, 10);
        if (!isNaN(numStart) || !isNaN(numEnd)) {
            items = items.filter(item => {
                const qNum = item.question_number;
                if (!isNaN(numStart) && !isNaN(numEnd)) return qNum >= numStart && qNum <= numEnd;
                if (!isNaN(numStart)) return qNum >= numStart;
                if (!isNaN(numEnd)) return qNum <= numEnd;
                return true;
            });
        }
        return items;
    }, [allProblems, startNumber, endNumber, problemTypeFilter]);

    const filteredProblems = useTableSearch({
        data: problemsFilteredByCustomControls,
        searchTerm,
        searchableKeys: ['display_question_number', 'source', 'grade', 'semester', 'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category'],
        activeFilters,
    }) as ProcessedProblem[];

    const filteredProblemIds = useMemo(() => filteredProblems.map(p => p.uniqueId), [filteredProblems]);
    
    const isAllSelectedInFilter = useMemo(() => {
        if (filteredProblemIds.length === 0) return false;
        return filteredProblemIds.every(id => selectedIds.has(id));
    }, [filteredProblemIds, selectedIds]);

    const handleToggleAllInFilter = useCallback(() => {
        toggleItems(filteredProblemIds);
    }, [filteredProblemIds, toggleItems]);

    const handleResetHeaderFilters = useCallback(() => {
        setStartNumber('');
        setEndNumber('');
        setProblemTypeFilter('all');
    }, []);

    const handleResetFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm('');
      clearSelection();
      handleResetHeaderFilters();
    }, [clearSelection, handleResetHeaderFilters]);

    // 전역 레이아웃 스토어 연동 로직 (이전과 거의 동일)
    const { setSearchBoxProps, registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const [isSearchBoxVisible, setIsSearchBoxVisible] = React.useState(true);
    const toggleSearchBox = React.useCallback(() => setIsSearchBoxVisible(prev => !prev), []);

    const handleOpenJsonView = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: { type: 'jsonViewer', props: { problems: filteredProblems } },
            isExtraWide: true
        });
        setRightSidebarExpanded(true);
    }, [filteredProblems, setRightSidebarConfig, setRightSidebarExpanded]);

    useEffect(() => {
        registerPageActions({ openJsonViewSidebar: handleOpenJsonView });
    }, [registerPageActions, handleOpenJsonView]);

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: ProcessedProblem[], key: keyof ProcessedProblem): string[] => {
            if (!items || items.length === 0) return [];
            const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
            return Array.from(new Set(values)).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        };
        return [
            { key: 'source', suggestions: getUniqueSortedValues(allProblems, 'source') },
            { key: 'grade', suggestions: getUniqueSortedValues(allProblems, 'grade') },
            { key: 'major_chapter_id', suggestions: getUniqueSortedValues(allProblems, 'major_chapter_id') },
        ];
    }, [allProblems]);

    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);
    
    useEffect(() => {
        if (isSearchBoxVisible) {
            setSearchBoxProps({
                searchTerm, onSearchTermChange: setSearchTerm, activeFilters, onFilterChange: (key, val) => setActiveFilters(prev => {
                    const newSet = new Set(prev[key] || []);
                    newSet.has(val) ? newSet.delete(val) : newSet.add(val);
                    const newFilters = {...prev};
                    if (newSet.size === 0) delete newFilters[key]; else newFilters[key] = newSet;
                    return newFilters;
                }),
                onResetFilters: handleResetFilters, suggestionGroups: suggestionGroupsJSON, onToggleFiltered: handleToggleAllInFilter,
                selectedCount: selectedIds.size, isSelectionComplete: isAllSelectedInFilter, showActionControls: true, onHide: toggleSearchBox,
            });
        } else {
            setSearchBoxProps(null);
        }
    }, [isSearchBoxVisible, searchTerm, activeFilters, handleResetFilters, suggestionGroupsJSON, handleToggleAllInFilter, selectedIds.size, isAllSelectedInFilter, toggleSearchBox, setSearchBoxProps]);

    // 삭제 모달 관련 로직 (이전과 동일)
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
    const handleDeleteSelected = () => {
        if (selectedIds.size > 0) setIsBulkDeleteModalOpen(true);
    };
    const handleConfirmBulkDelete = () => {
        deleteProblems(Array.from(selectedIds), {
            onSuccess: () => { clearSelection(); setIsBulkDeleteModalOpen(false); },
            onError: () => setIsBulkDeleteModalOpen(true)
        });
    };

    return (
        <ProblemSelectionWidget
            problems={filteredProblems}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={handleToggleAllInFilter}
            isAllSelected={isAllSelectedInFilter}
            onDeleteSelected={handleDeleteSelected}
            isBulkDeleteModalOpen={isBulkDeleteModalOpen}
            onCloseBulkDeleteModal={() => setIsBulkDeleteModalOpen(false)}
            onConfirmBulkDelete={handleConfirmBulkDelete}
            isDeletingProblems={isDeletingProblems}
            startNumber={startNumber}
            onStartNumberChange={(e) => setStartNumber(e.target.value)}
            endNumber={endNumber}
            onEndNumberChange={(e) => setEndNumber(e.target.value)}
            problemTypeFilter={problemTypeFilter}
            onProblemTypeFilterChange={setProblemTypeFilter}
            onResetHeaderFilters={handleResetHeaderFilters}
        />
    );
};

export default ProblemSelectionContainer;