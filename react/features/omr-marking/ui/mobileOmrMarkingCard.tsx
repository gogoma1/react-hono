// ----- ./react/features/omr-marking/ui/mobileOmrMarkingCard.tsx -----

import React from 'react';
import './mobileOmrMarkingCard.css';
import type { AnswerNumber } from '../index';
import type { ProblemType } from '../../../entities/problem/model/types';

export type MarkingStatus = 'A' | 'B' | 'C' | 'D';

interface OmrMarkingCardProps {
    problemId: string;
    problemType: ProblemType; 
    currentAnswers: Set<AnswerNumber> | null;
    currentStatus: MarkingStatus | null;
    onMarkAnswer: (problemId: string, answer: AnswerNumber) => void;
    onCommitAndProceed: (problemId: string, status?: MarkingStatus) => void;
    currentSubjectiveAnswer?: string;
    onMarkSubjectiveAnswer?: (problemId: string, answer: string) => void;
}

const statusLabels: Record<MarkingStatus, string> = {
    A: '보자마자 품',
    B: '고민하다 품',
    C: '모름',
    D: '고민 후 못 품'
};

const OmrMarkingCard: React.FC<OmrMarkingCardProps> = ({
    problemId,
    problemType,
    currentAnswers,
    currentStatus,
    onMarkAnswer,
    onCommitAndProceed,
    currentSubjectiveAnswer,
    onMarkSubjectiveAnswer,
}) => {
    const isSubjective = problemType === '서답형' || problemType === '논술형';
    const statusOptions: MarkingStatus[] = ['A', 'B', 'C', 'D'];

    const renderAnswerInput = () => {
        if (isSubjective) {
            return (
                <div className="subjective-answer-wrapper">
                    <input
                        type="text"
                        className="omr-subjective-input"
                        placeholder="서답형 정답 입력..."
                        value={currentSubjectiveAnswer || ''}
                        onChange={(e) => onMarkSubjectiveAnswer?.(problemId, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="서답형 정답 입력"
                    />
                </div>
            );
        }

        const answerOptions = (problemType === 'OX'
            ? ['O', 'X'] as const
            : [1, 2, 3, 4, 5] as const);

        const buttonExtraClass = problemType === 'OX' ? 'ox-button' : '';

        return answerOptions.map(opt => {
            const isActive = currentAnswers?.has(opt) ?? false;
            return (
                <button
                    key={opt}
                    type="button"
                    className={`omr-button number-button ${buttonExtraClass} ${isActive ? 'active' : ''}`}
                    onClick={() => onMarkAnswer(problemId, opt)}
                    aria-pressed={isActive}
                    aria-label={`정답 ${opt} 선택`}
                >
                    <span>{opt}</span>
                </button>
            );
        });
    };

    const handleStatusClick = (statusKey: MarkingStatus) => {
        onCommitAndProceed(problemId, statusKey);
    };

    return (
        <div className="omr-marking-card">
            {/* 1. 정답 입력 행: 문제 유형에 따라 동적으로 렌더링 */}
            <div className="omr-row answer-row">
                {renderAnswerInput()}
            </div>

            {/* 2. 상태 및 액션 버튼 행: 모든 문제 유형에 공통으로 표시 */}
            <div className="omr-row status-and-actions-row">
                <div className="status-buttons-group">
                    {statusOptions.map(statusKey => (
                         <button
                            key={statusKey}
                            type="button"
                            className={`omr-button status-button ${currentStatus === statusKey ? 'active' : ''}`}
                            onClick={() => handleStatusClick(statusKey)}
                            aria-pressed={currentStatus === statusKey}
                            aria-label={`${statusLabels[statusKey]} 선택`}
                        >
                            <span className="status-label-key">{statusKey}</span>
                            <span className="status-label-text">{statusLabels[statusKey]}</span>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="omr-button next-button"
                    onClick={() => onCommitAndProceed(problemId)}
                    aria-label="다음 문제로 넘기기"
                >
                    넘기기
                </button>
            </div>
        </div>
    );
};

export default OmrMarkingCard;