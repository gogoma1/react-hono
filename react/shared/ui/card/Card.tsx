import React from 'react';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
// [수정] CardDescription의 타입 정의를 div 기준으로 변경합니다.
interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {} 
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, ...props }) => (
    <div className={`custom-card ${className || ''}`} {...props} />
);

export const CardHeader: React.FC<CardHeaderProps> = ({ className, ...props }) => (
    <div className={`custom-card-header ${className || ''}`} {...props} />
);

export const CardTitle: React.FC<CardTitleProps> = ({ className, ...props }) => (
    <h3 className={`custom-card-title ${className || ''}`} {...props} />
);

// [수정] <p> 태그를 <div> 태그로 변경합니다.
export const CardDescription: React.FC<CardDescriptionProps> = ({ className, ...props }) => (
    <div className={`custom-card-description ${className || ''}`} {...props} />
);

export const CardContent: React.FC<CardContentProps> = ({ className, ...props }) => (
    <div className={`custom-card-content ${className || ''}`} {...props} />
);

export const CardFooter: React.FC<CardFooterProps> = ({ className, ...props }) => (
    <div className={`custom-card-footer ${className || ''}`} {...props} />
);