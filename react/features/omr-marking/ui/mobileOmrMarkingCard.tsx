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

// [추가] 숫자와 보기 기호를 매핑하는 객체
const numberToSymbolMap: Record<number, string> = {
    1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤'
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
            // [수정] 객관식은 숫자 배열을 유지합니다.
            : [1, 2, 3, 4, 5] as const);

        const buttonExtraClass = problemType === 'OX' ? 'ox-button' : '';

        return answerOptions.map(opt => {
            // [수정] 숫자든 문자든, 상태 저장을 위한 최종 '값(value)'을 결정합니다.
            const answerValue = typeof opt === 'number' ? numberToSymbolMap[opt] : opt;
            const isActive = currentAnswers?.has(answerValue) ?? false;
            
            return (
                <button
                    key={opt}
                    type="button"
                    className={`omr-button number-button ${buttonExtraClass} ${isActive ? 'active' : ''}`}
                    // [수정] onMarkAnswer에 숫자(opt)가 아닌, 변환된 기호(answerValue)를 전달합니다.
                    onClick={() => onMarkAnswer(problemId, answerValue)}
                    aria-pressed={isActive}
                    aria-label={`정답 ${opt} 선택`}
                >
                    {/* 화면에는 여전히 숫자 또는 O,X가 표시됩니다. */}
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
            <div className="omr-row answer-row">
                {renderAnswerInput()}
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