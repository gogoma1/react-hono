// ./react/entities/student/ui/StudentDisplayDesktop.tsx

import React, { forwardRef, useMemo } from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/types';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayDesktop.css';

// 전화번호 포맷팅 유틸리티 함수
const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return '-';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
};

// 상태(status) 한글 매핑 객체
const statusMap: Record<Student['status'], string> = {
    active: '재원',
    inactive: '휴원',
    resigned: '퇴원',
};


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
                        ariaLabel={`학생 ${student.details?.student_name} 선택`}
                    />
                ),
                className: 'sticky-col first-sticky-col',
            },
            { key: 'student_name', header: '이름', isSortable: true, render: (s) => s.details?.student_name || '이름 없음' },
            { key: 'grade', header: '학년', isSortable: true, render: (s) => s.details?.grade || '-' },
            // [핵심 수정] '반(class_name)' 컬럼 추가
            { key: 'class_name', header: '반', isSortable: true, render: (s) => s.details?.class_name || '-' },
            { key: 'subject', header: '과목', isSortable: true, render: (s) => s.details?.subject || '-' },
            { 
                key: 'status', 
                header: '상태', 
                isSortable: true, 
                render: (student) => {
                    let statusClassName = '';
                    switch (student.status) {
                        case 'active': statusClassName = 'status-enroll'; break;
                        case 'inactive': statusClassName = 'status-pause'; break;
                        case 'resigned': statusClassName = 'status-leave'; break;
                        default: statusClassName = 'status-default';
                    }
                    return <Badge className={statusClassName}>{statusMap[student.status] || student.status}</Badge>;
                }
            },
            { key: 'teacher', header: '담당 강사', isSortable: true, render: (s) => s.details?.teacher || '-' },
            { key: 'student_phone', header: '학생 연락처', render: (s) => formatPhoneNumber(s.details?.student_phone) },
            { key: 'guardian_phone', header: '학부모 연락처', render: (s) => formatPhoneNumber(s.details?.guardian_phone) },
            { key: 'school_name', header: '학교명', isSortable: true, render: (s) => s.details?.school_name || '-' },
            { key: 'tuition', header: '수강료', isSortable: true, render: (s) => s.details?.tuition ? s.details.tuition.toLocaleString() : '-' },
            { key: 'admission_date', header: '입원일', isSortable: true, render: (s) => s.start_date ? new Date(s.start_date).toLocaleDateString() : '-' },
            { key: 'discharge_date', header: '퇴원일', render: (s) => s.end_date ? new Date(s.end_date).toLocaleDateString() : '-' },
            {
                key: 'actions',
                header: '관리',
                render: (student) => (
                    <StudentActionButtons 
                        studentId={student.id} 
                        studentName={student.details?.student_name || '학생'} 
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

        return allColumns.filter(col => {
            const key = col.key as string;
            return visibleColumns[key];
        });

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
    
    const tableData = students;

    return (
        <GlassTable<Student>
            ref={ref} 
            scrollContainerProps={scrollContainerProps}
            columns={columns}
            data={tableData}
            isLoading={isLoading}
            emptyMessage="표시할 학생 정보가 없습니다."
            sortConfig={sortConfig}
            onSort={onSort}
        />
    );
});

StudentDisplayDesktop.displayName = 'StudentDisplayDesktop';
export default StudentDisplayDesktop;