// ./react/shared/ui/ratings/StarRating.tsx

import React from 'react';
import { LuStar } from 'react-icons/lu';

// 스타일시트는 이 컴포넌트와 함께 위치하도록 합니다.
import './StarRating.css';

interface StarRatingProps {
    score: number | null;
    maxScore?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ score, maxScore = 4 }) => {
    const validScore = score ?? 0;
    // 점수를 0과 최대 점수 사이로 제한하여 예기치 않은 값에 대응
    const clampedScore = Math.max(0, Math.min(maxScore, validScore));

    return (
        <div className="star-rating">
            <div className="star-icons-wrapper">
                {/* 배경이 되는 회색 별 */}
                <div className="star-background-layer">
                    {[...Array(maxScore)].map((_, i) => <LuStar key={`bg-${i}`} className="star" />)}
                </div>
                {/* 점수만큼 채워지는 노란 별 */}
                <div className="star-foreground-layer" style={{ width: `${(clampedScore / maxScore) * 100}%` }}>
                    <div className="star-foreground-inner">
                        {[...Array(maxScore)].map((_, i) => <LuStar key={`fg-${i}`} className="star star-filled" />)}
                    </div>
                </div>
            </div>
            <span className="score-text">{score?.toFixed(1) ?? 'N/A'} / {maxScore.toFixed(1)}</span>
        </div>
    );
};

export default StarRating;