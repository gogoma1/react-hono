// ./react/entities/exam-report/ui/TimeAnalysisCard.tsx

import React, { useMemo } from 'react';
import type { ReportAnalytics } from '../model/types';
import type { DotProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card/Card';
import LineChart from '../../../shared/ui/charts/LineChart';
import './TimeAnalysisCard.css';

// 1. 커스텀 Dot 컴포넌트 정의
const TimeAnalysisDot: React.FC<DotProps & { payload?: { is_correct?: boolean | null } }> = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
  
    if (payload.is_correct === false) {
      return <circle cx={cx} cy={cy} r={5} stroke="#c0392b" strokeWidth={2} fill="#fff" />;
    }
  
    return <circle cx={cx} cy={cy} r={4} fill="#2c3e50" />;
};

// 2. 커스텀 툴팁 컴포넌트 정의
const TimeAnalysisTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-chart-tooltip">
                <p className="tooltip-label">{`문제: ${label}`}</p>
                <p className="tooltip-intro">{`소요 시간: ${payload[0].value}초`}</p>
                <p className={`tooltip-desc ${payload[0].payload.is_correct ? 'correct' : 'incorrect'}`}>
                    {payload[0].payload.is_correct ? '정답' : '오답'}
                </p>
            </div>
        );
    }
    return null;
};

// 3. 초를 "O분 O초" 형식으로 변환하는 헬퍼 함수
const formatSecondsToMinutes = (seconds: number | null): string => {
    if (seconds === null || seconds < 0) return '0초';
    const roundedSeconds = Math.round(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    if (mins > 0) return `${mins}분 ${secs}초`;
    return `${secs}초`;
};

// 4. X축 눈금에 "번"을 붙이는 포매터 함수
const formatXAxisTick = (tickItem: string | number): string => {
    if (tickItem === undefined || tickItem === null) return '';
    return `${tickItem}번`;
};

interface TimeAnalysisCardProps {
    data: ReportAnalytics['time_per_problem'];
    averageTime: number | null;
}

const TimeAnalysisCard: React.FC<TimeAnalysisCardProps> = ({ data, averageTime }) => {

    // Y축에 표시할 최소/최대 시간 값을 계산합니다.
    const yAxisTimeTicks = useMemo(() => {
        if (!data || data.length === 0) return [];
        const times = data.map(d => d.time_taken);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        if (minTime === maxTime) return [minTime];
        return [minTime, maxTime];
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    한 문제를 푸는 데 평균 {formatSecondsToMinutes(averageTime)} 걸렸어요
                </CardTitle>
            </CardHeader>
            <CardContent>
                <LineChart 
                    data={data}
                    xAxisKey="problem_number"
                    yAxisKey="time_taken"
                    yAxisUnit="초"
                    yAxisTicks={yAxisTimeTicks}
                    hideGrid={true}
                    CustomDotComponent={TimeAnalysisDot}
                    CustomTooltipComponent={TimeAnalysisTooltip}
                    height={300}
                    xAxisTickFormatter={formatXAxisTick}
                />
            </CardContent>
        </Card>
    );
};

export default TimeAnalysisCard;