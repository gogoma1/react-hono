import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayMobile.css';

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
    selectedIds: Set<string>; // [핵심] 선택된 ID Set을 props로 받습니다.
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
    student, activeCardId, onCardClick, editingStatusRowId, onEdit,
    onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, closeActiveCard,
    selectedIds, // [핵심] props에서 selectedIds를 받습니다.
}) => {
    const isActive = activeCardId === student.id;
    const isEditingStatus = editingStatusRowId === student.id;
    const visibleColumns = useVisibleColumns();
    const isSelected = selectedIds.has(student.id); // [핵심] 현재 카드가 선택되었는지 확인합니다.

    const onEditRequest = () => {
        onEdit(student);
        closeActiveCard();
    };

    const onNavigateRequest = () => onNavigate(student.id);
    const onToggleStatusEditorRequest = () => onToggleStatusEditor(student.id);

    // [핵심] isSelected 값에 따라 'selected' 클래스를 동적으로 추가합니다.
    const cardClassName = `mobile-student-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`.trim();

    return (
        <div 
            className={cardClassName}
            onClick={() => onCardClick(student.id)}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
            aria-selected={isSelected} // [핵심] 접근성을 위해 aria-selected 속성을 추가합니다.
        >
            <div className="card-content-wrapper">
                <div className="card-main-info">
                    <div className="main-info-name-status">
                        <span className="main-info-name">{student.student_name}</span>
                        {visibleColumns.status && <Badge className={`status-${student.status.toLowerCase()}`}>{student.status}</Badge>}
                    </div>
                    <div className="main-info-tags">
                        {visibleColumns.grade && <span>{student.grade}</span>}
                        {visibleColumns.subject && <span>{student.subject}</span>}
                        {student.class_name && <span>{student.class_name}</span>}
                    </div>
                </div>
                <div className="card-details-grid">
                    <div className="detail-item phones">
                        {visibleColumns.guardian_phone && <span>학부모: {student.guardian_phone || '-'}</span>}
                        {visibleColumns.student_phone && <span>학생: {student.student_phone || '-'}</span>}
                    </div>
                    <div className="detail-item school-tuition">
                        {visibleColumns.school_name && <span>학교: {student.school_name || '-'}</span>}
                        {visibleColumns.tuition && <span>수강료: {student.tuition ? student.tuition.toLocaleString() : '-'}</span>}
                    </div>
                    <div className="detail-item dates">
                        {visibleColumns.admission_date && <span>입원일: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>}
                        {visibleColumns.discharge_date && <span>퇴원일: {student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-'}</span>}
                    </div>
                    <div className="detail-item teacher-info">
                        {visibleColumns.teacher && <span>담당 강사: {student.teacher || '-'}</span>}
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <StudentActionButtons
                    studentId={student.id} studentName={student.student_name} isEditing={isEditingStatus}
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
    selectedIds: Set<string>; // 이 prop이 MobileStudentCard로 전달됩니다.
};

const StudentDisplayMobile: React.FC<StudentDisplayProps> = (props) => {
    const { students, isLoading, selectedIds, ...rest } = props;

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
                    selectedIds={selectedIds} // [핵심] selectedIds를 MobileStudentCard로 전달합니다.
                    {...rest}
                />
            ))}
        </div>
    );
};

export default StudentDisplayMobile;