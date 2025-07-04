import React, { useMemo } from 'react';
import { useStudentDataWithRQ } from '../../../entities/student/model/useStudentDataWithRQ';
import { useProblemSetStudentStore } from '../../../shared/store/problemSetStudentStore';
import { LuX, LuUsersRound } from 'react-icons/lu';
import Badge from '../../../shared/ui/Badge/Badge';
import './SelectedStudentsPanel.css';

// [핵심] 재사용성을 위해 Props 인터페이스를 정의합니다.
interface SelectedStudentsPanelProps {
    /** true일 경우, 컴포넌트의 h4 타이틀을 숨깁니다. */
    hideTitle?: boolean;
    /** 추가적인 CSS 클래스를 적용할 수 있습니다. */
    className?: string;
}

const SelectedStudentsPanel: React.FC<SelectedStudentsPanelProps> = ({
    hideTitle = false,
    className = '',
}) => {
    // 전체 학생 목록을 가져옵니다.
    const { students: allStudents, isLoadingStudents } = useStudentDataWithRQ();
    // '문제 출제'를 위해 선택된 학생 ID 목록과 상태 변경 함수를 가져옵니다.
    const { studentIds: selectedStudentIds, setStudentIds } = useProblemSetStudentStore();

    // 선택된 학생 ID를 기반으로 실제 학생 객체 목록을 필터링합니다.
    const selectedStudents = useMemo(() => {
        if (!allStudents || allStudents.length === 0) return [];
        const idSet = new Set(selectedStudentIds);
        return allStudents.filter(student => idSet.has(student.id));
    }, [allStudents, selectedStudentIds]);

    // 목록에서 학생을 제거하는 핸들러입니다.
    const handleDeselect = (studentIdToDeselect: string) => {
        const newStudentIds = selectedStudentIds.filter(id => id !== studentIdToDeselect);
        setStudentIds(newStudentIds);
    };

    // props로 받은 className을 적용합니다.
    const panelClassName = `selected-students-panel ${className}`.trim();

    return (
        <div className={panelClassName}>
            {/* hideTitle prop이 false일 때만 제목을 렌더링합니다. (기본값) */}
            {!hideTitle && (
                <h4 className="panel-title">선택된 학생 목록 ({selectedStudents.length})</h4>
            )}
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