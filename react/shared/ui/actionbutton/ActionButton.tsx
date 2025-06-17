import React from 'react';
import './ActionButton.css';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    'aria-label': string; // 아이콘 버튼의 접근성을 위해 필수 항목으로 지정
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
    children, 
    className, 
    ...props 
}) => {
    const combinedClassName = `action-button ${className || ''}`.trim();

    return (
        <button className={combinedClassName} {...props}>
            {children}
        </button>
    );
};

export default ActionButton;