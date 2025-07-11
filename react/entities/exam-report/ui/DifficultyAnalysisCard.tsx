// ./react/entities/exam-report/ui/DifficultyAnalysisCard.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card/Card';
import SimpleBarChart, { type BarChartItem } from '../../../shared/ui/charts/SimpleBarChart';
import './DifficultyAnalysisCard.css';

interface DifficultyData {
    difficulty: string;
    correct_rate: number;
}

interface DifficultyAnalysisCardProps {
    data: DifficultyData[];
}

const DifficultyAnalysisCard: React.FC<DifficultyAnalysisCardProps> = ({ data }) => {
    
    const barChartData = useMemo((): BarChartItem[] => {
        if (!data) return [];
        return data.map(item => ({
            key: item.difficulty,
            label: item.difficulty,
            count: item.correct_rate,
            colorClass: 'difficulty-bar-color',
        }));
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>난이도별 성취도</CardTitle>
                <CardDescription>
                    실제 문제 난이도에 따른 정답률입니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* 
                  1. maxValue=100: 정답률이므로 최댓값은 100입니다.
                  2. showValue=true: 트랙 위에 숫자를 표시합니다.
                  3. valueSuffix="%": 숫자 뒤에 '%' 단위를 붙입니다.
                */}
                <SimpleBarChart 
                    data={barChartData} 
                    maxValue={100} 
                    showValue={true} 
                    valueSuffix="%" 
                />
            </CardContent>
        </Card>
    );
};

export default DifficultyAnalysisCard;