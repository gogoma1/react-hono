import React, { useMemo } from 'react';
import { useStudentDataWithRQ } from '../../../entities/student/model/useStudentDataWithRQ';
import { useProblemPublishingSelectionStore } from '../../problem-publishing/model/problemPublishingSelectionStore';
import { LuX, LuUsersRound } from 'react-icons/lu';
import Badge from '../../../shared/ui/Badge/Badge';
import './SelectedStudentsPanel.css';

const SelectedStudentsPanel: React.FC = () => {
    const { students: allStudents, isLoadingStudents } = useStudentDataWithRQ();
    const { selectedProblemIds: selectedStudentIds, toggleProblem: toggleStudentSelection } = useProblemPublishingSelectionStore();

    const selectedStudents = useMemo(() => {
        if (!allStudents || allStudents.length === 0) return [];
        return allStudents.filter(student => selectedStudentIds.has(student.id));
    }, [allStudents, selectedStudentIds]);

    const handleDeselect = (studentId: string) => {
        // 이 스토어는 문제 ID를 다루므로, 학생 ID를 문제 ID처럼 토글합니다.
        toggleStudentSelection(studentId);
    };

    return (
        <div className="selected-students-panel">
            <h4 className="panel-title">선택된 학생 목록 ({selectedStudents.length})</h4>
            <div className="student-list-container">
                {isLoadingStudents ? (
                    <div className="status-text">학생 목록 로딩 중...</div>
                ) : selectedStudents.length === 0 ? (
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