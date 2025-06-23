import React, { forwardRef } from 'react'; // React.forwardRef import
import './ActionButton.css';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    'aria-label'?: string;
}

// [수정] React.forwardRef로 컴포넌트를 감싸줍니다.
const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(({ 
    children, 
    className, 
    ...props 
}, ref) => { // 두 번째 인자로 ref를 받습니다.
    const combinedClassName = `action-button ${className || ''}`.trim();

    return (
        // [수정] 받아온 ref를 실제 <button> 요소에 전달합니다.
        <button ref={ref} className={combinedClassName} {...props}>
            {children}
        </button>
    );
});

// [추가] forwardRef 사용 시 displayName을 설정하는 것이 좋습니다. (디버깅 용이)
ActionButton.displayName = 'ActionButton';

export default ActionButton;