import React from 'react';
import { useNavigate } from 'react-router';
import { useMyPublishedExamSetsQuery } from '../entities/exam-set/model/useExamSetMutations';
import { LuFileClock, LuUsers, LuCalendar, LuLoader, LuCircleAlert, LuChevronRight } from 'react-icons/lu';
import './PublishedExamsPage.css';

const PublishedExamsPage = () => {
    const navigate = useNavigate();
    const { data: examSets, isLoading, isError, error } = useMyPublishedExamSetsQuery();

    const handleExamClick = (examSetId: string, problemIds: string[]) => {
        const problemIdsQuery = problemIds.join(',');
        // [핵심 수정] /mobile-exam 경로로 이동하되, 선생님 체험 모드임을 알리는 쿼리 파라미터를 추가
        navigate(`/mobile-exam?examSetId=${examSetId}&problemIds=${problemIdsQuery}&mode=teacher-preview`);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="status-container">
                    <LuLoader className="spinner-icon" />
                    <p>목록을 불러오는 중...</p>
                </div>
            );
        }

        if (isError) {
            return (
                <div className="status-container error">
                    <LuCircleAlert />
                    <p>오류: {error.message}</p>
                </div>
            );
        }

        if (!examSets || examSets.length === 0) {
            return (
                <div className="status-container">
                    <p>아직 출제된 모바일 시험지가 없습니다.</p>
                </div>
            );
        }
        
        return (
            <ul className="exam-list">
                {examSets.map(set => (
                    <li key={set.id}>
                        <button className="exam-list-item" onClick={() => handleExamClick(set.id, set.problem_ids)}>
                            <div className="item-icon-wrapper">
                                <LuFileClock size={24}/>
                            </div>
                            <div className="item-info-wrapper">
                                <p className="item-title">{set.title}</p>
                                <div className="item-details">
                                    <span>
                                        <LuUsers size={14} /> {set.assigned_student_count}명에게 할당
                                    </span>
                                    <span>
                                        <LuCalendar size={14} /> 출제일: {new Date(set.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="item-action-wrapper">
                                <LuChevronRight size={20} />
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="published-exams-page">
            <header className="page-header">
                <h1>출제된 모바일 시험지 목록</h1>
                <p>지금까지 출제한 모바일 시험지들을 확인하고 미리볼 수 있습니다.</p>
            </header>
            <main className="page-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default PublishedExamsPage;