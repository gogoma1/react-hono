import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import type { SuggestionGroup } from '../../../features/table-search/ui/TableSearch'; 

/**
 * [신규] 학생 대시보드 페이지의 모든 상태와 로직을 관리하는 커스텀 훅
 */
export function useStudentDashboard() {
    const { registerPageActions, setRightSidebarConfig } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

    const currentStudents = students || [];
    const studentIds = useMemo(() => currentStudents.map(s => s.id), [currentStudents]);

    const { selectedIds, toggleRow, toggleItems } = useRowSelection<string>({ allItems: studentIds });

    const filteredStudents = useTableSearch({
        data: currentStudents,
        searchTerm,
        searchableKeys: ['student_name', 'grade', 'subject', 'school_name', 'class_name', 'teacher'],
        activeFilters,
    }) as Student[];
    const filteredStudentIds = useMemo(() => filteredStudents.map(s => s.id), [filteredStudents]);
    
    const isFilteredAllSelected = useMemo(() => {
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
            if (currentSet.has(value)) currentSet.delete(value);
            else currentSet.add(value);
            if (currentSet.size === 0) delete newFilters[key];
            else newFilters[key] = currentSet;
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => setActiveFilters({}), []);
    const handleToggleFilteredSelection = useCallback(() => toggleItems(filteredStudentIds), [toggleItems, filteredStudentIds]);

    const handleCreateProblemSet = useCallback(() => {
        if (selectedIds.size === 0) return alert('선택된 학생이 없습니다.');
        console.log('문제 출제 대상 학생 ID:', [...selectedIds]);
        alert(`${selectedIds.size}명의 학생을 대상으로 문제 출제 로직을 실행합니다.`);
    }, [selectedIds]);

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
            registerPageActions({
                openRegisterSidebar: undefined,
                openSettingsSidebar: undefined,
                onClose: undefined,
            });
            handleCloseSidebar();
        };
    }, [registerPageActions, handleOpenRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);
    
    useEffect(() => {
        useLayoutStore.getState().setSearchBoxProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            suggestionGroups: suggestionGroupsJSON,
            onToggleFiltered: handleToggleFilteredSelection,
            onCreateProblemSet: handleCreateProblemSet,
            selectedCount: selectedIds.size,
            showActionControls: true,
            isFilteredAllSelected,
            onHide: undefined, // [수정] 대시보드에서는 숨기기 기능 없음
        });
        return () => useLayoutStore.getState().setSearchBoxProps(null);
    }, [
        searchTerm, activeFilters, suggestionGroupsJSON, selectedIds.size, 
        handleFilterChange, handleResetFilters, handleToggleFilteredSelection, handleCreateProblemSet,
        isFilteredAllSelected
    ]);
    
    return {
        students: filteredStudents,
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        
        selectedIds,
        toggleRow,
        isAllSelected: isFilteredAllSelected,
        toggleSelectAll: handleToggleFilteredSelection,
        
        onRequestEdit: handleRequestEdit,
    };
}