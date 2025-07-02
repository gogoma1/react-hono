import React, { useEffect } from 'react'; // [수정] useEffect 임포트
import type { ProcessedProblem } from '../../problem-publishing';
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

const ExamTimerDisplay: React.FC = () => {
    const { orderedProblems: problems, problemTimes } = useMobileExamStore();
    const { useSequentialNumbering } = useExamLayoutStore();
    
    const totalTime = Array.from(problemTimes.values()).reduce((acc, time) => acc + time, 0);

    // [핵심 로그] 사이드바 컴포넌트가 렌더링될 때, 스토어로부터 받은 problemTimes 상태를 로깅합니다.
    useEffect(() => {
        console.groupCollapsed(`[ExamTimerDisplay] 📊 사이드바 데이터 업데이트`);
        console.log("전달받은 'problemTimes' Map 객체:", problemTimes);
        console.groupEnd();
    }, [problemTimes]);


    return (
        <div className="exam-timer-display-container">
            <div className="timer-display-header">
                <h4 className="timer-display-title">문제별 풀이 시간</h4>
            </div>
            <ul className="timer-list">
                {problems.map((problem, index) => {
                    const problemNumber = useSequentialNumbering ? `${index + 1}` : problem.display_question_number;
                    const time = problemTimes.get(problem.uniqueId);

                    return (
                        <li key={problem.uniqueId} className="timer-list-item">
                            <span className="problem-number-label">{problemNumber}번</span>
                            <span className="problem-time-value">
                                {time !== undefined ? formatTime(time) : '풀이중'}
                            </span>
                        </li>
                    );
                })}
            </ul>
            <div className="timer-display-footer">
                <span className="total-time-label">총 풀이 시간</span>
                <span className="total-time-value">{formatTime(totalTime)}</span>
            </div>
        </div>
    );
};

export default ExamTimerDisplay;