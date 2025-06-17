import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import StudentDisplayTable from '../../entities/student/ui/StudentDisplayTable';
// [수정] GRADE_LEVELS 상수를 import합니다.
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../../features/row-selection/model/useRowSelection';
import type { SortConfig } from '../../shared/ui/glasstable/GlassTable';

type StatusValue = Student['status'];

const statusOrder: { [key in StatusValue]: number } = {
    '재원': 1, '휴원': 2, '퇴원': 3,
};

interface StudentTableWidgetProps {
    onRequestEdit: (student: Student) => void;
}

const StudentTableWidget: React.FC<StudentTableWidgetProps> = ({ onRequestEdit }) => {
    const navigate = useNavigate();
    const { students, isLoadingStudents, isStudentsError, studentsError, updateStudent, deleteStudent } = useStudentDataWithRQ();

    const [editingStatusRowId, setEditingStatusRowId] = useState<string | null>(null);
    const studentList: Student[] = students || [];
    const studentIds = useMemo(() => studentList.map(s => s.id), [studentList]);

    const { selectedIds, toggleRow, isAllSelected, toggleSelectAll } = useRowSelection<string>({ allItems: studentIds });
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'student_name', direction: 'asc' });

    const sortedStudents = useMemo(() => {
        return [...studentList].sort((a, b) => {
            // 1. 상태(status)를 기준으로 1차 정렬
            const statusComparison = statusOrder[a.status] - statusOrder[b.status];
            if (statusComparison !== 0) {
                return statusComparison;
            }

            // 2. 사용자가 선택한 기준으로 2차 정렬
            if (!sortConfig) return 0;
            
            // ▼▼▼▼▼ [핵심] '학년' 컬럼에 대한 커스텀 정렬 로직 ▼▼▼▼▼
            if (sortConfig.key === 'grade') {
                // GRADE_LEVELS 배열에서 각 학년의 순번(index)을 찾습니다.
                const aRank = GRADE_LEVELS.indexOf(a.grade);
                const bRank = GRADE_LEVELS.indexOf(b.grade);

                // 만약 목록에 없는 학년값(예: null 또는 예외 케이스)이 있다면 맨 뒤로 보냅니다.
                const aFinalRank = aRank === -1 ? Infinity : aRank;
                const bFinalRank = bRank === -1 ? Infinity : bRank;

                const comparison = aFinalRank - bFinalRank;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }
            // ▲▲▲▲▲ [핵심] 로직 끝 ▲▲▲▲▲

            // '학년'이 아닌 다른 모든 컬럼에 대한 일반 정렬 로직
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
        setSortConfig(current => ({
            key,
            direction: (current && current.key === key && current.direction === 'asc') ? 'desc' : 'asc'
        }));
    };

    const handleEdit = (studentId: string) => {
        const student = studentList.find(s => s.id === studentId);
        if (student) {
            onRequestEdit(student);
        } else {
            console.error("수정할 학생을 찾을 수 없습니다:", studentId);
        }
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
                if (window.confirm("정말로 이 학생 정보를 삭제(퇴원 처리)하시겠습니까?")) {
                    await deleteStudent(studentId); 
                }
            } else {
                await updateStudent({ id: studentId, status: newStatus });
            }
        } catch (error) {
            console.error("상태 업데이트 중 오류 발생:", error);
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