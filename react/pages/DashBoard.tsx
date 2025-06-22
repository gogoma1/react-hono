import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../entities/student/model/useStudentDataWithRQ';

import StudentRegistrationForm from '../features/student-registration/ui/StudentRegistrationForm';
import StudentEditForm from '../features/student-editing/ui/StudentEditForm';
import TableColumnToggler from '../features/table-column-toggler/ui/TableColumnToggler';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useTableSearch } from '../features/table-search/model/useTableSearch';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';

// 이 컴포넌트는 더 이상 사용되지 않으므로 삭제되었습니다.
// import { LuInfo } from 'react-icons/lu';
// const MobileSettingsPlaceholder: React.FC = () => { ... };

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
    const { setRightSidebarContent, setSidebarTriggers, setStudentSearchProps } = useLayoutStore();
    const { setRightSidebarExpanded, currentBreakpoint } = useUIStore();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [activeSidebarView, setActiveSidebarView] = useState<'register' | 'edit' | 'settings' | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const prevActiveSidebarView = usePrevious(activeSidebarView);

    const currentStudents = students || [];

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        return [
            { key: 'grade', suggestions: getUniqueSortedValues(currentStudents, 'grade') },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            { key: 'class_name', suggestions: getUniqueSortedValues(currentStudents, 'class_name') },
        ];
    }, [currentStudents]);
    
    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);

    const filteredStudents = useTableSearch({
        data: currentStudents,
        searchTerm,
        searchableKeys: ['student_name', 'grade', 'subject', 'school_name', 'class_name', 'teacher'],
        activeFilters,
    }) as Student[];
    
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
            // [수정] 모바일/데스크탑 구분 없이 TableColumnToggler를 렌더링합니다.
            // 이제 모바일에서도 컬럼 설정을 사용할 수 있습니다.
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
        setSidebarTriggers({
            onRegisterClick: handleOpenRegisterSidebar,
            onSettingsClick: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar, // onClose 콜백을 설정하여 하위 컴포넌트에서 호출할 수 있도록 함
        });

        return () => {
            setRightSidebarContent(null);
            setStudentSearchProps(null);
            setSidebarTriggers({});
        };
    }, [handleOpenRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar, setRightSidebarContent, setStudentSearchProps, setSidebarTriggers]);
    
    
    useEffect(() => {
        setStudentSearchProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            suggestionGroups: suggestionGroupsJSON,
        });
    }, [searchTerm, activeFilters, suggestionGroupsJSON, handleFilterChange, handleResetFilters, setStudentSearchProps]);
    
    
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
            />
        </div>
    );
};

export default DashBoard;