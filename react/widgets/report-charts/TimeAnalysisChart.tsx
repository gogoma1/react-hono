import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, DotProps } from 'recharts';
import type { ReportAnalytics } from '../../entities/exam-report/model/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card/Card';
import './ChartStyles.css';

interface TimeAnalysisChartProps {
    data: ReportAnalytics['time_per_problem'];
    averageTime: number | null;
}

// [수정] props에서 key를 명시적으로 분리합니다.
const CustomizedDot: React.FC<DotProps & { is_correct?: boolean | null }> = (props) => {
    // 1. props 객체에서 `key`를 분리합니다.
    // 2. 나머지 필요한 props(cx, cy, is_correct)도 분리합니다.
    // 3. 사용하지 않는 나머지 props는 `...rest`로 받아서 무시합니다.
    const { cx, cy, is_correct, key, ...rest } = props;
  
    if (is_correct === false) {
      return <circle cx={cx} cy={cy} r={5} stroke="#c0392b" strokeWidth={2} fill="#fff" />;
    }
  
    return <circle cx={cx} cy={cy} r={4} fill="#2c3e50" />;
};
  
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
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

const TimeAnalysisChart: React.FC<TimeAnalysisChartProps> = ({ data, averageTime }) => {
    const tickIndices = useMemo(() => {
        if (data.length <= 1) return [0];
        const start = 0;
        const middle = Math.floor(data.length / 2);
        const end = data.length - 1;
        return Array.from(new Set([start, middle, end]));
    }, [data.length]);
    
    const chartData = useMemo(() => data.map(d => ({ ...d, problem_number: d.problem_number })), [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>문제별 소요 시간</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                            dataKey="problem_number" 
                            tickLine={false} 
                            axisLine={false}
                            ticks={tickIndices.map(i => chartData[i]?.problem_number)}
                        />
                        <YAxis tickLine={false} axisLine={false} unit="초" />
                        <Tooltip content={<CustomTooltip />} />
                        {averageTime && (
                            <ReferenceLine y={averageTime} label={{ value: `평균 ${averageTime.toFixed(0)}초`, position: 'insideTopRight', fill: '#95a5a6' }} stroke="#95a5a6" strokeDasharray="4 4" />
                        )}
                        <Line
                            type="monotone"
                            dataKey="time_taken"
                            stroke="#2c3e50"
                            strokeWidth={2}
                            // [수정] dot prop에 전달하는 함수는 그대로 둡니다.
                            // CustomizedDot 컴포넌트 내부에서 key를 처리하므로 이 부분은 수정할 필요 없습니다.
                            dot={(dotProps) => <CustomizedDot {...dotProps} is_correct={dotProps.payload.is_correct} />}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default TimeAnalysisChart;