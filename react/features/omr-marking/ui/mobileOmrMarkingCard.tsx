// ----- ./react/features/omr-marking/ui/mobileOmrMarkingCard.tsx -----

import React from 'react';
import './mobileOmrMarkingCard.css';
// [수정] ProblemType을 import 합니다.
import type { ProblemType } from '../../../entities/problem/model/types';

export type MarkingStatus = 'A' | 'B' | 'C' | 'D';
export type AnswerNumber = 1 | 2 | 3 | 4 | 5 | 'O' | 'X'; // [수정] O, X를 AnswerNumber 타입에 추가

interface OmrMarkingCardProps {
    problemId: string;
    // [신규] 문제 유형을 직접 받아 UI를 결정합니다.
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
    problemType, // [수정] prop 받기
    currentAnswers,
    currentStatus,
    onMarkAnswer,
    onCommitAndProceed,
    currentSubjectiveAnswer,
    onMarkSubjectiveAnswer,
}) => {
    // [수정] isSubjective 대신 problemType으로 분기합니다.
    const isSubjective = problemType === '서답형' || problemType === '논술형';

    const renderAnswerButtons = () => {
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

        // [신규] problemType에 따라 선택지 버튼을 다르게 렌더링합니다.
        let answerOptions: AnswerNumber[];
        if (problemType === 'OX') {
            answerOptions = ['O', 'X'];
        } else { // '객관식'
            answerOptions = [1, 2, 3, 4, 5];
        }

        return answerOptions.map(opt => {
            const isActive = currentAnswers?.has(opt) ?? false;
            return (
                <button
                    key={opt}
                    type="button"
                    className={`omr-button number-button ${problemType === 'OX' ? 'ox-button' : ''} ${isActive ? 'active' : ''}`}
                    onClick={() => onMarkAnswer(problemId, opt)}
                    aria-pressed={isActive}
                    aria-label={`정답 ${opt}번 선택`}
                >
                    <span>{opt}</span>
                </button>
            )
        });
    };

    const statusOptions: MarkingStatus[] = ['A', 'B', 'C', 'D'];

    const handleStatusClick = (statusKey: MarkingStatus) => {
        onCommitAndProceed(problemId, statusKey);
    };

    return (
        <div className="omr-marking-card">
            <div className="omr-row answer-row">
                {renderAnswerButtons()}
            </div>

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