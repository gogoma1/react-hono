import React, { useMemo, forwardRef, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react';
import './ProfileSetupInput.css';

interface ProfileSetupInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    placeholder: string;
    
    isCompleted: boolean;
    isEditing: boolean;
    onStartEdit: () => void;
    readOnly: boolean;
    
    errorMessage?: string;
    type?: 'text' | 'tel';
    maxLength?: number;
    nextButton?: ReactNode;
}

// [핵심 수정] React.forwardRef로 컴포넌트를 감싸고, props와 함께 ref를 두 번째 인자로 받습니다.
const ProfileSetupInput = forwardRef<HTMLInputElement, ProfileSetupInputProps>(({
    id,
    label,
    isCompleted,
    isEditing,
    onStartEdit,
    readOnly,
    errorMessage,
    nextButton,
    onBlur,
    ...inputProps
}, ref) => {
    
    const inputClassName = useMemo(() => {
        const classes = ['form-input'];
        if (errorMessage) {
            classes.push('input-error');
        } else if (isCompleted && !isEditing) {
            classes.push('input-completed');
        }
        return classes.join(' ');
    }, [errorMessage, isCompleted, isEditing]);

    const handleContainerClick = () => {
        if (isCompleted && !isEditing) {
            onStartEdit();
        }
    };
    
    return (
        <div 
            className={`psi-form-group fade-in ${isCompleted ? 'step-completed' : ''}`}
            onClick={handleContainerClick}
        >
            <label htmlFor={id} className="psi-form-label">{label}</label>
            <div className="psi-input-with-button">
                <input
                    id={id}
                    className={inputClassName}
                    readOnly={readOnly}
                    onBlur={onBlur}
                    ref={ref} // 전달받은 ref를 실제 input 요소에 연결합니다.
                    {...inputProps}
                />
                {nextButton}
            </div>
        </div>
    );
});

// 디버깅 시 컴포넌트 이름을 명확하게 표시하기 위해 displayName을 설정합니다.
ProfileSetupInput.displayName = 'ProfileSetupInput';

export default ProfileSetupInput;