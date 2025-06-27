import React, { forwardRef, useMemo } from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayDesktop.css';

type StudentDisplayProps = {
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
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
};

const StudentDisplayDesktop = forwardRef<HTMLDivElement, StudentDisplayProps>((props, ref) => {
    const {
        students, isLoading, sortConfig, onSort, selectedIds, onToggleRow,
        isHeaderChecked, onToggleHeader, isHeaderDisabled, scrollContainerProps,
        onEdit, onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, editingStatusRowId
    } = props;
    
    const visibleColumns = useVisibleColumns();
    
    const columns = useMemo(() => {
        const allColumns: TableColumn<Student>[] = [
            {
                key: 'header_action_button',
                header: <div className="header-icon-container"><button type="button" className="header-icon-button" title={isHeaderChecked ? "모든 항목 선택 해제" : "모든 항목 선택"} onClick={onToggleHeader} disabled={isHeaderDisabled || students.length === 0} aria-pressed={isHeaderChecked}><LuListChecks size={20} /></button></div>,
                render: (student) => (
                    <TableCellCheckbox
                        isChecked={selectedIds.has(student.id)}
                        onToggle={() => onToggleRow(student.id)}
                        ariaLabel={`학생 ${student.student_name} 선택`}
                    />
                ),
                className: 'sticky-col first-sticky-col',
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
            { key: 'teacher', header: '담당 강사', isSortable: true, render: (student) => student.teacher || '-' },
            { key: 'student_phone', header: '학생 연락처', render: (student) => student.student_phone || '-' },
            { key: 'guardian_phone', header: '학부모 연락처' },
            { key: 'school_name', header: '학교명', isSortable: true },
            { key: 'tuition', header: '수강료', isSortable: true, render: (student) => student.tuition ? student.tuition.toLocaleString() : '-' },
            { key: 'admission_date', header: '입원일', isSortable: true, render: (student) => student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-' },
            { key: 'discharge_date', header: '퇴원일', render: (student) => student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-' },
            {
                key: 'actions',
                header: '관리',
                render: (student) => (
                    <StudentActionButtons 
                        studentId={student.id} 
                        studentName={student.student_name} 
                        isEditing={editingStatusRowId === student.id}
                        onEdit={() => onEdit(student)}
                        onNavigate={() => onNavigate(student.id)}
                        onToggleStatusEditor={() => onToggleStatusEditor(student.id)}
                        onStatusUpdate={onStatusUpdate} 
                        onCancel={onCancel}
                    />
                ),
                className: 'sticky-col last-sticky-col',
            },
        ];

        return allColumns.filter(col => visibleColumns[col.key as string]);

    }, [
        students,
        selectedIds,
        editingStatusRowId,
        isHeaderChecked,
        isHeaderDisabled,
        onToggleHeader,
        onToggleRow,
        onEdit,
        onNavigate,
        onToggleStatusEditor,
        onStatusUpdate,
        onCancel,
        visibleColumns,
    ]);

    return (
        <GlassTable<Student>
            ref={ref} 
            scrollContainerProps={scrollContainerProps}
            columns={columns}
            data={students}
            isLoading={isLoading}
            emptyMessage="표시할 학생 정보가 없습니다."
            sortConfig={sortConfig}
            onSort={onSort}
        />
    );
});

StudentDisplayDesktop.displayName = 'StudentDisplayDesktop';
export default StudentDisplayDesktop;