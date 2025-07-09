import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import StudentDisplay from '../../entities/student/ui/StudentDisplay';
import { useStudentDataWithRQ } from '../../entities/student/model/useStudentDataWithRQ';
import { GRADE_LEVELS, type Student } from '../../entities/student/model/types';
import type { SortConfig } from '../../shared/ui/glasstable/GlassTable';
import { useDragToScroll } from '../../shared/hooks/useDragToScroll';
// [삭제] CSS 파일 임포트 제거
// import './StudentTableWidget.css'; 

type StatusValue = Student['status'];

const statusOrder: { [key in StatusValue]: number } = {
    active: 1,
    inactive: 2,
    resigned: 3,
};

interface StudentTableWidgetProps {
    students: Student[];
    isLoading: boolean;
    onRequestEdit: (student: Student) => void;
    selectedIds: Set<string>;
    toggleRow: (id: string) => void;
    isAllSelected: boolean;
    toggleSelectAll: () => void;
    children?: React.ReactNode;
}

const StudentTableWidget: React.FC<StudentTableWidgetProps> = ({ 
    students = [], 
    isLoading, 
    onRequestEdit,
    selectedIds,
    toggleRow,
    isAllSelected,
    toggleSelectAll,
    children,
}) => {
    const { ref: scrollContainerRef, onMouseDown, isDragging } = useDragToScroll<HTMLDivElement>();
    const navigate = useNavigate();
    const { updateStudent, deleteStudent } = useStudentDataWithRQ(null); 

    const [editingStatusRowId, setEditingStatusRowId] = useState<string | null>(null);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    useEffect(() => {
        setSortConfig(null);
        setEditingStatusRowId(null);
        setActiveCardId(null);
    }, [students]);

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            const statusComparison = statusOrder[a.status] - statusOrder[b.status];
            if (statusComparison !== 0) {
                return statusComparison;
            }

            if (!sortConfig) return 0;

            const { key, direction } = sortConfig;
            
            if (key === 'grade') {
                const aRank = GRADE_LEVELS.indexOf(a.grade || '');
                const bRank = GRADE_LEVELS.indexOf(b.grade || '');
                const aFinalRank = aRank === -1 ? Infinity : aRank;
                const bFinalRank = bRank === -1 ? Infinity : bRank;
                const comparison = aFinalRank - bFinalRank;
                return direction === 'asc' ? comparison : -comparison;
            }

            if (key === 'teacher') {
                const aFirstTeacher = a.teacher?.split(',')[0].trim() || '';
                const bFirstTeacher = b.teacher?.split(',')[0].trim() || '';
                const comparison = aFirstTeacher.localeCompare(bFirstTeacher);
                return direction === 'asc' ? comparison : -comparison;
            }

            const aValue = a[key as keyof Student];
            const bValue = b[key as keyof Student];

            if (aValue == null || aValue === '-') return 1;
            if (bValue == null || bValue === '-') return -1;
            
            const comparison = typeof aValue === 'number' && typeof bValue === 'number'
                ? aValue - bValue
                : String(aValue).localeCompare(String(bValue));
            
            return direction === 'asc' ? comparison : -comparison;
        });
    }, [students, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: (current && current.key === key && current.direction === 'asc') ? 'desc' : 'asc'
        }));
    };
    
    const handleNavigate = (studentId: string) => {
        setEditingStatusRowId(null);
        navigate(`/student/${studentId}`);
    };

    const handleToggleStatusEditor = (studentId: string) => {
        setEditingStatusRowId(prevId => (prevId === studentId ? null : studentId));
    };

    const handleStatusUpdate = async (studentId: string, newStatus: StatusValue | 'delete') => {
        try {
            if (newStatus === 'delete') {
                if (window.confirm("정말로 이 학생 정보를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    await deleteStudent(studentId);
                }
            } else {
                await updateStudent({ id: studentId, status: newStatus });
            }
        } catch (error) {
            console.error("상태 업데이트 또는 삭제 중 오류 발생:", error);
        } finally {
            setEditingStatusRowId(null);
            setActiveCardId(null);
        }
    };

    const handleCancelStatusEdit = () => {
        setEditingStatusRowId(null);
    };

    const handleCardClick = (studentId: string) => {
        if (editingStatusRowId !== null) return;
        setActiveCardId(prevId => (prevId === studentId ? null : studentId));
    };
    
    const closeActiveCard = () => {
        setActiveCardId(null);
    };

    return (
        <div className="student-table-widget">
            <div className="widget-title-container">
                {children}
            </div>
            <StudentDisplay
                ref={scrollContainerRef}
                scrollContainerProps={{
                    onMouseDown: onMouseDown,
                    className: `draggable ${isDragging ? 'dragging' : ''}`.trim(),
                }}
                students={sortedStudents}
                isLoading={isLoading}
                sortConfig={sortConfig}
                onSort={handleSort}
                selectedIds={selectedIds}
                onToggleRow={toggleRow}
                isHeaderChecked={isAllSelected}
                onToggleHeader={toggleSelectAll}
                isHeaderDisabled={students.length === 0}
                editingStatusRowId={editingStatusRowId}
                onEdit={onRequestEdit} 
                onNavigate={handleNavigate}
                onToggleStatusEditor={handleToggleStatusEditor}
                onStatusUpdate={handleStatusUpdate}
                onCancel={handleCancelStatusEdit}
                activeCardId={activeCardId}
                onCardClick={handleCardClick}
                closeActiveCard={closeActiveCard}
            />
        </div>
    );
};

export default StudentTableWidget;