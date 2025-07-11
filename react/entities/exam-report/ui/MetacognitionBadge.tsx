import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import './MetacognitionBadge.css';

interface MetacognitionBadgeProps {
    status: 'A' | 'B' | 'C' | 'D' | null;
    isCorrect: boolean | null;
}

const getMetacognitionInfo = (status: MetacognitionBadgeProps['status'], isCorrect: MetacognitionBadgeProps['isCorrect']) => {
    if (status === 'A' && isCorrect === true) return { text: '정확한 앎', className: 'meta-success' };
    if (status === 'B' && isCorrect === true) return { text: '불확실한 앎', className: 'meta-success-alt' };
    if (status === 'C' && isCorrect === false) return { text: '모르는 것 인지', className: 'meta-info' };
    if (status === 'D' && isCorrect === false) return { text: '아는 줄 아는 착각', className: 'meta-danger' };
    if (status === 'A' && isCorrect === false) return { text: '안다고 착각', className: 'meta-danger' };
    if (status === 'B' && isCorrect === false) return { text: '모른다고 착각', className: 'meta-warning' };
    
    return { text: '분석 불가', className: 'meta-default' };
};

const MetacognitionBadge: React.FC<MetacognitionBadgeProps> = ({ status, isCorrect }) => {
    const { text, className } = getMetacognitionInfo(status, isCorrect);
    return <Badge className={className}>{text}</Badge>;
};

export default MetacognitionBadge;