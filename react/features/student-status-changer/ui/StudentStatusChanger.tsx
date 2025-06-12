import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../../../entities/student/model/useStudentDataWithRQ';
import './StudentStatusChanger.css';
// [추가] 뒤로가기 아이콘과 툴팁을 import 합니다.
import { LuUndo2 } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

type StatusValue = Student['status'];

interface StudentStatusChangerProps {
    studentId: string;
    onStatusSelect: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void; // [추가] 취소 함수를 위한 prop
}

const StudentStatusChanger: React.FC<StudentStatusChangerProps> = ({ studentId, onStatusSelect, onCancel }) => {
    const statuses: { label: string, value: StatusValue | 'delete', className: string }[] = [
        { label: '재원', value: '재원', className: 'status-enroll' },
        { label: '휴원', value: '휴원', className: 'status-pause' },
        { label: '퇴원', value: '퇴원', className: 'status-leave' },
        { label: '삭제', value: 'delete', className: 'status-delete' },
    ];

    return (
        <div className="status-changer-container">
            {/* [추가] 뒤로가기(취소) 아이콘 버튼 */}
            <Tippy content="취소" theme="custom-glass" placement="top">
                <button
                    type="button"
                    className="action-icon-button cancel-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    aria-label="상태 변경 취소"
                >
                    <LuUndo2 size={16} />
                </button>
            </Tippy>

            {/* 기존 Badge 그룹 */}
            {statuses.map(({ label, value, className }) => (
                <Badge
                    key={value}
                    className={`clickable-badge ${className}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusSelect(studentId, value);
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {label}
                </Badge>
            ))}
        </div>
    );
};

export default StudentStatusChanger;