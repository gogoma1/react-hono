// ./react/shared/ui/charts/SimpleBarChart.tsx

import React from 'react';
import './SimpleBarChart.css'; 

export interface BarChartItem {
    key: string;
    label: string;
    count: number;
    colorClass?: string; 
}

interface SimpleBarChartProps {
    data: BarChartItem[];
    maxValue?: number;
    showValue?: boolean;
    valueSuffix?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
    data, 
    maxValue,
    showValue = false,
    valueSuffix = ''
}) => {
    // 기준이 되는 최댓값을 결정합니다. (주어지지 않으면 데이터 중 최댓값)
    const max = maxValue ?? Math.max(...data.map(d => d.count), 1);

    return (
        // 이 컴포넌트의 부모(.CardContent)가 적절한 높이를 가지고 있어야 합니다.
        <div className="simple-bar-chart">
            {data.map(item => {
                // 실제 값(count)이 기준값(max)을 넘지 않도록 보정합니다.
                const cappedCount = Math.min(item.count, max);
                // 기준값 대비 실제 값의 비율로 높이를 계산합니다.
                const heightPercent = (cappedCount / max) * 100;
                
                return (
                    <div key={item.key} className="bar-item">
                        {/* showValue가 true일 때만 트랙 위에 값을 표시합니다. */}
                        {showValue && (
                            <span className="bar-value">
                                {Math.round(item.count)}{valueSuffix}
                            </span>
                        )}
                        <div className="bar-track">
                            <div 
                                className={`bar-fill ${item.colorClass || ''}`}
                                style={{ height: `${heightPercent}%` }}
                            />
                        </div>
                        <span className="bar-label">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default SimpleBarChart;