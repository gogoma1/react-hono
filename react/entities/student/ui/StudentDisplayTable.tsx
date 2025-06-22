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
    onEdit: (student: Student) => void;
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
    onEdit: (student: Student) => void;
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

    // [추가] 모바일 컬럼 숨기기/보이기 기능을 위해 uiStore에서 상태 가져오기
    const { columnVisibility } = useUIStore();
    
    const onEditRequest = () => {
        onEdit(student);
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
                        {/* [수정] '상태' 컬럼이 보일 때만 뱃지 렌더링 */}
                        {columnVisibility.status && <Badge className={`status-${student.status.toLowerCase()}`}>{student.status}</Badge>}
                    </div>
                    <div className="main-info-tags">
                        {/* [수정] '학년', '과목' 컬럼이 보일 때만 해당 정보 렌더링 */}
                        {columnVisibility.grade && <span>{student.grade}</span>}
                        {columnVisibility.subject && <span>{student.subject}</span>}
                        {student.class_name && <span>{student.class_name}</span>}
                    </div>
                </div>
                {/* [수정] 각 상세 정보 항목을 컬럼 보이기/숨기기 상태에 따라 조건부 렌더링 */}
                <div className="card-details-grid">
                    <div className="detail-item phones">
                        {columnVisibility.guardian_phone && <span>학부모: {student.guardian_phone || '-'}</span>}
                        {columnVisibility.student_phone && <span>학생: {student.student_phone || '-'}</span>}
                    </div>
                    <div className="detail-item school-tuition">
                        {columnVisibility.school_name && <span>학교: {student.school_name || '-'}</span>}
                        {columnVisibility.tuition && <span>수강료: {student.tuition ? student.tuition.toLocaleString() : '-'}</span>}
                    </div>
                    <div className="detail-item dates">
                        {columnVisibility.admission_date && <span>입원일: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>}
                        {columnVisibility.discharge_date && <span>퇴원일: {student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-'}</span>}
                    </div>
                    <div className="detail-item teacher-info">
                        {columnVisibility.teacher && <span>담당 강사: {student.teacher || '-'}</span>}
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
            render: (student) => (
                <StudentActionButtons 
                    studentId={student.id} 
                    studentName={student.student_name} 
                    isEditing={props.editingStatusRowId === student.id} 
                    onEdit={() => props.onEdit(student)}
                    onNavigate={() => props.onNavigate(student.id)}
                    onToggleStatusEditor={() => props.onToggleStatusEditor(student.id)}
                    onStatusUpdate={props.onStatusUpdate} 
                    onCancel={props.onCancel}
                />
            ),
            className: 'sticky-col last-sticky-col',
        },
    ];

    const columns = useMemo(() => {
        // [수정] allColumns가 변경될 때마다 재계산되도록 의존성 배열에 추가
        return allColumns.filter(col => {
            // hasOwnProperty 체크는 columnVisibility가 null/undefined일 수 있는 경우에 대비
            return !Object.prototype.hasOwnProperty.call(columnVisibility, col.key) || columnVisibility[col.key as string];
        });
    }, [columnVisibility, allColumns]);


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