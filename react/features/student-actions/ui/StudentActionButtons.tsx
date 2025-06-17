import React from 'react';
import { LuPencil, LuBookUser, LuCircleArrowOutDownRight } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import './StudentActionButtons.css';
import StudentStatusChanger from '../../student-status-changer/ui/StudentStatusChanger';
import type { Student } from '../../../entities/student/model/useStudentDataWithRQ';

type StatusValue = Student['status'];

interface StudentActionButtonsProps {
    studentId: string;
    studentName: string;
    isEditing: boolean;
    onEdit: (id: string) => void;
    onNavigate: (id: string) => void;
    onToggleStatusEditor: (id: string) => void;
    onStatusUpdate: (id: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
}

const StudentActionButtons: React.FC<StudentActionButtonsProps> = ({
    studentId,
    studentName,
    isEditing,
    onEdit,
    onNavigate,
    onToggleStatusEditor,
    onStatusUpdate,
    onCancel,
}) => {
    if (isEditing) {
        return <StudentStatusChanger studentId={studentId} onStatusSelect={onStatusUpdate} onCancel={onCancel} />;
    }

    return (
        <div className="action-cell-buttons">
            {/* 1. 수정 아이콘 */}
            <Tippy content="수정" theme="custom-glass" placement="top">
                <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onEdit(studentId); }}
                    aria-label={`${studentName} 학생 정보 수정`}>
                    <LuPencil size={16} color="#3498db" />
                </button>
            </Tippy>
            {/* 2. 상세보기 아이콘 */}
            <Tippy content="상세 보기" theme="custom-glass" placement="top">
                 <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onNavigate(studentId); }}
                    aria-label={`${studentName} 학생 상세 정보 보기`}>
                    <LuBookUser size={16} color="#3498db" />
                </button>
            </Tippy>
            {/* 3. 상태 변경(퇴원 처리 등) 아이콘 */}
            <Tippy content="상태 변경" theme="custom-glass" placement="top">
                <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onToggleStatusEditor(studentId); }}
                    aria-label={`${studentName} 학생 상태 변경`}>
                    <LuCircleArrowOutDownRight size={16} color="#3498db" />
                </button>
            </Tippy>
        </div>
    );
};

export default StudentActionButtons;