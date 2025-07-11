import React, { useState } from 'react';
import type { ReportProblemResult } from '../model/types';
import MathpixRenderer from '../../../shared/ui/MathpixRenderer';
import MetacognitionBadge from './MetacognitionBadge';
import { LuChevronDown, LuTimer } from 'react-icons/lu';
import './ReportProblemItem.css';

interface ReportProblemItemProps {
    result: ReportProblemResult;
    index: number;
}

// [수정] 사용하지 않는 problemType 파라미터 제거
const formatSubmittedAnswer = (answer: string | string[] | null): string => {
    if (answer === null || answer === undefined) return '미제출';
    if (Array.isArray(answer)) return answer.join(', ');
    return answer;
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}분 ${secs}초`;
    return `${secs}초`;
};

const ReportProblemItem: React.FC<ReportProblemItemProps> = ({ result, index }) => {
    const [isSolutionVisible, setIsSolutionVisible] = useState(false);
    const { problem } = result;
    const isCorrectClass = result.is_correct === true ? 'correct' : result.is_correct === false ? 'incorrect' : 'not-scored';

    return (
        <li className={`report-problem-item ${isCorrectClass}`}>
            <div className="problem-item-header">
                <span className={`problem-number ${isCorrectClass}`}>
                    {index + 1}. ({problem.display_question_number})
                </span>
                <div className="problem-meta-tags">
                    {/* [수정] > 문자를 JSX 밖의 변수로 빼거나, 중괄호로 감싸서 해결 */}
                    <span className="chapter-tag">{`${problem.major_chapter_name} > ${problem.middle_chapter_name}`}</span>
                    <MetacognitionBadge status={result.meta_cognition_status} isCorrect={result.is_correct} />
                </div>
            </div>
            
            <div className="problem-item-body">
                <div className="mathpix-wrapper prose">
                    <MathpixRenderer text={problem.question_text ?? ''} />
                </div>
            </div>

            <div className="problem-item-footer">
                <div className="answer-comparison">
                     {/* [수정] formatSubmittedAnswer 호출 시 problemType 인자 제거 */}
                    <div><span className="label">내 답안:</span> <span className="answer user-answer">{formatSubmittedAnswer(result.submitted_answer)}</span></div>
                    <div><span className="label">정답:</span> <span className="answer correct-answer">{problem.answer}</span></div>
                </div>
                <div className="time-info">
                    <LuTimer size={14} />
                    <span>{formatTime(result.time_taken_seconds)}</span>
                </div>
            </div>

            {problem.solution_text && (
                 <div className="solution-area">
                    <button 
                        className="solution-toggle-button" 
                        onClick={() => setIsSolutionVisible(!isSolutionVisible)}
                        aria-expanded={isSolutionVisible}
                    >
                        <span>해설 보기</span>
                        <LuChevronDown className={`chevron-icon ${isSolutionVisible ? 'open' : ''}`} />
                    </button>
                    {isSolutionVisible && (
                        <div className="solution-content prose">
                            <MathpixRenderer text={problem.solution_text} />
                        </div>
                    )}
                </div>
            )}
        </li>
    );
};

export default ReportProblemItem;