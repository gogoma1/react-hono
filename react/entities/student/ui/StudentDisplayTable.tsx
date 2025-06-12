import React from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import './StudentDisplayTable.css';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';

type StatusValue = Student['status'];

interface StudentDisplayTableProps {
    students: Student[];
    isLoading?: boolean;
    sortConfig?: SortConfig | null;
    onSort?: (key: string) => void;
    selectedIds: Set<string>;
    onToggleRow: (studentId: string) => void;
    isHeaderChecked: boolean;
    onToggleHeader: () => void;
    isHeaderDisabled?: boolean;
    editingStatusRowId: string | null;
    onEdit: (studentId: string) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
}

const StudentDisplayTable: React.FC<StudentDisplayTableProps> = ({
    students,
    isLoading = false,
    sortConfig,
    onSort,
    selectedIds,
    onToggleRow,
    isHeaderChecked,
    onToggleHeader,
    isHeaderDisabled = false,
    editingStatusRowId,
    onEdit,
    onNavigate,
    onToggleStatusEditor,
    onStatusUpdate,
    onCancel,
}) => {
    const columns: TableColumn<Student>[] = [
        {
            key: 'header_action_button',
            header: (
                <div className="header-icon-container">
                    <button
                        type="button"
                        className="header-icon-button"
                        title={isHeaderChecked ? "모든 항목 선택 해제" : "모든 항목 선택"}
                        onClick={onToggleHeader}
                        disabled={isHeaderDisabled || students.length === 0}
                        aria-pressed={isHeaderChecked}
                    >
                        <LuListChecks size={20} />
                    </button>
                </div>
            ),
            render: (student) => (
                <TableCellCheckbox
                    isChecked={selectedIds.has(student.id)}
                    onToggle={() => onToggleRow(student.id)}
                    ariaLabel={`학생 ${student.student_name} 선택`}
                />
            ),
        },
        { key: 'student_name', header: '이름', isSortable: true },
        { key: 'grade', header: '학년', isSortable: true },
        { key: 'subject', header: '과목', isSortable: true },
        { 
            key: 'status', 
            header: '상태', 
            isSortable: true, 
            render: (student) => {
                let statusClassName = '';
                switch (student.status) {
                    case '재원': statusClassName = 'status-enroll'; break;
                    case '휴원': statusClassName = 'status-pause'; break;
                    case '퇴원': statusClassName = 'status-leave'; break;
                    default: statusClassName = 'status-default';
                }
                return <Badge className={statusClassName}>{student.status}</Badge>;
            }
        },
        { key: 'student_phone', header: '학생 연락처', render: (student) => student.student_phone || '-' },
        { key: 'guardian_phone', header: '학부모 연락처' },
        { key: 'school_name', header: '학교명', isSortable: true },
        { key: 'tuition', header: '수강료', isSortable: true },
        { key: 'admission_date', header: '입원일', isSortable: true, render: (student) => student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-' },
        { key: 'discharge_date', header: '퇴원일' },
        {
            key: 'actions',
            header: '관리',
            render: (student) => (
                <StudentActionButtons
                    studentId={student.id}
                    studentName={student.student_name}
                    isEditing={editingStatusRowId === student.id}
                    onEdit={onEdit}
                    onNavigate={onNavigate}
                    onToggleStatusEditor={onToggleStatusEditor}
                    onStatusUpdate={onStatusUpdate}
                    onCancel={onCancel}
                />
            ),
        },
    ];

    return (
        <GlassTable<Student>
            columns={columns}
            data={students}
            isLoading={isLoading}
            emptyMessage="표시할 학생 정보가 없습니다."
            sortConfig={sortConfig}
            onSort={onSort}
        />
    );
};

export default StudentDisplayTable;