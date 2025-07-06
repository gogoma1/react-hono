import React from 'react';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';
import { LuX, LuUsersRound } from 'react-icons/lu';
import Badge from '../../../shared/ui/Badge/Badge';
import './SelectedStudentsPanel.css';
import type { Student } from '../../../entities/student/model/types'; 

interface SelectedStudentsPanelProps {
    // [수정] isLoading prop을 제거합니다.
    hideTitle?: boolean;
    className?: string;
}

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
                {/* [수정] 로딩 상태를 표시하는 로직을 제거합니다. 스토어에 데이터가 없으면 '선택된 학생 없음'이 표시됩니다. */}
                {selectedStudents.length === 0 ? (
                    <div className="status-text">선택된 학생이 없습니다.</div>
                ) : (
                    <ul className="student-list">
                        {selectedStudents.map(student => (
                            <li key={student.id} className="student-list-item">
                                <LuUsersRound className="student-icon" size={20} />
                                <div className="student-info">
                                    <span className="student-name">{student.student_name}</span>
                                    <span className="student-details">{student.grade} / {student.school_name || '학교 정보 없음'}</span>
                                </div>
                                <Badge className={`status-${student.status.toLowerCase()}`}>{student.status}</Badge>
                                <button
                                    className="deselect-button"
                                    onClick={() => handleDeselect(student.id)}
                                    aria-label={`${student.student_name} 학생 선택 해제`}
                                >
                                    <LuX size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SelectedStudentsPanel;