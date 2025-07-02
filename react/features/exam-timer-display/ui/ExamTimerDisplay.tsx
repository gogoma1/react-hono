import React from 'react';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';
import { useMobileExamStore } from '../../mobile-exam-session/model/mobileExamStore';
import { useExamLayoutStore } from '../../problem-publishing';
import './ExamTimerDisplay.css';

const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) return '0초';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (minutes > 0) {
        return `${minutes}분 ${seconds}초`;
    }
    return `${seconds}초`;
};

// [추가] 날짜를 한국 표준시로 포맷하는 함수
const formatKST = (date: Date | null): string => {
    if (!date) return '기록 없음';
    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const ExamTimerDisplay: React.FC = () => {
    // [수정] store에서 새로운 상태들을 가져옵니다.
    const { 
        orderedProblems: problems, 
        problemTimes, 
        totalElapsedTime, 
        examStartTime, 
        examEndTime, 
        answerHistory,
        statuses 
    } = useMobileExamStore();
    const { useSequentialNumbering } = useExamLayoutStore();
    
    // [수정] 총 풀이 시간을 totalElapsedTime으로 변경
    const totalTime = totalElapsedTime;

    const renderHistoryItem = (item: AnswerNumber | MarkingStatus | string, index: number) => {
        // 스타일링을 위해 item 타입에 따라 클래스를 부여할 수 있습니다.
        let className = 'history-item';
        if (typeof item === 'number') className += ' number';
        if (typeof item === 'string' && ['A', 'B', 'C', 'D'].includes(item)) className += ` status-${item}`;

        return (
            <span key={index} className={className}>
                {item}
            </span>
        );
    };

    return (
        <div className="exam-timer-display-container">
            <div className="timer-display-header">
                <h4 className="timer-display-title">시험 정보 및 풀이 기록</h4>
            </div>

            {/* [추가] 시험 시작/종료 시간 표시 */}
            <div className="exam-session-times">
                <div className="session-time-item">
                    <span className="time-label">시작 시간</span>
                    <span className="time-value">{formatKST(examStartTime)}</span>
                </div>
                <div className="session-time-item">
                    <span className="time-label">종료 시간</span>
                    <span className="time-value">{examEndTime ? formatKST(examEndTime) : '진행 중'}</span>
                </div>
            </div>

            <ul className="timer-list">
                {problems.map((problem, index) => {
                    const problemNumber = useSequentialNumbering ? `${index + 1}` : problem.display_question_number;
                    const time = problemTimes.get(problem.uniqueId);
                    const history = answerHistory.get(problem.uniqueId) || [];
                    const finalStatus = statuses.get(problem.uniqueId);

                    return (
                        <li key={problem.uniqueId} className="timer-list-item extended">
                            <div className="problem-main-info">
                                <span className="problem-number-label">{problemNumber}번</span>
                                <span className="problem-time-value">
                                    {time !== undefined ? formatTime(time) : '풀이중'}
                                </span>
                            </div>
                            {/* [추가] 답변 기록 표시 */}
                            <div className="problem-answer-log">
                                <span className="log-label">최종:</span>
                                <span className={`log-value final-status status-${finalStatus}`}>{finalStatus || '미선택'}</span>
                            </div>
                            <div className="problem-answer-log">
                                <span className="log-label">기록:</span>
                                <div className="log-value history-trail">
                                    {history.length > 0 ? history.map(renderHistoryItem).reduce((prev, curr) => <>{prev} → {curr}</>) : '기록 없음'}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="timer-display-footer">
                <span className="total-time-label">총 경과 시간</span>
                <span className="total-time-value">{formatTime(totalTime)}</span>
            </div>
        </div>
    );
};

export default ExamTimerDisplay;