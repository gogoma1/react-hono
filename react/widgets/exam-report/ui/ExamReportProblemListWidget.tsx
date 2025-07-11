// 파일 경로는 이제 ./react/widgets/exam-report/ui/ExamReportProblemListWidget.tsx 입니다.
import React, { useState, useMemo } from 'react';
import type { ReportProblemResult } from '../../../entities/exam-report/model/types';
import ReportProblemItem from '../../../entities/exam-report/ui/ReportProblemItem';
import '../styles.css'; // [수정] 상대 경로 변경

interface ExamReportProblemListWidgetProps {
    problemResults: ReportProblemResult[];
}

type FilterType = 'all' | 'correct' | 'incorrect';

const ExamReportProblemListWidget: React.FC<ExamReportProblemListWidgetProps> = ({ problemResults }) => {
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredResults = useMemo(() => {
        if (filter === 'all') return problemResults;
        return problemResults.filter(r => {
            if (filter === 'correct') return r.is_correct === true;
            if (filter === 'incorrect') return r.is_correct === false;
            return true;
        });
    }, [problemResults, filter]);
    
    return (
        <div className="exam-report-problem-list-widget">
            <div className="problem-list-header">
                <h3>문제별 상세 분석</h3>
                <div className="filter-buttons">
                    <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>전체</button>
                    <button onClick={() => setFilter('correct')} className={filter === 'correct' ? 'active' : ''}>맞은 문제</button>
                    <button onClick={() => setFilter('incorrect')} className={filter === 'incorrect' ? 'active' : ''}>틀린 문제</button>
                </div>
            </div>
            {filteredResults.length > 0 ? (
                <ul className="problem-list-ul">
                    {filteredResults.map((result, index) => (
                        <ReportProblemItem key={result.problem_id} result={result} index={index} />
                    ))}
                </ul>
            ) : (
                <div className="no-results-message">
                    <p>해당하는 문제가 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default ExamReportProblemListWidget;