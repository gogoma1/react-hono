import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import StudentDisplayTable from '../../entities/student/ui/StudentDisplayTable';
import { useStudentDataWithRQ, type Student } from '../../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../../features/row-selection/model/useRowSelection';
import type { SortConfig } from '../../shared/ui/glasstable/GlassTable';

type StatusValue = Student['status'];

const StudentTableWidget: React.FC = () => {
    const navigate = useNavigate();

    const { 
        students, 
        isLoadingStudents, 
        isStudentsError, 
        studentsError, 
        updateStudent, // 상태 업데이트에 필요
        deleteStudent  // 소프트 삭제에 필요
    } = useStudentDataWithRQ();

    const [editingStatusRowId, setEditingStatusRowId] = useState<string | null>(null);

    const studentList: Student[] = students || [];
    const studentIds = useMemo(() => studentList.map(s => s.id), [studentList]);

    const { selectedIds, toggleRow, isAllSelected, toggleSelectAll } = useRowSelection<string>({ allItems: studentIds });

    const [sortConfig, setSortConfig] = useState<SortConfig | null>({
        key: 'student_name',
        direction: 'asc',
    });

    const sortedStudents = useMemo(() => {
        if (!sortConfig) return studentList;
        return [...studentList].sort((a, b) => {
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
    }, [studentList, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            const direction = (current && current.key === key && current.direction === 'asc') ? 'desc' : 'asc';
            return { key, direction };
        });
    };

    const handleEdit = (studentId: string) => {
        setEditingStatusRowId(null);
        alert(`[Widget] 수정 기능 구현 필요. 학생 ID: ${studentId}`);
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
                if (window.confirm("정말로 이 학생 정보를 삭제(퇴원 처리)하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    // 백엔드의 DELETE가 소프트 삭제를 하므로 deleteStudent 호출
                    await deleteStudent(studentId); 
                }
            } else {
                // '재원', '휴원', '퇴원' 상태 업데이트
                await updateStudent({ id: studentId, status: newStatus });
            }
        } catch (error) {
            console.error("상태 업데이트 중 오류 발생:", error);
            // 에러 처리 UI (예: toast)
        } finally {
            setEditingStatusRowId(null);
        }
    };

    const handleCancelStatusEdit = () => {
        setEditingStatusRowId(null);
    };

    if (isStudentsError) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h2>학생 데이터 로딩 오류</h2>
                <p>{studentsError?.message || '알 수 없는 오류'}</p>
            </div>
        );
    }

    return (
        <StudentDisplayTable
            students={sortedStudents}
            isLoading={isLoadingStudents}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            isHeaderChecked={isAllSelected}
            onToggleHeader={toggleSelectAll}
            isHeaderDisabled={studentList.length === 0}
            editingStatusRowId={editingStatusRowId}
            onEdit={handleEdit}
            onNavigate={handleNavigate}
            onToggleStatusEditor={handleToggleStatusEditor}
            onStatusUpdate={handleStatusUpdate}
            onCancel={handleCancelStatusEdit}
        />
    );
};

export default StudentTableWidget;