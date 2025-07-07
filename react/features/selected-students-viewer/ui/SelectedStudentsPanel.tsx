import React from 'react';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';
import { LuX, LuUsersRound } from 'react-icons/lu';
import Badge from '../../../shared/ui/Badge/Badge';
import './SelectedStudentsPanel.css';
// [핵심 수정 1] Student 타입을 명확히 임포트하여 status 속성을 사용합니다.
import type { Student } from '../../../entities/student/model/types';

interface SelectedStudentsPanelProps {
    hideTitle?: boolean;
    className?: string;
}

// [핵심 수정 2] status 값을 표시할 텍스트로 매핑하는 객체를 추가합니다.
const statusMap: Record<Student['status'], string> = {
    active: '재원',
    inactive: '휴원',
    resigned: '퇴원',
};

const SelectedStudentsPanel: React.FC<SelectedStudentsPanelProps> = ({
    hideTitle = false,
    className = '',
}) => {
    const { students: selectedStudents, setStudents } = useProblemSetStudentStore();

    const handleDeselect = (studentIdToDeselect: string) => {
        const newStudents = selectedStudents.filter(s => s.id !== studentIdToDeselect);
        setStudents(newStudents);
    };

    const panelClassName = `selected-students-panel ${className}`.trim();

    return (
        <div className={panelClassName}>
            {!hideTitle && (
                <h4 className="panel-title">선택된 학생 목록 ({selectedStudents.length})</h4>
            )}
            <div className="student-list-container">
                {selectedStudents.length === 0 ? (
                    <div className="status-text">선택된 학생이 없습니다.</div>
                ) : (
                    <ul className="student-list">
                        {selectedStudents.map(student => {
                            const studentName = student.details?.student_name || '이름 없음';
                            const studentGrade = student.details?.grade || '학년 미지정';
                            const schoolName = student.details?.school_name || '학교 정보 없음';

                            // [핵심 수정 3] status 값에 따라 적절한 CSS 클래스를 동적으로 할당합니다.
                            let statusClassName = 'status-default';
                            switch (student.status) {
                                case 'active': statusClassName = 'status-enroll'; break;
                                case 'inactive': statusClassName = 'status-pause'; break;
                                case 'resigned': statusClassName = 'status-leave'; break;
                            }

                            return (
                                <li key={student.id} className="student-list-item">
                                    <LuUsersRound className="student-icon" size={20} />
                                    <div className="student-info">
                                        <span className="student-name">{studentName}</span>
                                        <span className="student-details">{studentGrade} / {schoolName}</span>
                                    </div>
                                    {/* [핵심 수정 4] Badge 컴포넌트를 추가하여 학생의 상태를 표시합니다. */}
                                    <Badge className={statusClassName}>
                                        {statusMap[student.status] || student.status}
                                    </Badge>
                                    <button
                                        className="deselect-button"
                                        onClick={() => handleDeselect(student.id)}
                                        aria-label={`${studentName} 학생 선택 해제`}
                                    >
                                        <LuX size={16} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SelectedStudentsPanel;