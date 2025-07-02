import React from 'react';
import './OmrMarkingCard.css';

export type MarkingStatus = 'A' | 'B' | 'C' | 'D';
export type AnswerNumber = 1 | 2 | 3 | 4 | 5;

interface OmrMarkingCardProps {
    problemId: string;
    currentAnswers: Set<AnswerNumber> | null;
    currentStatus: MarkingStatus | null;
    onMarkAnswer: (problemId: string, answer: AnswerNumber) => void;
    // [수정] onMarkStatus가 onMarkAnswer와 동일한 로직을 타도록 통합합니다.
    onMarkStatus: (problemId: string, status: MarkingStatus) => void;
    onNextClick: (problemId: string) => void;
    isSubjective?: boolean;
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
    currentAnswers,
    currentStatus,
    onMarkAnswer,
    onMarkStatus,
    onNextClick,
    isSubjective,
    currentSubjectiveAnswer,
    onMarkSubjectiveAnswer,
}) => {
    const answerOptions: AnswerNumber[] = [1, 2, 3, 4, 5];
    const statusOptions: MarkingStatus[] = ['A', 'B', 'C', 'D'];

    // [추가] 'C'를 눌렀을 때의 특별한 동작을 위해 onMarkStatus를 직접 호출합니다.
    const handleStatusClick = (statusKey: MarkingStatus) => {
        onMarkStatus(problemId, statusKey);
    };

    return (
        <div className="omr-marking-card">
            <div className="omr-row answer-row">
                {isSubjective ? (
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
                ) : (
                    answerOptions.map(num => {
                        const isActive = currentAnswers?.has(num) ?? false;
                        return (
                            <button
                                key={num}
                                type="button"
                                className={`omr-button number-button ${isActive ? 'active' : ''}`}
                                onClick={() => onMarkAnswer(problemId, num)}
                                aria-pressed={isActive}
                                aria-label={`정답 ${num}번 선택`}
                            >
                                <span>{num}</span>
                            </button>
                        )
                    })
                )}
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
                    onClick={() => onNextClick(problemId)}
                    aria-label="다음 문제로 넘기기"
                >
                    넘기기
                </button>
            </div>
        </div>
    );
};

export default OmrMarkingCard;