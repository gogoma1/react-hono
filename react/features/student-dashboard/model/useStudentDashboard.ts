import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLayoutStore } from '../../../shared/store/layoutStore';
import { useUIStore } from '../../../shared/store/uiStore';
import { useStudentDataWithRQ } from '../../../entities/student/model/useStudentDataWithRQ';
import { type Student, GRADE_LEVELS } from '../../../entities/student/model/types';
import { useRowSelection } from '../../row-selection/model/useRowSelection';
import { useTableSearch } from '../../table-search/model/useTableSearch';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';
import { useMyAcademiesQuery } from '../../../entities/academy/model/useAcademiesQuery';

export interface SuggestionGroup {
    key: string;
    suggestions: string[];
}

export function useStudentDashboard() {
    const navigate = useNavigate();
    const { setStudents } = useProblemSetStudentStore();

    const { 
        setRightSidebarContent, 
        setSearchBoxProps 
    } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();
    
    const { data: myAcademies = [], isLoading: isLoadingAcademies } = useMyAcademiesQuery();
    const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
    const { students, isLoadingStudents, isStudentsError, studentsError, addStudent, updateStudent, deleteStudent } = useStudentDataWithRQ(selectedAcademyId);
    
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
        searchableKeys: ['student_name', 'grade', 'subject', 'school_name', 'class_name', 'teacher'],
        activeFilters,
    }) as Student[];
    
    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        const getUniqueSortedValues = (items: Student[], key: keyof Student): string[] => {
            if (!items || items.length === 0) return [];

            const allValuesFlat = items.flatMap(item => {
                const value = item[key];
                if (key === 'teacher' && typeof value === 'string' && value.includes(',')) {
                    return value.split(',').map(name => name.trim());
                }
                return [value]; 
            });

            const validStrings: string[] = allValuesFlat.filter(
                (value): value is string => 
                    typeof value === 'string' && value.trim() !== '' && value.trim() !== '-'
            );

            return Array.from(new Set(validStrings)).sort();
        };

        const validGrades: string[] = currentStudents
            .map(s => s.grade)
            .filter((g): g is string => typeof g === 'string' && !!g.trim());

        const uniqueGrades = Array.from(new Set(validGrades));
        const sortedGrades = uniqueGrades.sort((a, b) => GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b));

        return [
            { key: 'grade', suggestions: sortedGrades },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            { key: 'teacher', suggestions: getUniqueSortedValues(currentStudents, 'teacher') },
            { key: 'school_name', suggestions: getUniqueSortedValues(currentStudents, 'school_name') },
        ];
    }, [currentStudents]);
    
    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentSet = new Set(newFilters[key] || []);
            currentSet.has(value) ? currentSet.delete(value) : currentSet.add(value);
            if (currentSet.size === 0) {
                delete newFilters[key];
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
    
    const filteredStudentIds = useMemo(() => filteredStudents.map(s => s.id), [filteredStudents]);
    const handleToggleAll = useCallback(() => toggleItems(filteredStudentIds), [toggleItems, filteredStudentIds]);
    
    const handleCreateProblemSet = useCallback(() => {
        if (selectedIds.size === 0) {
            alert('문제집을 만들 학생을 선택해주세요.');
            return;
        }
        const selectedStudents = currentStudents.filter(s => selectedIds.has(s.id));
        setStudents(selectedStudents);
        navigate('/problem-publishing');
    }, [selectedIds, currentStudents, setStudents, navigate]);
    
    const onRequestEdit = useCallback((student: Student) => {
        if (!selectedAcademyId) return;
        setRightSidebarContent({ 
            type: 'edit', 
            student: student,
            academyId: selectedAcademyId,
        });
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded, selectedAcademyId]);
    
    const isAllSelected = useMemo(() => {
        return filteredStudentIds.length > 0 && filteredStudentIds.every(id => selectedIds.has(id));
    }, [filteredStudentIds, selectedIds]);

    useEffect(() => {
        const suggestionGroupsJSON = JSON.stringify(suggestionGroups);
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
        searchTerm, activeFilters, suggestionGroups, selectedIds.size, isAllSelected,
        setSearchTerm, handleFilterChange, handleResetFilters, handleToggleAll,
        handleCreateProblemSet, setSearchBoxProps
    ]);
    
    return {
        students: filteredStudents,
        isLoading: isLoadingStudents || isLoadingAcademies,
        isError: isStudentsError,
        error: studentsError,
        selectedIds,
        toggleRow,
        isAllSelected,
        handleToggleAll,
        onRequestEdit,
        myAcademies,
        selectedAcademyId,
        onSelectAcademy: setSelectedAcademyId,
        searchTerm,
        setSearchTerm,
        activeFilters,
        handleFilterChange,
        handleResetFilters,
        suggestionGroups,
        handleCreateProblemSet,
        addStudent,
        updateStudent,
        deleteStudent
    };
}