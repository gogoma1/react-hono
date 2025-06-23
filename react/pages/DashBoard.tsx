import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../features/row-selection/model/useRowSelection';

import StudentRegistrationForm from '../features/student-registration/ui/StudentRegistrationForm';
import StudentEditForm from '../features/student-editing/ui/StudentEditForm';
import TableColumnToggler from '../features/table-column-toggler/ui/TableColumnToggler';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useTableSearch } from '../features/table-search/model/useTableSearch';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const getUniqueSortedValues = (items: Student[], key: keyof Student): string[] => {
    if (!items || !Array.isArray(items) || items.length === 0) return [];
    
    const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
    const uniqueValues = Array.from(new Set(values));
    
    if (key === 'grade') {
        return uniqueValues.sort((a, b) => {
            const indexA = GRADE_LEVELS.indexOf(a);
            const indexB = GRADE_LEVELS.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }

    return uniqueValues.sort();
};

const DashBoard: React.FC = () => {
    // [핵심 수정] 훅 대신 getState()를 사용하여 구독을 생성하지 않고 액션만 가져옵니다.
    const { setRightSidebarContent, registerPageActions } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [activeSidebarView, setActiveSidebarView] = useState<'register' | 'edit' | 'settings' | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const prevActiveSidebarView = usePrevious(activeSidebarView);

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
    
    const handleToggleFilteredAll = useCallback(() => {
        toggleItems(filteredStudentIds);
    }, [toggleItems, filteredStudentIds]);


    const suggestionGroups = useMemo((): SuggestionGroup[] => {
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
            if (newFilters[key] === value) {
                delete newFilters[key];
            } else {
                newFilters[key] = value;
            }
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
        setActiveFilters({});
    }, []);

    const handleToggleFilteredSelection = useCallback(() => {
        toggleItems(filteredStudentIds);
    }, [toggleItems, filteredStudentIds]);

    const handleCreateProblemSet = useCallback(() => {
        if (selectedIds.size === 0) {
            alert('선택된 학생이 없습니다.');
            return;
        }
        console.log('문제 출제 대상 학생 ID:', [...selectedIds]);
        alert(`${selectedIds.size}명의 학생을 대상으로 문제 출제 로직을 실행합니다. (콘솔 확인)`);
    }, [selectedIds]);

    const handleCloseSidebar = useCallback(() => {
        setActiveSidebarView(null);
    }, []);
    
    const handleRequestEdit = useCallback((student: Student) => {
        setStudentToEdit(student);
        setActiveSidebarView('edit');
    }, []);

    const handleOpenRegisterSidebar = useCallback(() => {
        setStudentToEdit(null);
        setActiveSidebarView('register');
    }, []);
    
    const handleOpenSettingsSidebar = useCallback(() => {
        setStudentToEdit(null);
        setActiveSidebarView('settings');
    }, []);

    useEffect(() => {
        setRightSidebarExpanded(activeSidebarView !== null);

        if (activeSidebarView === 'register') {
            setRightSidebarContent(<StudentRegistrationForm onSuccess={handleCloseSidebar} />);
        } else if (activeSidebarView === 'edit' && studentToEdit) {
            setRightSidebarContent(<StudentEditForm student={studentToEdit} onSuccess={handleCloseSidebar} />);
        } else if (activeSidebarView === 'settings') {
            setRightSidebarContent(<TableColumnToggler />);
        }

        if (prevActiveSidebarView !== null && activeSidebarView === null) {
            const timer = setTimeout(() => {
                setRightSidebarContent(null);
                setStudentToEdit(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeSidebarView, studentToEdit, handleCloseSidebar, setRightSidebarExpanded, setRightSidebarContent, prevActiveSidebarView]);

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
        };
    }, [registerPageActions, handleOpenRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar]);
    
    useEffect(() => {
        useLayoutStore.getState().setStudentSearchProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            suggestionGroups: suggestionGroupsJSON,
            onToggleFiltered: handleToggleFilteredSelection,
            onCreateProblemSet: handleCreateProblemSet,
            selectedCount: selectedIds.size,
        });

        return () => {
            useLayoutStore.getState().setStudentSearchProps(null);
        };
    }, [
        searchTerm, 
        activeFilters, 
        suggestionGroupsJSON, 
        selectedIds.size, 
        handleFilterChange, 
        handleResetFilters, 
        handleToggleFilteredSelection, 
        handleCreateProblemSet
    ]);
    
    if (isStudentsError) {
        return (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                <h2>학생 데이터 로딩 오류</h2>
                <p>{studentsError?.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <StudentTableWidget 
                students={filteredStudents} 
                isLoading={isLoadingStudents}
                onRequestEdit={handleRequestEdit}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                isAllSelected={isFilteredAllSelected}
                toggleSelectAll={handleToggleFilteredAll}
            />
        </div>
    );
};

export default DashBoard;