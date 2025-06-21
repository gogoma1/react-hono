import React, { forwardRef, useMemo } from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import './StudentDisplayTable.css';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useUIStore } from '../../../shared/store/uiStore';

type StatusValue = Student['status'];

interface MobileStudentCardProps {
    student: Student;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    editingStatusRowId: string | null;
    onEdit: (studentId: string) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
    closeActiveCard: () => void;
}


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
    scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    closeActiveCard: () => void;
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
    student,
    activeCardId,
    onCardClick,
    editingStatusRowId,
    onEdit,
    onNavigate,
    onToggleStatusEditor,
    onStatusUpdate,
    onCancel,
    closeActiveCard,
}) => {
    const isActive = activeCardId === student.id;
    const isEditingStatus = editingStatusRowId === student.id;
    
    const onEditRequest = () => {
        onEdit(student.id);
        closeActiveCard();
    };

    const onNavigateRequest = () => {
        onNavigate(student.id);
    };

    const onToggleStatusEditorRequest = () => {
        onToggleStatusEditor(student.id);
    };

    return (
        <div 
            className={`mobile-student-card ${isActive ? 'active' : ''}`} 
            onClick={() => onCardClick(student.id)}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
        >
            <div className="card-content-wrapper">
                <div className="card-main-info">
                    <div className="main-info-name-status">
                        <span className="main-info-name">{student.student_name}</span>
                        <Badge className={`status-${student.status.toLowerCase()}`}>{student.status}</Badge>
                    </div>
                    <div className="main-info-tags">
                        <span>{student.grade}</span>
                        {student.class_name && <span>{student.class_name}</span>}
                    </div>
                </div>
                <div className="card-details-grid">
                    <div className="detail-item phones">
                        <span>학부모: {student.guardian_phone || '-'}</span>
                        <span>학생: {student.student_phone || '-'}</span>
                    </div>
                    <div className="detail-item school-tuition">
                        <span>학교: {student.school_name || '-'}</span>
                        <span>수강료: {student.tuition ? student.tuition.toLocaleString() : '-'}</span>
                    </div>
                    <div className="detail-item dates">
                        <span>입원일: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>
                        <span>퇴원일: {student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="detail-item teacher-info">
                        <span>담당 강사: {student.teacher || '-'}</span>
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <StudentActionButtons
                    studentId={student.id}
                    studentName={student.student_name}
                    isEditing={isEditingStatus}
                    onEdit={onEditRequest} 
                    onNavigate={onNavigateRequest}
                    onToggleStatusEditor={onToggleStatusEditorRequest}
                    onStatusUpdate={onStatusUpdate}
                    onCancel={onCancel}
                />
            </div>
        </div>
    );
};

const StudentDisplayTable = forwardRef<HTMLDivElement, StudentDisplayTableProps>(
  (props, ref) => {
    const {
        students, isLoading, sortConfig, onSort, selectedIds, onToggleRow,
        isHeaderChecked, onToggleHeader, isHeaderDisabled, scrollContainerProps,
        ...rest
    } = props;
    
    const { currentBreakpoint, columnVisibility } = useUIStore();
    
    // [핵심 수정] 훅(useMemo)을 조건부 return 보다 먼저 호출하여 Rules of Hooks 위반 문제를 해결합니다.
    const allColumns: TableColumn<Student>[] = [
        {
            key: 'header_action_button',
            header: <div className="header-icon-container"><button type="button" className="header-icon-button" title={isHeaderChecked ? "모든 항목 선택 해제" : "모든 항목 선택"} onClick={onToggleHeader} disabled={isHeaderDisabled || students.length === 0} aria-pressed={isHeaderChecked}><LuListChecks size={20} /></button></div>,
            render: (student) => <TableCellCheckbox isChecked={selectedIds.has(student.id)} onToggle={() => onToggleRow(student.id)} ariaLabel={`학생 ${student.student_name} 선택`}/>,
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
            render: (student) => <StudentActionButtons studentId={student.id} studentName={student.student_name} isEditing={props.editingStatusRowId === student.id} onEdit={props.onEdit} onNavigate={props.onNavigate} onToggleStatusEditor={props.onToggleStatusEditor} onStatusUpdate={props.onStatusUpdate} onCancel={props.onCancel}/>,
            className: 'sticky-col last-sticky-col',
        },
    ];

    const columns = useMemo(() => {
        return allColumns.filter(col => {
            return !columnVisibility.hasOwnProperty(col.key) || columnVisibility[col.key as string];
        });
    }, [columnVisibility]);


    // 이제 조건부로 return 해도 안전합니다.
    if (currentBreakpoint === 'mobile') {
        if (isLoading) {
            return <div className="mobile-loading-state">로딩 중...</div>;
        }
        if (students.length === 0) {
            return <div className="mobile-loading-state">표시할 학생 정보가 없습니다.</div>;
        }
        return (
            <div className="mobile-student-list-container">
                {students.map(student => (
                    <MobileStudentCard 
                        key={student.id} 
                        student={student}
                        activeCardId={rest.activeCardId}
                        onCardClick={rest.onCardClick}
                        editingStatusRowId={rest.editingStatusRowId}
                        onEdit={rest.onEdit}
                        onNavigate={rest.onNavigate}
                        onToggleStatusEditor={rest.onToggleStatusEditor}
                        onStatusUpdate={rest.onStatusUpdate}
                        onCancel={rest.onCancel}
                        closeActiveCard={rest.closeActiveCard}
                    />
                ))}
            </div>
        );
    }
    
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


StudentDisplayTable.displayName = 'StudentDisplayTable';

export default StudentDisplayTable;