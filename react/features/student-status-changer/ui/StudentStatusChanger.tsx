// ./react/features/student-status-changer/ui/StudentStatusChanger.tsx

import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../../../entities/student/model/types';
import './StudentStatusChanger.css';
import { LuUndo2 } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

type StatusValue = Student['status'];

interface StudentStatusChangerProps {
    studentId: string;
    onStatusSelect: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
}

const StudentStatusChanger: React.FC<StudentStatusChangerProps> = ({ studentId, onStatusSelect, onCancel }) => {
    const statuses: { label: string, value: StatusValue, className: string }[] = [
        { label: '재원', value: 'active', className: 'status-enroll' },
        { label: '휴원', value: 'inactive', className: 'status-pause' },
        { label: '퇴원', value: 'resigned', className: 'status-leave' },
    ];
    // '삭제'는 위험한 액션이므로 별도 버튼으로 분리하거나 다른 방식으로 처리하는 것이 좋습니다.
    // 여기서는 기존 구조를 유지하되, label과 value를 명확히 구분합니다.

    return (
        <div className="status-changer-container">
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