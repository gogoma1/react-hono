// ./react/pages/ExamReportPage.tsx

import React from 'react';
import { useParams, Link, useLocation } from 'react-router';
import { useExamReportQuery } from '../entities/exam-report/model/useExamReportQuery';
import type { FullExamReport } from '../entities/exam-report/model/types';
import { LuArrowLeft, LuCircleCheck, LuClock, LuTarget, LuFileText } from 'react-icons/lu';

// UI Components
import { Card } from '../shared/ui/card/Card';
import MetacognitionAnalysisCard from '../entities/exam-report/ui/MetacognitionAnalysisCard';
import DifficultyChart from '../entities/exam-report/ui/DifficultyAnalysisCard';
import TimeAnalysisCard from '../entities/exam-report/ui/TimeAnalysisCard';

// Widgets
import ExamReportProblemListWidget from '../widgets/exam-report/ui/ExamReportProblemListWidget';

// Styles
import './ExamReportPage.css';


const SummaryCard: React.FC<{ icon: React.ReactNode, value: string, label: string }> = ({ icon, value, label }) => (
    <Card className="summary-card">
        <div className="card-icon">{icon}</div>
        <div className="card-text">
            <span className="card-value">{value}</span>
            <span className="card-label">{label}</span>
        </div>
    </Card>
);

const ExamReportPageContent: React.FC<{ report: FullExamReport }> = ({ report }) => {
    const { summary, analytics, problem_results } = report;
    
    const formatTime = (seconds: number | null): string => {
        if (seconds === null) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}분 ${secs}초`;
        return `${secs}초`;
    };

    return (
        <div className="exam-report-page">
            <header className="report-header">
                <Link to="/mobile-exam" className="back-button">
                    <LuArrowLeft /> 목록으로
                </Link>
                <h1>{summary.exam_title} 결과 리포트</h1>
                <p>{summary.student_name}님의 시험 분석 결과입니다.</p>
                <span className="completion-date">
                    제출일: {new Date(summary.completed_at).toLocaleString()}
                </span>
            </header>

            <section className="report-grid">
                <div className="grid-item-span-2">
                    <div className="summary-grid">
                        <SummaryCard icon={<LuTarget size={22} />} value={`${summary.correct_rate?.toFixed(1) ?? 'N/A'}%`} label="정답률" />
                        <SummaryCard icon={<LuCircleCheck size={22} />} value={`${problem_results.filter(r => r.is_correct).length} / ${problem_results.length}`} label="정답/총 문항" />
                        <SummaryCard icon={<LuFileText size={22} />} value={`${summary.attempted_problems} / ${summary.total_problems}`} label="응시 문항 수" />
                        <SummaryCard icon={<LuClock size={22} />} value={formatTime(summary.total_pure_time_seconds)} label="총 풀이 시간" />
                    </div>
                </div>

                <div className="grid-item">
                    <MetacognitionAnalysisCard metacognitionData={analytics.metacognition_summary} />
                </div>
                <div className="grid-item">
                    <DifficultyChart data={analytics.performance_by_difficulty} />
                </div>
                <div className="grid-item-span-2">
                    <TimeAnalysisCard data={analytics.time_per_problem} averageTime={analytics.average_time_per_problem} />
                </div>
            </section>
            
            <section className="report-problem-list">
                <ExamReportProblemListWidget problemResults={problem_results} />
            </section>
        </div>
    );
};

const ExamReportPage: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const location = useLocation();
    
    // 1. 시험 제출 직후 navigate state로 전달받은 데이터 우선 사용
    const passedReport = location.state?.reportData as FullExamReport | undefined;
    
    // 2. navigate state가 없으면 API를 통해 데이터 조회
    const { data: fetchedReport, isLoading, isError, error } = useExamReportQuery(
        // passedReport가 있으면 API 호출을 비활성화합니다.
        passedReport ? undefined : assignmentId
    );
    
    // passedReport가 있으면 즉시 렌더링
    if (passedReport) {
        return <ExamReportPageContent report={passedReport} />;
    }

    // API 호출 중일 때 로딩 상태 표시
    if (isLoading) {
        return <div className="report-page-status"><h2>리포트를 불러오는 중입니다...</h2></div>;
    }

    // API 호출 에러 발생 시 에러 메시지 표시
    if (isError) {
        return <div className="report-page-status error"><h2>오류</h2><p>{error.message}</p></div>;
    }

    // API 호출 후 데이터가 없을 경우
    if (!fetchedReport) {
        return <div className="report-page-status"><h2>리포트 정보 없음</h2><p>해당 시험에 대한 리포트를 찾을 수 없습니다.</p></div>;
    }

    // API를 통해 성공적으로 데이터를 받아왔을 경우 렌더링
    // (참고: API 응답의 analytics가 불완전할 경우를 대비한 보정 로직은 이전에 제거되었습니다.)
    return <ExamReportPageContent report={fetchedReport} />;
};

export default ExamReportPage;