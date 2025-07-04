import React, { forwardRef } from 'react';
import '../actionbutton/ActionButton.css'; // ActionButton의 CSS를 재활용
import './LoadingButton.css'; // LoadingButton 전용 CSS

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean;
    loadingText?: string; // [핵심] 로딩 텍스트를 prop으로 받도록 추가
    children: React.ReactNode;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(({
    isLoading,
    loadingText = '처리 중...', // [수정] 기본값을 더 범용적인 텍스트로 변경
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
                    {/* [핵심] prop으로 받은 loadingText를 사용합니다. */}
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