import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Tippy from '@tippyjs/react';
import { LuCirclePlus, LuCircleX } from 'react-icons/lu';

import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../entities/student/model/useStudentDataWithRQ';

import StudentRegistrationForm from '../features/student-registration/ui/StudentRegistrationForm';
import StudentEditForm from '../features/student-editing/ui/StudentEditForm';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useTableSearch } from '../features/table-search/model/useTableSearch';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';

const PlusIcon = () => <LuCirclePlus size={22} />;
const CloseIcon = () => <LuCircleX size={22} />;

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
    const { setRightSidebarContent, setRightSidebarTrigger, setStudentSearchProps } = useLayoutStore();
    const { isRightSidebarExpanded, setRightSidebarExpanded } = useUIStore();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [sidebarMode, setSidebarMode] = useState<'register' | 'edit'>('register');
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const prevIsRightSidebarExpanded = usePrevious(isRightSidebarExpanded);

    const currentStudents = students || [];

    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        return [
            { key: 'grade', suggestions: getUniqueSortedValues(currentStudents, 'grade') },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            { key: 'class_name', suggestions: getUniqueSortedValues(currentStudents, 'class_name') },
            { key: 'teacher', suggestions: getUniqueSortedValues(currentStudents, 'teacher') },
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

    const handleFormSuccess = useCallback(() => {
        setRightSidebarExpanded(false);
    }, [setRightSidebarExpanded]);
    
    const handleRequestEdit = useCallback((student: Student) => {
        setSidebarMode('edit');
        setStudentToEdit(student);
        setRightSidebarExpanded(true);
    }, [setRightSidebarExpanded]);

    const handleOpenRegisterSidebar = useCallback(() => {
        setSidebarMode('register');
        setStudentToEdit(null);
        setRightSidebarExpanded(true);
    }, [setRightSidebarExpanded]);

    useEffect(() => {
        const content = sidebarMode === 'edit' && studentToEdit
            ? <StudentEditForm student={studentToEdit} onSuccess={handleFormSuccess} />
            : <StudentRegistrationForm onSuccess={handleFormSuccess} />;
        setRightSidebarContent(content);

        const triggerComponent = isRightSidebarExpanded ? (
            <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                <button onClick={() => setRightSidebarExpanded(false)} className="settings-toggle-button active" aria-label="사이드바 닫기">
                    <CloseIcon />
                </button>
            </Tippy>
        ) : (
            <Tippy content="신입생 등록" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                <button onClick={handleOpenRegisterSidebar} className="settings-toggle-button" aria-label="신입생 등록">
                    <PlusIcon />
                </button>
            </Tippy>
        );
        setRightSidebarTrigger(triggerComponent);

    }, [sidebarMode, studentToEdit, isRightSidebarExpanded, handleFormSuccess, handleOpenRegisterSidebar, setRightSidebarContent, setRightSidebarTrigger, setRightSidebarExpanded]);

    useEffect(() => {
        setStudentSearchProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            suggestionGroups: suggestionGroupsJSON,
        });
    }, [searchTerm, activeFilters, suggestionGroupsJSON, handleFilterChange, setStudentSearchProps]);

    useEffect(() => {
        if (prevIsRightSidebarExpanded && !isRightSidebarExpanded) {
            const timer = setTimeout(() => {
                setSidebarMode('register');
                setStudentToEdit(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isRightSidebarExpanded, prevIsRightSidebarExpanded]);
    
    useEffect(() => {
        return () => {
            setRightSidebarContent(null);
            setRightSidebarTrigger(null);
            setStudentSearchProps(null);
        };
    }, [setRightSidebarContent, setRightSidebarTrigger, setStudentSearchProps]);
    
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
            {/* 
                [핵심 수정] 
                모바일 화면에서 보이던 플로팅 액션 버튼(FAB) 렌더링 로직을 완전히 삭제합니다.
            */}
        </div>
    );
};

export default DashBoard;