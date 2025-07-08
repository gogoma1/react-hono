import React from 'react';
import type { ExamAssignmentWithSet } from '../../../entities/exam-assignment/api/examAssignmentApi';
import { LuFileClock, LuCalendar, LuChevronRight, LuInfo } from 'react-icons/lu';
import './AssignmentList.css';

// [핵심 수정] 각 상태에 대한 UI 정의 타입
type StatusDetail = {
    text: string;
    className: string;
};

// [핵심 수정] DbExamAssignment의 모든 status 타입을 문자열 리터럴로 정의
type AssignmentStatus = 'not_started' | 'assigned' | 'in_progress' | 'completed' | 'graded' | 'expired';

// [핵심 수정] statusDetails 객체를 모든 상태를 포함하도록 확장하고 Record 타입을 사용해 타입 안정성 확보
const statusDetails: Record<AssignmentStatus, StatusDetail> = {
    not_started: { text: '응시 전', className: 'not-started' },
    assigned: { text: '응시 전', className: 'not-started' }, // 'assigned'도 'not_started'와 동일하게 처리
    in_progress: { text: '응시 중', className: 'in-progress' },
    completed: { text: '완료', className: 'completed' },
    graded: { text: '채점 완료', className: 'graded' },
    expired: { text: '기간 만료', className: 'expired' },
};

interface AssignmentListProps {
    assignments: ExamAssignmentWithSet[];
    onSelectAssignment: (assignment: ExamAssignmentWithSet) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({ assignments, onSelectAssignment }) => {
    return (
        <div className="assignment-list-page">
            <header className="page-header">
                <h1>내 시험지 목록</h1>
                <p>응시할 시험지를 선택해주세요.</p>
            </header>
            <main className="page-content">
                <ul className="assignment-list">
                    {assignments.map(assignment => {
                        // [핵심 수정] status가 null이거나 정의되지 않은 경우를 대비해 기본값 설정
                        const status = (assignment.status as AssignmentStatus) || 'not_started';
                        // [핵심 수정] 정의되지 않은 status가 들어올 경우를 대비한 최종 안전장치
                        const detail = statusDetails[status] || statusDetails.not_started;
                        
                        return (
                            <li key={assignment.id}>
                                <button className="assignment-list-item" onClick={() => onSelectAssignment(assignment)}>
                                    <div className={`item-icon-wrapper ${detail.className}`}>
                                        <LuFileClock size={24}/>
                                    </div>
                                    <div className="item-info-wrapper">
                                        <p className="item-title">{assignment.examSet.title}</p>
                                        <div className="item-details">
                                            <span>
                                                <LuInfo size={14} />
                                                <span className={`status-text ${detail.className}`}>{detail.text}</span>
                                            </span>
                                            <span>
                                                <LuCalendar size={14} /> 
                                                할당일: {new Date(assignment.assigned_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="item-action-wrapper">
                                        <LuChevronRight size={20} />
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </main>
        </div>
    );
};