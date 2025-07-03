import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import type { SuggestionGroup } from '../../../features/table-search/ui/TableSearch';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';

export function useStudentDashboard() {
    const navigate = useNavigate();
    const { setStudentIds } = useProblemSetStudentStore();

    const { registerPageActions, setRightSidebarConfig, setSearchBoxProps } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

    const currentStudents = students || [];
    const studentIds = useMemo(() => currentStudents.map(s => s.id), [currentStudents]);

    const { selectedIds, toggleRow, toggleItems, setSelectedIds } = useRowSelection<string>({ allItems: studentIds });

    const filteredStudents = useTableSearch({
        data: currentStudents,
        searchTerm,
        searchableKeys: ['student_name', 'grade', 'subject', 'school_name', 'class_name', 'teacher'],
        activeFilters,
    }) as Student[];
    const filteredStudentIds = useMemo(() => filteredStudents.map(s => s.id), [filteredStudents]);
    
    const isAllSelected = useMemo(() => {
        if (filteredStudentIds.length === 0) return false;
        return filteredStudentIds.every(id => selectedIds.has(id));
    }, [filteredStudentIds, selectedIds]);

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: Student[], key: keyof Student): string[] => {
            if (!items || !Array.isArray(items) || items.length === 0) return [];
            const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
            const uniqueValues = Array.from(new Set(values));
            if (key === 'grade') {
                return uniqueValues.sort((a, b) => GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b));
            }
            return uniqueValues.sort();
        };

        return [
            { key: 'grade', suggestions: getUniqueSortedValues(currentStudents, 'grade') },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            { key: 'class_name', suggestions: getUniqueSortedValues(currentStudents, 'class_name') },
        ];
    }, [currentStudents]);
    
    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentSet = new Set(newFilters[key] || []);
            
            if (currentSet.has(value)) {
                currentSet.delete(value);
            } else {
                currentSet.add(value);
            }

            if (currentSet.size === 0) {
                // [핵심 수정] delete 연산자 대신 객체에서 키를 제거하는 방식으로 수정
                const { [key]: _, ...rest } = newFilters;
                return rest;
            } else {
                newFilters[key] = currentSet;
            }
            return newFilters;
        });
    }, []);


    const handleResetFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm('');
      setSelectedIds(new Set());
    }, [setSelectedIds]);
    
    const handleToggleAll = useCallback(() => toggleItems(filteredStudentIds), [toggleItems, filteredStudentIds]);

    const handleCreateProblemSet = useCallback(() => {
        if (selectedIds.size === 0) {
            alert('문제를 출제할 학생을 먼저 선택해주세요.');
            return;
        }
        setStudentIds(Array.from(selectedIds));
        navigate('/problem-publishing');
    }, [selectedIds, setStudentIds, navigate]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: null } });
        setRightSidebarExpanded(false);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);
    
    const handleRequestEdit = useCallback((student: Student) => {
        setRightSidebarConfig({ 
            contentConfig: { type: 'edit', props: { student } },
            isExtraWide: false 
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    const handleOpenRegisterSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'register' }, isExtraWide: false });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);
    
    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ contentConfig: { type: 'settings' }, isExtraWide: false });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded]);

    useEffect(() => {
        registerPageActions({
            openRegisterSidebar: handleOpenRegisterSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        });
        return () => {
            registerPageActions({ openRegisterSidebar: undefined, openSettingsSidebar: undefined, onClose: undefined });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);
    
    useEffect(() => {
        setSearchBoxProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            suggestionGroups: suggestionGroupsJSON,
            onToggleFiltered: handleToggleAll,
            onCreateProblemSet: handleCreateProblemSet,
            selectedCount: selectedIds.size,
            showActionControls: true,
            isSelectionComplete: isAllSelected,
            onHide: undefined,
        });

        return () => setSearchBoxProps(null);
    }, [
        searchTerm, activeFilters, suggestionGroupsJSON, selectedIds.size, isAllSelected,
        handleFilterChange, handleResetFilters, handleToggleAll, handleCreateProblemSet, setSearchBoxProps
    ]);
    
    return {
        students: filteredStudents,
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        selectedIds,
        toggleRow,
        isAllSelected,
        toggleSelectAll: handleToggleAll,
        onRequestEdit: handleRequestEdit,
    };
}