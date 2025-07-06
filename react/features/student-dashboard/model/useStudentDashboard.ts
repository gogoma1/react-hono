import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useStudentDataWithRQ } from '../../../entities/student/model/useStudentDataWithRQ';
import { type Student, GRADE_LEVELS } from '../../../entities/student/model/types';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import type { SuggestionGroup } from '../../../features/table-search/ui/TableSearch';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';
import { useMyAcademiesQuery } from '../../../entities/academy/model/useAcademiesQuery';

export function useStudentDashboard() {
    const navigate = useNavigate();
    const { setStudentIds } = useProblemSetStudentStore();

    const { registerPageActions, setRightSidebarConfig, setSearchBoxProps } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    
    const { data: myAcademies = [], isLoading: isLoadingAcademies } = useMyAcademiesQuery();
    const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);

    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ(selectedAcademyId);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

    const currentStudents = students || [];
    const studentIds = useMemo(() => currentStudents.map(s => s.id), [currentStudents]);

    const { selectedIds, toggleRow, toggleItems, setSelectedIds } = useRowSelection<string>({ allItems: studentIds });

    useEffect(() => {
        if (!selectedAcademyId && myAcademies.length > 0) {
            setSelectedAcademyId(myAcademies[0].id);
        }
    }, [myAcademies, selectedAcademyId]);

    const filteredStudents = useTableSearch({
        data: currentStudents,
        searchTerm,
        // [수정됨] 검색 대상 키를 모두 snake_case로 변경
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
            const values = items.map(item => item[key as keyof Student]).filter((value): value is string => value != null && String(value).trim() !== '');
            const uniqueValues = Array.from(new Set(values));
            if (key === 'grade') {
                return uniqueValues.sort((a, b) => GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b));
            }
            return uniqueValues.sort();
        };

        return [
            { key: 'grade', suggestions: getUniqueSortedValues(currentStudents, 'grade') },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            // [수정됨] 키를 snake_case로 변경
            { key: 'class_name', suggestions: getUniqueSortedValues(currentStudents, 'class_name') },
        ];
    }, [currentStudents]);
    
    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev[key] || []);
            newSet.has(value) ? newSet.delete(value) : newSet.add(value);
            const newFilters = {...prev};
            if (newSet.size === 0) delete newFilters[key]; else newFilters[key] = newSet;
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
            alert('학생을 먼저 선택해주세요.');
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
            contentConfig: { type: 'edit', props: { student, academyId: selectedAcademyId } },
            isExtraWide: false 
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded, selectedAcademyId]);

    const handleOpenRegisterSidebar = useCallback(() => {
        if (!selectedAcademyId) return alert("학생을 등록할 학원을 먼저 선택해주세요.");
        setRightSidebarConfig({ 
            contentConfig: { type: 'register', props: { academyId: selectedAcademyId } },
            isExtraWide: false 
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded, selectedAcademyId]);
    
    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarConfig({ 
            contentConfig: { 
                type: 'settings', 
                props: { 
                    myAcademies, 
                    selectedAcademyId,
                    onSelectAcademy: setSelectedAcademyId 
                } 
            }, 
            isExtraWide: false 
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarConfig, setRightSidebarExpanded, myAcademies, selectedAcademyId]);

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
        isLoading: isLoadingStudents || isLoadingAcademies,
        isError: isStudentsError,
        error: studentsError,
        selectedIds,
        toggleRow,
        isAllSelected,
        toggleSelectAll: handleToggleAll,
        onRequestEdit: handleRequestEdit,
        myAcademies,
        selectedAcademyId,
        onSelectAcademy: setSelectedAcademyId,
    };
}