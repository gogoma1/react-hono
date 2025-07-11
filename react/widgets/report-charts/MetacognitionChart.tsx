import React from 'react';
import type { ReportAnalytics } from '../../entities/exam-report/model/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card/Card';
import { LuStar } from 'react-icons/lu';
import './ChartStyles.css';

interface MetacognitionChartProps {
    data: ReportAnalytics['metacognition_summary'];
}

const statusLabels: Record<'A' | 'B' | 'C' | 'D', string> = {
    A: '보자마자 품',
    B: '고민하다 품',
    D: '고민 후 못 품',
    C: '모름'
};

const StarRating: React.FC<{ score: number | null }> = ({ score }) => {
    const fullStars = score ? Math.floor(score) : 0;
    const halfStar = score ? (score - fullStars >= 0.5 ? 1 : 0) : 0;
    const emptyStars = 4 - fullStars - halfStar;
  
    return (
      <div className="star-rating">
        {[...Array(fullStars)].map((_, i) => <LuStar key={`full-${i}`} className="star full" />)}
        {halfStar === 1 && <LuStar key="half" className="star half" />}
        {[...Array(emptyStars)].map((_, i) => <LuStar key={`empty-${i}`} className="star empty" />)}
        <span className="score-text">{score?.toFixed(1) ?? 'N/A'} / 4.0</span>
      </div>
    );
};

const MetacognitionChart: React.FC<MetacognitionChartProps> = ({ data }) => {
    const maxCount = Math.max(...data.distribution.map(d => d.count), 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>체감 난이도 분석</CardTitle>
                <CardDescription>
                    <StarRating score={data.overall_score} />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="simple-bar-chart">
                    {data.distribution.map(({ status, count }) => (
                        <div key={status} className="bar-item">
                            <div className="bar-wrapper">
                                <div 
                                    className={`bar-fill status-${status}`}
                                    style={{ height: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="bar-label">{statusLabels[status]}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default MetacognitionChart;