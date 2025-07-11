import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts'; // Legend 추가
import type { ReportAnalytics } from '../../entities/exam-report/model/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../shared/ui/card/Card';
import './ChartStyles.css';

interface DifficultyChartProps {
    data: ReportAnalytics['performance_by_difficulty'];
}

// [수정] LabelList의 formatter 타입을 명시적으로 맞춰줍니다.
const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    const radius = 10;
  
    // 값이 0이거나 너무 작으면 라벨을 렌더링하지 않아 차트가 깨끗하게 보입니다.
    if (value < 5) return null;
  
    return (
      <text x={x + width + 5} y={y + radius + 3} fill="#576574" textAnchor="start" dominantBaseline="middle">
        {`${value.toFixed(0)}%`}
      </text>
    );
};

const DifficultyChart: React.FC<DifficultyChartProps> = ({ data }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>난이도별 성취도</CardTitle>
                <CardDescription>
                    실제 문제 난이도에 따른 정답률입니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                        data={data} 
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }} // 여백 조정
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} tick={{ fill: '#95a5a6' }} tickFormatter={(tick) => `${tick}%`} />
                        <YAxis type="category" dataKey="difficulty" tickLine={false} axisLine={false} width={50} tick={{ fill: '#2c3e50', fontWeight: 500 }} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                            contentStyle={{ 
                                backgroundColor: 'rgba(44, 62, 80, 0.9)', 
                                borderRadius: '6px', 
                                border: 'none',
                                color: 'white'
                            }}
                            labelStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, '정답률']} 
                        />
                        <Bar dataKey="correct_rate" fill="#2c3e50" barSize={25} radius={[0, 4, 4, 0]}>
                            {/* [수정] formatter 대신 content prop에 커스텀 렌더링 함수를 전달합니다. */}
                            <LabelList dataKey="correct_rate" position="right" content={renderCustomizedLabel} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default DifficultyChart;