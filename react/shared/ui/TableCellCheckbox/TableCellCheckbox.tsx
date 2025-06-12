import React from 'react';
import { LuCircle, LuCircleCheckBig } from 'react-icons/lu';

// (선택 사항) 이 컴포넌트와 관련된 CSS 파일
// import './Checkbox.css';

interface CheckboxProps {
    /**
     * 체크박스의 현재 선택 상태. 이 값에 따라 아이콘이 변경됩니다.
     */
    isChecked: boolean;
    /**
     * 체크박스가 토글될 때 호출되는 함수입니다.
     * 상위 컴포넌트에서 이 함수를 통해 isChecked 상태를 업데이트해야 합니다.
     */
    onToggle: () => void;
    /**
     * 아이콘의 크기 (react-icons의 size prop).
     * @default 20
     */
    iconSize?: number;
    /**
     * 선택되었을 때 아이콘 색상 (CSS color 값, 예: '#3498db' 또는 'blue').
     * @default '#3498db'
     */
    checkedColor?: string;
    /**
     * 선택되지 않았을 때 아이콘 색상 (CSS color 값, 예: '#666' 또는 'gray').
     * @default '#ccc'
     */
    uncheckedColor?: string;
    /**
     * 체크박스를 비활성화할지 여부.
     * @default false
     */
    disabled?: boolean;
    /**
     * 최상위 요소(button)에 적용할 사용자 정의 CSS 클래스명.
     */
    className?: string;
    /**
     * 최상위 요소(button)에 직접 적용할 인라인 스타일 객체.
     */
    style?: React.CSSProperties;
    /**
     * 접근성을 위한 ARIA 레이블.
     * @default 'Checkbox'
     */
    ariaLabel?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    isChecked,
    onToggle,
    iconSize = 20,
    checkedColor = '#3498db', // 기본 선택 색상
    uncheckedColor = '#ccc',   // 기본 미선택 색상
    disabled = false,
    className = '',
    style = {},
    ariaLabel = 'Checkbox', // 기본 ARIA 레이블 제공
}) => {
    const handleClick = () => {
        if (!disabled) {
            onToggle(); // 외부로 상태 변경 요청 (상위에서 isChecked 상태를 업데이트해야 함)
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault(); // 기본 동작(예: 스페이스바로 페이지 스크롤) 방지
            onToggle();
        }
    };

    const currentIconColor = isChecked ? checkedColor : uncheckedColor;

    // 기본 스타일과 사용자 정의 스타일, 비활성화 스타일을 결합
    const buttonClassName = `
    checkbox-component ${/* 이 컴포넌트 전체를 위한 기본 식별 클래스 (선택 사항) */''}
    ${disabled ? 'checkbox-disabled' : 'checkbox-enabled'} ${/* CSS에서 스타일링하기 위한 활성/비활성 클래스 */''}
    ${className} ${/* 사용자가 전달한 추가 클래스 */''}
  `.trim().replace(/\s+/g, ' '); // 여분의 공백 정리

    const buttonStyle: React.CSSProperties = {
        background: 'none', // 버튼 기본 배경 제거
        border: 'none',     // 버튼 기본 테두리 제거
        padding: 0,         // 버튼 기본 패딩 제거
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', // 아이콘 정렬 및 크기 조정을 위해
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1, // 비활성화 시 투명도 조절
        ...style, // 사용자가 전달한 스타일로 덮어쓰기 가능
    };

    return (
        <button
            type="button" // 폼 내부에서 기본 제출 동작 방지
            onClick={handleClick}
            onKeyDown={handleKeyDown} // 스페이스바, 엔터키로 토글 지원
            disabled={disabled}
            className={buttonClassName}
            style={buttonStyle}
            role="checkbox"
            aria-checked={isChecked}
            aria-label={ariaLabel}
        // tabIndex는 button 요소에 기본적으로 적용되므로, disabled 상태에서 알아서 -1로 처리됨
        >
            {isChecked ? (
                <LuCircleCheckBig size={iconSize} color={currentIconColor} aria-hidden="true" />
            ) : (
                <LuCircle size={iconSize} color={currentIconColor} aria-hidden="true" />
            )}
            {/* 스크린 리더 사용자를 위해 숨겨진 텍스트 추가 (선택 사항, aria-label로 충분할 수도 있음) */}
            {/* <span className="sr-only">{isChecked ? 'Selected' : 'Not selected'}</span> */}
        </button>
    );
};

export default Checkbox;