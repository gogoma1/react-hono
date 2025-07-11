// ./react/entities/exam-report/ui/MetacognitionAnalysisCard.tsx

import React, { useMemo } from 'react';
import type { ReportAnalytics } from '../model/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card/Card';

// 범용 컴포넌트 임포트
import StarRating from '../../../shared/ui/ratings/StarRating';
import SimpleBarChart, { type BarChartItem } from '../../../shared/ui/charts/SimpleBarChart';

// 이 카드에서만 사용하는 스타일 정의
import './MetacognitionAnalysisCard.css';

interface MetacognitionAnalysisCardProps {
    metacognitionData: ReportAnalytics['metacognition_summary'];
}

// 메타인지 데이터와 범용 BarChart 데이터를 매핑하기 위한 설정
const STATUS_CONFIG: { key: 'A' | 'B' | 'C' | 'D'; label: string; colorClass: string }[] = [
    { key: 'A', label: '보자마자 품', colorClass: 'status-A' },
    { key: 'B', label: '고민하다 품', colorClass: 'status-B' },
    { key: 'C', label: '모름', colorClass: 'status-C' },
    { key: 'D', label: '고민 후 못 품', colorClass: 'status-D' },
];

const MetacognitionAnalysisCard: React.FC<MetacognitionAnalysisCardProps> = ({ metacognitionData }) => {
    
    // 메타인지 데이터를 범용 SimpleBarChart가 이해할 수 있는 형태로 변환합니다.
    const barChartData = useMemo((): BarChartItem[] => {
        const distributionMap = new Map(
            metacognitionData?.distribution?.map(d => [d.status, d.count]) ?? []
        );

        return STATUS_CONFIG.map(config => ({
            key: config.key,
            label: config.label,
            count: distributionMap.get(config.key) || 0,
            colorClass: config.colorClass,
        }));

    }, [metacognitionData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>체감 난이도 분석</CardTitle>
                <CardDescription>
                    <StarRating score={metacognitionData?.overall_score} />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SimpleBarChart data={barChartData} />
            </CardContent>
        </Card>
    );
};

export default MetacognitionAnalysisCard;