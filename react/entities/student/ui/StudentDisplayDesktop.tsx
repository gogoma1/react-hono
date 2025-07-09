import React, { forwardRef, useMemo } from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/types';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
// [수정] useVisibleColumns 대신, order와 visibility를 모두 포함하는 columnSettingsStore를 직접 사용합니다.
import { useColumnSettingsStore } from '../../../shared/store/columnSettingsStore'; 
import { STUDENT_DASHBOARD_COLUMN_CONFIG } from '../../../shared/hooks/useColumnPermissions';
import './StudentDisplayDesktop.css';

const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return '-';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
};

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
    
    // [수정] store에서 visibility와 order 상태를 모두 가져옵니다.
    const { visibility: columnVisibility, order: columnOrder } = useColumnSettingsStore();
    const studentDashboardColumnOrder = columnOrder.studentDashboard;
    
    const columns = useMemo((): TableColumn<Student>[] => {
        // [수정] 모든 컬럼 정의를 Map으로 만들어 순서에 따라 쉽게 참조할 수 있도록 합니다.
        const columnConfigMap = new Map<string, Omit<TableColumn<Student>, 'key'>>([
            ['student_name', { header: '이름', isSortable: true, render: (s) => s.details?.student_name || '이름 없음' }],
            ['grade', { header: '학년', isSortable: true, render: (s) => s.grade || '-' }],
            ['class_name', { header: '반', isSortable: true, render: (s) => s.class_name || '-' }],
            ['subject', { header: '과목', isSortable: true, render: (s) => s.subject || '-' }],
            ['status', { 
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
            }],
            ['teacher', { header: '담당 강사', isSortable: true, render: (s) => s.teacher || '-' }],
            ['student_phone', { header: '학생 연락처', render: (s) => formatPhoneNumber(s.student_phone) }],
            ['guardian_phone', { header: '학부모 연락처', render: (s) => formatPhoneNumber(s.guardian_phone) }],
            ['school_name', { header: '학교명', isSortable: true, render: (s) => s.school_name || '-' }],
            ['tuition', { header: '수강료', isSortable: true, render: (s) => s.tuition ? s.tuition.toLocaleString() : '-' }],
            ['admission_date', { header: '입원일', isSortable: true, render: (s) => s.admission_date ? new Date(s.admission_date).toLocaleDateString() : '-' }],
            ['discharge_date', { header: '퇴원일', render: (s) => s.discharge_date ? new Date(s.discharge_date).toLocaleDateString() : '-' }],
        ]);

        // [수정] store에서 가져온 순서(studentDashboardColumnOrder)를 기반으로 동적 컬럼들을 생성합니다.
        const dynamicColumns = studentDashboardColumnOrder
            .map(key => {
                const isVisible = columnVisibility[key] ?? !STUDENT_DASHBOARD_COLUMN_CONFIG.find(c => c.key === key)?.defaultHidden;
                if (!isVisible) return null;
                
                const config = columnConfigMap.get(key);
                if (!config) return null;

                return { key, ...config } as TableColumn<Student>;
            })
            .filter((col): col is TableColumn<Student> => col !== null);

        // [수정] 고정 컬럼과 동적 컬럼을 합쳐 최종 컬럼 배열을 완성합니다.
        return [
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
            // 이름은 항상 표시되도록 고정합니다.
            { key: 'student_name', header: '이름', isSortable: true, render: (s) => s.details?.student_name || '이름 없음' },
            ...dynamicColumns,
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
        studentDashboardColumnOrder, // [수정] 의존성 배열에 순서 추가
        columnVisibility,           // [수정] 의존성 배열에 가시성 추가
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