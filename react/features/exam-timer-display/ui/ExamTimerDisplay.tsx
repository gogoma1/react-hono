// ./react/features/exam-timer-display/ui/ExamTimerDisplay.tsx
import React from 'react';
import type { AnswerNumber, MarkingStatus } from '../../omr-marking';
import { useMobileExamSessionStore } from '../../mobile-exam-session/model/mobileExamSessionStore';
import { useMobileExamTimeStore } from '../../mobile-exam-session/model/mobileExamTimeStore';
// ✨ [핵심 수정 1] `modifiedProblemIds`를 `mobileExamAnswerStore`에서 가져오도록 import 경로를 변경합니다.
import { useMobileExamAnswerStore } from '../../mobile-exam-session/model/mobileExamAnswerStore';
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

const numberToCircle = (num: AnswerNumber): string => {
    return `①②③④⑤`[num - 1] || String(num);
};

const ExamTimerDisplay: React.FC = () => {
    const { orderedProblems: problems } = useMobileExamSessionStore();
    // ✨ [핵심 수정 2] time 스토어 대신 answer 스토어에서 `modifiedProblemIds`를 포함한 상태를 가져옵니다.
    const { answerHistory, statuses, answers, subjectiveAnswers, modifiedProblemIds } = useMobileExamAnswerStore();
    const { problemTimes, totalElapsedTime, examStartTime, examEndTime } = useMobileExamTimeStore();
    const { useSequentialNumbering } = useExamLayoutStore();
    
    const totalTime = totalElapsedTime;

    const renderHistoryItem = (item: AnswerNumber | MarkingStatus | string, index: number) => {
        let className = 'history-item';
        if (typeof item === 'number') className += ' number';
        if (typeof item === 'string' && ['A', 'B', 'C', 'D'].includes(item)) className += ` status-${item}`;

        return (
            <span key={index} className={className}>
                {typeof item === 'number' ? numberToCircle(item) : item}
            </span>
        );
    };

    const formatFinalResult = (problemId: string, problemType: string): React.ReactNode => {
        const finalStatus = statuses.get(problemId);
        let finalAnswerDisplay = '미선택';
        let hasAnswer = false;

        if (problemType === '서답형') {
            const subjectiveAnswer = subjectiveAnswers.get(problemId);
            if (subjectiveAnswer && subjectiveAnswer.trim() !== '') {
                finalAnswerDisplay = subjectiveAnswer;
                hasAnswer = true;
            }
        } else {
            const answerSet = answers.get(problemId);
            if (answerSet && answerSet.size > 0) {
                const sortedAnswers = [...answerSet].sort((a, b) => a - b);
                finalAnswerDisplay = `(${sortedAnswers.map(numberToCircle).join(', ')})`;
                hasAnswer = true;
            }
        }
        
        if (!finalStatus && !hasAnswer) {
            return <span className="log-value final-status">미선택</span>;
        }

        return (
            <>
                {hasAnswer && <span className="log-value final-answer">{finalAnswerDisplay}</span>}
                {finalStatus && (
                    <span className={`log-value final-status status-${finalStatus}`}>
                        {hasAnswer ? `, ${finalStatus}` : finalStatus}
                    </span>
                )}
            </>
        );
    };


    return (
        <div className="exam-timer-display-container">
            <div className="timer-display-header">
                <h4 className="timer-display-title">시험 정보 및 풀이 기록</h4>
            </div>

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
                    // ✨ [핵심 수정 3] 이 `isModified` 값은 이제 `mobileExamAnswerStore`의 상태를 따르므로, 정확하게 동작합니다.
                    const isModified = modifiedProblemIds.has(problem.uniqueId);

                    return (
                        <li key={problem.uniqueId} className="timer-list-item extended">
                            <div className="problem-main-info">
                                <span className="problem-number-label">{problemNumber}번</span>
                                <div className="problem-time-info">
                                    <span className="problem-time-value">
                                        {time !== undefined ? formatTime(time) : '풀이중'}
                                    </span>
                                    {isModified && (
                                        <span className="problem-modified-label">정답 변경</span>
                                    )}
                                </div>
                            </div>
                            <div className="problem-answer-log">
                                <span className="log-label">최종:</span>
                                <div className="log-value-container">
                                    {formatFinalResult(problem.uniqueId, problem.problem_type)}
                                </div>
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