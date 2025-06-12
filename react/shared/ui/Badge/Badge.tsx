import React from 'react';
import './Badge.css'; // Badge의 기본 구조/레이아웃 CSS

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    // HTMLSpanElement의 모든 props (className, style 등)를 받을 수 있게 함
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ children, className = '', ...props }) => {
    return (
        <span className={`badge ${className}`} {...props}>
            {children}
        </span>
    );
};

export default Badge;