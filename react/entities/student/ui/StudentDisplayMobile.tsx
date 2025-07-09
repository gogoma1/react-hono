import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../model/types';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { STUDENT_DASHBOARD_COLUMN_CONFIG } from '../../../shared/hooks/useColumnPermissions';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayMobile.css';

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
    selectedIds: Set<string>;
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
    student, activeCardId, onCardClick, editingStatusRowId, onEdit,
    onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, closeActiveCard,
    selectedIds,
}) => {
    const isActive = activeCardId === student.id;
    const isEditingStatus = editingStatusRowId === student.id;
    const visibleColumns = useVisibleColumns(STUDENT_DASHBOARD_COLUMN_CONFIG);
    const isSelected = selectedIds.has(student.id);

    const onEditRequest = () => { onEdit(student); closeActiveCard(); };
    const onNavigateRequest = () => onNavigate(student.id);
    const onToggleStatusEditorRequest = () => onToggleStatusEditor(student.id);

    const cardClassName = `mobile-student-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`.trim();

    const studentName = student.details?.student_name || '이름 없음';

    return (
        <div 
            className={cardClassName}
            onClick={() => onCardClick(student.id)}
            role="button" tabIndex={0}
            aria-expanded={isActive} aria-selected={isSelected}
        >
            <div className="card-content-wrapper">
                <div className="card-main-info">
                    <div className="main-info-name-status">
                        <span className="main-info-name">{studentName}</span>
                        {/* [핵심 수정] statusMap 사용 */}
                        {visibleColumns.status && <Badge className={`status-${student.status.toLowerCase()}`}>{statusMap[student.status] || student.status}</Badge>}
                    </div>
                    <div className="main-info-tags">
                        {visibleColumns.grade && <span>{student.details?.grade}</span>}
                        {visibleColumns.subject && <span>{student.details?.subject}</span>}
                        {student.details?.class_name && <span>{student.details.class_name}</span>}
                    </div>
                </div>
                <div className="card-details-grid">
                    <div className="detail-item phones">
                        {/* [핵심 수정] formatPhoneNumber 사용 */}
                        {visibleColumns.guardian_phone && <span>학부모: {formatPhoneNumber(student.details?.guardian_phone)}</span>}
                        {visibleColumns.student_phone && <span>학생: {formatPhoneNumber(student.details?.student_phone)}</span>}
                    </div>
                    <div className="detail-item school-tuition">
                        {visibleColumns.school_name && <span>학교: {student.details?.school_name || '-'}</span>}
                        {visibleColumns.tuition && <span>수강료: {student.details?.tuition ? student.details.tuition.toLocaleString() : '-'}</span>}
                    </div>
                    <div className="detail-item dates">
                        {/* [핵심 수정] start_date와 end_date를 사용 */}
                        {visibleColumns.admission_date && <span>입원일: {student.start_date ? new Date(student.start_date).toLocaleDateString() : '-'}</span>}
                        {visibleColumns.discharge_date && <span>퇴원일: {student.end_date ? new Date(student.end_date).toLocaleDateString() : '-'}</span>}
                    </div>
                    <div className="detail-item teacher-info">
                        {visibleColumns.teacher && <span>담당 강사: {student.teacher || '-'}</span>}
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <StudentActionButtons
                    studentId={student.id} studentName={studentName} isEditing={isEditingStatus}
                    onEdit={onEditRequest} onNavigate={onNavigateRequest} onToggleStatusEditor={onToggleStatusEditorRequest}
                    onStatusUpdate={onStatusUpdate} onCancel={onCancel}
                />
            </div>
        </div>
    );
};

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    closeActiveCard: () => void;
    selectedIds: Set<string>;
};

const StudentDisplayMobile: React.FC<StudentDisplayProps> = (props) => {
    const { students, isLoading, selectedIds, ...rest } = props;

    if (isLoading) return <div className="mobile-loading-state">로딩 중...</div>;
    if (students.length === 0) return <div className="mobile-loading-state">표시할 학생 정보가 없습니다.</div>;

    return (
        <div className="mobile-student-list-container">
            {students.map(student => (
                <MobileStudentCard 
                    key={student.id} 
                    student={student}
                    selectedIds={selectedIds}
                    {...rest}
                />
            ))}
        </div>
    );
};

export default StudentDisplayMobile;