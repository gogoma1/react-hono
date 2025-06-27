import React, { forwardRef } from 'react';
import '../actionbutton/ActionButton.css'; // ActionButton의 CSS를 재활용
import './LoadingButton.css'; // LoadingButton 전용 CSS

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean;
    loadingText?: string;
    children: React.ReactNode;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(({
    isLoading,
    loadingText = '처리 중...',
    children,
    className,
    ...props
}, ref) => {
    const combinedClassName = `action-button ${className || ''} ${isLoading ? 'loading' : ''}`.trim();

    return (
        <button
            ref={ref}
            className={combinedClassName}
            disabled={props.disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="spinner" />
                    <span className="loading-text">{loadingText}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
});
LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;