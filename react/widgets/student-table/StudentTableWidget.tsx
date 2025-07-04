import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import StudentDisplay from '../../entities/student/ui/StudentDisplay';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../entities/student/model/useStudentDataWithRQ';
import type { SortConfig } from '../../shared/ui/glasstable/GlassTable';
import { useDragToScroll } from '../../shared/hooks/useDragToScroll';

type StatusValue = Student['status'];

const statusOrder: { [key in StatusValue]: number } = {
    '재원': 1, '휴원': 2, '퇴원': 3,
};

interface StudentTableWidgetProps {
    students: Student[];
    isLoading: boolean;
    onRequestEdit: (student: Student) => void;
    selectedIds: Set<string>;
    toggleRow: (id: string) => void;
    isAllSelected: boolean;
    toggleSelectAll: () => void;
}

const StudentTableWidget: React.FC<StudentTableWidgetProps> = ({ 
    students = [], 
    isLoading, 
    onRequestEdit,
    selectedIds,
    toggleRow,
    isAllSelected,
    toggleSelectAll
}) => {
    const { ref: scrollContainerRef, onMouseDown, isDragging } = useDragToScroll<HTMLDivElement>();
    const navigate = useNavigate();
    const { updateStudent, deleteStudent } = useStudentDataWithRQ();

    const [editingStatusRowId, setEditingStatusRowId] = useState<string | null>(null);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'student_name', direction: 'asc' });

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            const statusComparison = statusOrder[a.status] - statusOrder[b.status];
            if (statusComparison !== 0) {
                return statusComparison;
            }

            if (!sortConfig) return 0;
            
            if (sortConfig.key === 'grade') {
                const aRank = GRADE_LEVELS.indexOf(a.grade);
                const bRank = GRADE_LEVELS.indexOf(b.grade);
                const aFinalRank = aRank === -1 ? Infinity : aRank;
                const bFinalRank = bRank === -1 ? Infinity : bRank;
                const comparison = aFinalRank - bFinalRank;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            const key = sortConfig.key as keyof Student;
            const aValue = a[key];
            const bValue = b[key];
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            const comparison = typeof aValue === 'number' && typeof bValue === 'number'
                ? aValue - bValue
                : String(aValue).localeCompare(String(bValue));

            return sortConfig.direction === 'asc' ? comparison : -comparison;
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
    );
};

export default StudentTableWidget;