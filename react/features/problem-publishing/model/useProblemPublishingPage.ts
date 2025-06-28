// ./react/features/problem-publishing/model/useProblemPublishingPage.ts

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import { useExamLayoutManager } from './useExamLayoutManager';
import type { ProcessedProblem } from './problemPublishingStore';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import type { SuggestionGroup } from '../../table-search/ui/TableSearch';
import { useDeleteProblemsMutation } from '../../../entities/problem/model/useProblemMutations';

export function useProblemPublishingPage() {
    const {
        allProblems: sourceProblems,
        isLoadingProblems,
        selectedIds,
        setSelectedIds,
        toggleRow,
        toggleItems,
        clearSelection,
        isSavingProblem,
        handleSaveProblem,
        handleLiveProblemChange,
        handleRevertProblem,
        startEditingProblem,
        setEditingProblemId,
        selectedProblems,
    } = useProblemPublishing();

    const {
        distributedPages, placementMap, distributedSolutionPages, solutionPlacementMap,
        setItemHeight,
        baseFontSize, contentFontSizeEm, useSequentialNumbering,
        setBaseFontSize, setContentFontSizeEm, setUseSequentialNumbering,
        forceRecalculateLayout,
    } = useExamLayoutStore();
    
    const { 
      setRightSidebarConfig, 
      setSearchBoxProps, 
      registerPageActions,
    } = useLayoutStore.getState();
    
    // [수정] 페이지별 독립적인 상태 관리 복원
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
    
    const [isSearchBoxVisible, setIsSearchBoxVisible] = useState(true);
    const [problemBoxMinHeight, setProblemBoxMinHeight] = useState(31);
    const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());
    const [headerInfo, setHeaderInfo] = useState({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
    });
    const previewAreaRef = useRef<HTMLDivElement>(null);

    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const { mutate: deleteSelectedProblems, isPending: isDeletingProblems } = useDeleteProblemsMutation();

    const filteredProblems = useTableSearch({
        data: sourceProblems,
        searchTerm,
        searchableKeys: ['display_question_number', 'source', 'grade', 'semester', 'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category'],
        activeFilters,
    }) as ProcessedProblem[];

    const filteredProblemIds = useMemo(() => new Set(filteredProblems.map(p => p.uniqueId)), [filteredProblems]);
    const hasActiveSearchOrFilter = searchTerm.trim() !== '' || Object.keys(activeFilters).length > 0;

    const isAllSelected = useMemo(() => {
        if (!hasActiveSearchOrFilter || filteredProblems.length === 0) return false;
        return filteredProblems.every(p => selectedIds.has(p.uniqueId));
    }, [filteredProblems, selectedIds, hasActiveSearchOrFilter]);

    const handleToggleAll = useCallback(() => {
        toggleItems(Array.from(filteredProblemIds));
    }, [filteredProblemIds, toggleItems]);

    const handleDeleteSelected = () => {
        if (selectedIds.size > 0) {
            setIsBulkDeleteModalOpen(true);
        }
    };

    const handleConfirmBulkDelete = () => {
        deleteSelectedProblems(Array.from(selectedIds), {
            onSuccess: () => {
                clearSelection();
                setIsBulkDeleteModalOpen(false);
            },
            onError: () => {
                 setIsBulkDeleteModalOpen(true);
            }
        });
    };
    
    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: ProcessedProblem[], key: keyof ProcessedProblem): string[] => {
            if (!items || items.length === 0) return [];
            const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
            return Array.from(new Set(values)).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        };
        return [
            { key: 'source', suggestions: getUniqueSortedValues(sourceProblems, 'source') },
            { key: 'grade', suggestions: getUniqueSortedValues(sourceProblems, 'grade') },
            { key: 'major_chapter_id', suggestions: getUniqueSortedValues(sourceProblems, 'major_chapter_id') },
        ];
    }, [sourceProblems]);
    
    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);
    
    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentSet = new Set(newFilters[key] || []);
            if (currentSet.has(value)) currentSet.delete(value);
            else currentSet.add(value);
            if (currentSet.size === 0) delete newFilters[key];
            else newFilters[key] = currentSet;
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
        setActiveFilters({});
        setSearchTerm('');
        setSelectedIds(new Set());
    }, [setSelectedIds]);
    
    const toggleSearchBox = useCallback(() => {
        setIsSearchBoxVisible(prev => !prev);
    }, []);
    
    useEffect(() => {
        if (isSearchBoxVisible) {
            setSearchBoxProps({
                searchTerm,
                onSearchTermChange: setSearchTerm,
                activeFilters,
                onFilterChange: handleFilterChange,
                onResetFilters: handleResetFilters,
                suggestionGroups: suggestionGroupsJSON,
                onToggleFiltered: handleToggleAll,
                selectedCount: selectedIds.size,
                isSelectionComplete: isAllSelected,
                showActionControls: true, 
                onHide: toggleSearchBox,
            });
        } else {
            setSearchBoxProps(null);
        }
    }, [
        isSearchBoxVisible, 
        searchTerm, 
        activeFilters, 
        suggestionGroupsJSON, 
        selectedIds.size, 
        isAllSelected,
        handleFilterChange, 
        handleResetFilters, 
        handleToggleAll,
        setSearchBoxProps,
        toggleSearchBox
    ]);
    
    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => { 
        setItemHeight(uniqueId, height); 
        setMeasuredHeights(prev => { 
            const newMap = new Map(prev); 
            newMap.set(uniqueId, height); 
            return newMap; 
        }); 
    }, [setItemHeight]);

    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: any) => { setHeaderInfo(prev => { const newState = { ...prev }; switch (targetId) { case 'title': newState.title = value.text; newState.titleFontSize = value.fontSize; break; case 'school': newState.school = value.text; newState.schoolFontSize = value.fontSize; break; case 'subject': newState.subject = value.text; newState.subjectFontSize = value.fontSize; break; case 'simplifiedSubject': newState.simplifiedSubjectText = value.text; newState.simplifiedSubjectFontSize = value.fontSize; break; case 'simplifiedGrade': newState.simplifiedGradeText = value.text; break; } return newState; }); }, []);
    const handleCloseEditor = useCallback(() => { setEditingProblemId(null); setRightSidebarConfig({ contentConfig: { type: null } }); forceRecalculateLayout(problemBoxMinHeight); }, [setEditingProblemId, setRightSidebarConfig, forceRecalculateLayout, problemBoxMinHeight]);
    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => { await handleSaveProblem(problem); handleCloseEditor(); }, [handleSaveProblem, handleCloseEditor]);
    const handleRevertAndKeepOpen = useCallback((problemId: string) => { handleRevertProblem(problemId); }, [handleRevertProblem]);
    
    const handleProblemClick = useCallback((problem: ProcessedProblem) => { startEditingProblem(); setEditingProblemId(problem.uniqueId); setRightSidebarConfig({ contentConfig: { type: 'problemEditor', props: { onProblemChange: handleLiveProblemChange, onSave: handleSaveAndClose, onRevert: handleRevertAndKeepOpen, onClose: handleCloseEditor, isSaving: false } }, isExtraWide: true }); }, [startEditingProblem, setEditingProblemId, setRightSidebarConfig, handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor]);
    
    const handleDownloadPdf = useCallback(() => alert('PDF 다운로드 기능 구현 예정'), []);
    const handleOpenLatexHelpSidebar = useCallback(() => { setRightSidebarConfig({ contentConfig: { type: 'latexHelp' }, isExtraWide: false }); }, [setRightSidebarConfig]);
    
    useExamLayoutManager({ selectedProblems, problemBoxMinHeight });
    
    useEffect(() => {
        const { contentConfig } = useLayoutStore.getState().rightSidebar;
        if (contentConfig.type === 'problemEditor') {
            setRightSidebarConfig({
                contentConfig: {
                    ...contentConfig,
                    props: {
                        ...contentConfig.props,
                        isSaving: isSavingProblem,
                    }
                },
                isExtraWide: true,
            });
        }
    }, [isSavingProblem, setRightSidebarConfig]);
    
    useEffect(() => {
        registerPageActions({ onClose: handleCloseEditor, openLatexHelpSidebar: handleOpenLatexHelpSidebar, openSearchSidebar: toggleSearchBox });
        return () => {
            setRightSidebarConfig({ contentConfig: { type: null } });
            setSearchBoxProps(null);
        };
    }, [handleCloseEditor, setRightSidebarConfig, handleOpenLatexHelpSidebar, toggleSearchBox, registerPageActions, setSearchBoxProps]);

    return {
        sourceProblems,
        filteredProblems,
        isLoadingProblems,
        selectedProblems,
        selectedIds,
        isAllSelected,
        toggleRow,
        onToggleAll: handleToggleAll,
        distributedPages,
        placementMap,
        distributedSolutionPages,
        solutionPlacementMap,
        headerInfo,
        useSequentialNumbering,
        baseFontSize,
        contentFontSizeEm,
        measuredHeights,
        problemBoxMinHeight,
        previewAreaRef,
        onToggleSequentialNumbering: () => setUseSequentialNumbering(!useSequentialNumbering),
        onBaseFontSizeChange: setBaseFontSize,
        onContentFontSizeEmChange: setContentFontSizeEm,
        onDownloadPdf: handleDownloadPdf,
        setProblemBoxMinHeight,
        onHeightUpdate: handleHeightUpdate,
        onProblemClick: handleProblemClick,
        onHeaderUpdate: handleHeaderUpdate,
        onDeselectProblem: toggleRow,
        onDeleteSelected: handleDeleteSelected,
        isBulkDeleteModalOpen,
        onCloseBulkDeleteModal: () => setIsBulkDeleteModalOpen(false),
        onConfirmBulkDelete: handleConfirmBulkDelete,
        isDeletingProblems
    };
}