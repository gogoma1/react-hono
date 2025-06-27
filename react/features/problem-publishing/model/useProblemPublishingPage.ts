import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useProblemPublishing } from './useProblemPublishing';
import { useExamLayoutStore } from './examLayoutStore';
import type { ProcessedProblem } from './problemPublishingStore';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import type { SuggestionGroup } from '../../table-search/ui/TableSearch';

/**
 * 문제 출제 페이지의 모든 상태와 로직을 관리하는 커스텀 훅
 */
export function useProblemPublishingPage() {
    const {
        allProblems: allProblemsFromSource,
        isLoadingProblems,
        selectedIds,
        setSelectedIds,
        toggleRow,
        toggleItems,
        replaceSelection,
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
        forceRecalculateLayout, startLayoutCalculation, resetLayout
    } = useExamLayoutStore();
    
    const { setRightSidebarConfig, setSearchBoxProps, registerPageActions } = useLayoutStore.getState();

    const [isSearchBoxVisible, setIsSearchBoxVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
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

    const filteredProblems = useTableSearch({
        data: allProblemsFromSource,
        searchTerm,
        searchableKeys: ['display_question_number', 'source', 'grade', 'semester', 'major_chapter_id', 'middle_chapter_id', 'core_concept_id', 'problem_category'],
        activeFilters,
    }) as ProcessedProblem[];

    const filteredProblemIds = useMemo(() => new Set(filteredProblems.map(p => p.uniqueId)), [filteredProblems]);
    const hasActiveSearchOrFilter = searchTerm.trim() !== '' || Object.keys(activeFilters).length > 0;

    const isAllFilteredSelected = useMemo(() => {
        if (!hasActiveSearchOrFilter || filteredProblems.length === 0) return false;
        return filteredProblems.every(p => selectedIds.has(p.uniqueId));
    }, [filteredProblems, selectedIds, hasActiveSearchOrFilter]);
    
    const isSelectionComplete = useMemo(() => {
        if (!hasActiveSearchOrFilter) return false;
        return isAllFilteredSelected && selectedIds.size === filteredProblems.length;
    }, [isAllFilteredSelected, selectedIds.size, filteredProblems.length, hasActiveSearchOrFilter]);


    // [수정] filteredProblems에서 ID 배열을 만들어 전달
    const handleToggleAllInTable = useCallback(() => {
        toggleItems(Array.from(filteredProblemIds));
    }, [filteredProblemIds, toggleItems]);
    
    // [수정] filteredProblems에서 ID 배열을 만들어 전달
    const handleReplaceWithFiltered = useCallback(() => {
        replaceSelection(Array.from(filteredProblemIds));
    }, [filteredProblemIds, replaceSelection]);

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: ProcessedProblem[], key: keyof ProcessedProblem): string[] => {
            if (!items || items.length === 0) return [];
            const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
            return Array.from(new Set(values)).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        };
        return [
            { key: 'source', suggestions: getUniqueSortedValues(allProblemsFromSource, 'source') },
            { key: 'grade', suggestions: getUniqueSortedValues(allProblemsFromSource, 'grade') },
            { key: 'major_chapter_id', suggestions: getUniqueSortedValues(allProblemsFromSource, 'major_chapter_id') },
        ];
    }, [allProblemsFromSource]);
    
    const handleFilterChange = useCallback((key: string, value: string) => {
        const isCurrentlyAllSelected = allProblemsFromSource.length > 0 && selectedIds.size === allProblemsFromSource.length;
        const isNewFilter = !activeFilters[key]?.has(value);
        
        if (isCurrentlyAllSelected && isNewFilter) {
            const initialFiltered = allProblemsFromSource.filter(p => p[key as keyof ProcessedProblem] === value);
            setSelectedIds(new Set(initialFiltered.map(p => p.uniqueId)));
            setActiveFilters({ [key]: new Set([value]) });
        } else {
            setActiveFilters(prev => {
                const newFilters = { ...prev };
                const currentSet = new Set(newFilters[key] || []);
                if (currentSet.has(value)) {
                    currentSet.delete(value);
                } else {
                    currentSet.add(value);
                }
                if (currentSet.size === 0) {
                    delete newFilters[key];
                } else {
                    newFilters[key] = currentSet;
                }
                return newFilters;
            });
        }
    }, [activeFilters, allProblemsFromSource, selectedIds.size, setSelectedIds]);

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
                suggestionGroups: JSON.stringify(suggestionGroups),
                onToggleFiltered: handleReplaceWithFiltered,
                onCreateProblemSet: undefined,
                showActionControls: true, 
                selectedCount: selectedIds.size,
                isSelectionComplete: isSelectionComplete,
                onHide: toggleSearchBox,
            });
        } else {
            setSearchBoxProps(null);
        }
    }, [
        isSearchBoxVisible, searchTerm, activeFilters, suggestionGroups, handleFilterChange, 
        handleResetFilters, handleReplaceWithFiltered, setSearchBoxProps, isSelectionComplete,
        selectedIds.size, toggleSearchBox
    ]);
    
    // ... 나머지 핸들러 및 useEffect 훅들은 변경 없음 ...
    const handleHeightUpdate = useCallback((uniqueId: string, height: number) => { setItemHeight(uniqueId, height); setMeasuredHeights(prev => { const newMap = new Map(prev); newMap.set(uniqueId, height); return newMap; }); }, [setItemHeight]);
    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: any) => { setHeaderInfo(prev => { const newState = { ...prev }; switch (targetId) { case 'title': newState.title = value.text; newState.titleFontSize = value.fontSize; break; case 'school': newState.school = value.text; newState.schoolFontSize = value.fontSize; break; case 'subject': newState.subject = value.text; newState.subjectFontSize = value.fontSize; break; case 'simplifiedSubject': newState.simplifiedSubjectText = value.text; newState.simplifiedSubjectFontSize = value.fontSize; break; case 'simplifiedGrade': newState.simplifiedGradeText = value.text; break; } return newState; }); }, []);
    const handleCloseEditor = useCallback(() => { setEditingProblemId(null); setRightSidebarConfig({ contentConfig: { type: null } }); forceRecalculateLayout(problemBoxMinHeight); }, [setEditingProblemId, setRightSidebarConfig, forceRecalculateLayout, problemBoxMinHeight]);
    const handleSaveAndClose = useCallback(async (problem: ProcessedProblem) => { await handleSaveProblem(problem); handleCloseEditor(); }, [handleSaveProblem, handleCloseEditor]);
    const handleRevertAndKeepOpen = useCallback((problemId: string) => { handleRevertProblem(problemId); }, [handleRevertProblem]);
    const handleProblemClick = useCallback((problem: ProcessedProblem) => { startEditingProblem(); setEditingProblemId(problem.uniqueId); setRightSidebarConfig({ contentConfig: { type: 'problemEditor', props: { onProblemChange: handleLiveProblemChange, onSave: handleSaveAndClose, onRevert: handleRevertAndKeepOpen, onClose: handleCloseEditor, } }, isExtraWide: true }); }, [startEditingProblem, setEditingProblemId, setRightSidebarConfig, handleLiveProblemChange, handleSaveAndClose, handleRevertAndKeepOpen, handleCloseEditor]);
    const handleDownloadPdf = useCallback(() => alert('PDF 다운로드 기능 구현 예정'), []);
    const handleOpenLatexHelpSidebar = useCallback(() => { setRightSidebarConfig({ contentConfig: { type: 'latexHelp' }, isExtraWide: false }); }, [setRightSidebarConfig]);
    const prevSelectedIdsRef = useRef<string>('');
    useEffect(() => { const currentSelectedIds = selectedProblems.map(p => p.uniqueId).sort().join(','); if (currentSelectedIds !== prevSelectedIdsRef.current) { prevSelectedIdsRef.current = currentSelectedIds; if (selectedProblems.length > 0) { startLayoutCalculation(selectedProblems, problemBoxMinHeight); } else { resetLayout(); } } }, [selectedProblems, startLayoutCalculation, resetLayout, problemBoxMinHeight]);
    useEffect(() => { return () => { resetLayout(); }; }, [resetLayout]);
    useEffect(() => { registerPageActions({ onClose: handleCloseEditor, openLatexHelpSidebar: handleOpenLatexHelpSidebar, openSearchSidebar: toggleSearchBox }); return () => { setRightSidebarConfig({ contentConfig: { type: null } }); setSearchBoxProps(null); registerPageActions({ onClose: undefined, openLatexHelpSidebar: undefined, openSearchSidebar: undefined }); }; }, [handleCloseEditor, setRightSidebarConfig, handleOpenLatexHelpSidebar, toggleSearchBox, registerPageActions, setSearchBoxProps]);

    return {
        allProblems: allProblemsFromSource,
        filteredProblemIds,
        hasActiveSearchOrFilter,
        isLoadingProblems,
        selectedProblems,
        selectedIds,
        isAllSelected: isAllFilteredSelected,
        toggleSelectAll: handleToggleAllInTable,
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
        toggleRow,
        onToggleSequentialNumbering: () => setUseSequentialNumbering(!useSequentialNumbering),
        onBaseFontSizeChange: setBaseFontSize,
        onContentFontSizeEmChange: setContentFontSizeEm,
        onDownloadPdf: handleDownloadPdf,
        setProblemBoxMinHeight,
        onHeightUpdate: handleHeightUpdate,
        onProblemClick: handleProblemClick,
        onHeaderUpdate: handleHeaderUpdate,
        onDeselectProblem: toggleRow,
    };
}