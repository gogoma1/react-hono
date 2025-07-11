// ./react/shared/ui/charts/LineChart.tsx

import React, { useMemo } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DotProps } from 'recharts';

type ChartData = Record<string, any>;

interface LineChartProps {
    data: ChartData[];
    xAxisKey: string;
    yAxisKey: string;
    yAxisUnit?: string;
    yAxisTicks?: (string | number)[];
    hideGrid?: boolean;
    CustomDotComponent?: React.FC<DotProps & any>;
    CustomTooltipComponent?: React.FC<any>;
    height?: number;
    xAxisTickFormatter?: (value: any) => string;
}

const LineChart: React.FC<LineChartProps> = ({
    data,
    xAxisKey,
    yAxisKey,
    yAxisUnit,
    yAxisTicks,
    hideGrid = false,
    CustomDotComponent,
    CustomTooltipComponent,
    height = 300,
    xAxisTickFormatter,
}) => {
    // x축에 표시할 눈금(tick)을 동적으로 계산합니다. (시작, 중간, 끝)
    const tickIndices = useMemo(() => {
        if (data.length <= 1) return data.length > 0 ? [0] : [];
        const start = 0;
        const middle = Math.floor(data.length / 2);
        const end = data.length - 1;
        return Array.from(new Set([start, middle, end]));
    }, [data.length]);

    const chartData = useMemo(() => data.map(d => ({ ...d })), [data]);

    // Y축 domain을 동적으로 계산하여 그래프의 진폭을 키웁니다.
    const yAxisDomain = useMemo(() => {
        if (!data || data.length === 0) {
            return [0, 10]; // 데이터가 없을 경우 기본 도메인
        }
        const values = data.map(d => d[yAxisKey]);
        const dataMin = Math.min(...values);
        const dataMax = Math.max(...values);
        
        const range = dataMax - dataMin;
        
        // 상하 여백을 줌 (전체 범위의 10% 정도)
        const padding = range * 0.1;

        // 만약 모든 값이 같다면(range=0), 0과 값의 2배로 범위를 설정
        if (range === 0) {
            return [0, dataMax * 2 || 10];
        }

        return [
            Math.max(0, dataMin - padding), // 0 이하로는 내려가지 않게
            dataMax + padding
        ];
    }, [data, yAxisKey]);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                {!hideGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
                
                <XAxis 
                    dataKey={xAxisKey} 
                    tickLine={false} 
                    axisLine={false}
                    ticks={tickIndices.map(i => chartData[i]?.[xAxisKey])}
                    tickFormatter={xAxisTickFormatter}
                />
                
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={yAxisDomain}
                    ticks={yAxisTicks}
                    unit={yAxisUnit}
                    tick={{ fill: '#95a5a6', fontSize: 12 }}
                />
                
                <Tooltip content={CustomTooltipComponent ? <CustomTooltipComponent /> : undefined} />
                
                <Line
                    type="monotone"
                    dataKey={yAxisKey}
                    stroke="#2c3e50"
                    strokeWidth={2}
                    dot={CustomDotComponent ? (props) => <CustomDotComponent {...props} /> : true}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                />
            </RechartsLineChart>
        </ResponsiveContainer>
    );
};

export default LineChart;