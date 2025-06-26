// ----- ./react/shared/ui/TableCellCheckbox/TableCellCheckbox.tsx -----
import React from 'react';
import { LuCircle, LuCircleCheckBig } from 'react-icons/lu';


interface CheckboxProps {
    isChecked: boolean;
    onToggle: () => void;
    iconSize?: number;
    checkedColor?: string;
    uncheckedColor?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    ariaLabel?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    isChecked,
    onToggle,
    iconSize = 20,
    checkedColor = '#3498db',
    uncheckedColor = '#ccc',
    disabled = false,
    className = '',
    style = {},
    ariaLabel = 'Checkbox',
}) => {
    const handleClick = () => {
        if (!disabled) {
            // [제거] 불필요한 로그 제거
            // console.log(`[TableCellCheckbox] 클릭됨! onToggle 호출. 현재 isChecked: ${isChecked}`);
            onToggle();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault();
            onToggle();
        }
    };

    const currentIconColor = isChecked ? checkedColor : uncheckedColor;

    const buttonClassName = `
    checkbox-component ${''}
    ${disabled ? 'checkbox-disabled' : 'checkbox-enabled'} ${''}
    ${className} ${''}
  `.trim().replace(/\s+/g, ' ');

    const buttonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        ...style,
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={buttonClassName}
            style={buttonStyle}
            role="checkbox"
            aria-checked={isChecked}
            aria-label={ariaLabel}
        >
            {isChecked ? (
                <LuCircleCheckBig size={iconSize} color={currentIconColor} aria-hidden="true" />
            ) : (
                <LuCircle size={iconSize} color={currentIconColor} aria-hidden="true" />
            )}
        </button>
    );
};

export default Checkbox;