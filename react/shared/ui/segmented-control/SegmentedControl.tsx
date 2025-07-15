import React from 'react';
import './SegmentedControl.css';

interface ControlOption<T extends string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
    options: ControlOption<T>[];
    value: T;
    onChange: (value: T) => void;
    name?: string; // 라디오 그룹처럼 사용될 경우를 대비
}

const SegmentedControl = <T extends string>({ 
    options, 
    value, 
    onChange, 
    name 
}: SegmentedControlProps<T>) => {
    return (
        <div className="segmented-control" role="group">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    name={name}
                    className={`control-option ${value === option.value ? 'active' : ''}`}
                    onClick={() => onChange(option.value)}
                    aria-pressed={value === option.value}
                    title={option.label} // 툴팁으로 라벨 표시
                >
                    {option.icon && <span className="option-icon" aria-hidden="true">{option.icon}</span>}
                    <span className="option-label">{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default SegmentedControl;