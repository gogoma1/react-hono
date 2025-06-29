import React, { useMemo, useEffect, useCallback } from 'react';
import { useProblemPublishing, useProblemSelection } from '../features/problem-publishing';
import ProblemSelectionWidget from './ProblemSelectionWidget';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';
import { useLayoutStore } from '../shared/store/layoutStore';
import type { ProcessedProblem } from '../features/problem-publishing/model/problemPublishingStore';
import { useUIStore } from '../shared/store/uiStore';

interface ProblemSelectionContainerProps {
    onSelectionChange: (selectedIds: Set<string>) => void;
}

const ProblemSelectionContainer: React.FC<ProblemSelectionContainerProps> = ({ onSelectionChange }) => {
    const { allProblems, isLoadingProblems, deleteProblems, isDeletingProblems } = useProblemPublishing();
    
    // [수정] handleResetHeaderFilters 함수 가져오기
    const {
        searchTerm, setSearchTerm, activeFilters, handleFilterChange, handleResetFilters,
        selectedIds, clearSelection, toggleRow, handleToggleAll, isAllSelected,
        filteredProblems,
        startNumber, setStartNumber,
        endNumber, setEndNumber,
        problemTypeFilter, setProblemTypeFilter,
        handleResetHeaderFilters,
    } = useProblemSelection(allProblems);

    useEffect(() => {
        onSelectionChange(selectedIds);
    }, [selectedIds, onSelectionChange]);

    const { setSearchBoxProps, registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    const [isSearchBoxVisible, setIsSearchBoxVisible] = React.useState(true);
    const toggleSearchBox = React.useCallback(() => setIsSearchBoxVisible(prev => !prev), []);

    const handleOpenJsonView = useCallback(() => {
        setRightSidebarConfig({
            contentConfig: {
                type: 'jsonViewer',
                props: { problems: filteredProblems }
            },
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
                searchTerm, onSearchTermChange: setSearchTerm, activeFilters, onFilterChange: handleFilterChange,
                onResetFilters: handleResetFilters, suggestionGroups: suggestionGroupsJSON, onToggleFiltered: handleToggleAll,
                selectedCount: selectedIds.size, isSelectionComplete: isAllSelected, showActionControls: true, onHide: toggleSearchBox,
            });
        } else {
            setSearchBoxProps(null);
        }
    }, [isSearchBoxVisible, searchTerm, setSearchTerm, activeFilters, handleFilterChange, handleResetFilters, suggestionGroupsJSON, handleToggleAll, selectedIds.size, isAllSelected, toggleSearchBox, setSearchBoxProps]);

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
            isLoading={isLoadingProblems}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={handleToggleAll}
            isAllSelected={isAllSelected}
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
            onResetHeaderFilters={handleResetHeaderFilters} // [신규] 핸들러 전달
        />
    );
};

export default ProblemSelectionContainer;