import React from 'react';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import type { ComboboxOption } from '../../../entities/problem/model/types';
import { LuCheck, LuUndo2 } from 'react-icons/lu';

interface PopoverContentProps {
    label: string;
    onSave: () => void;
    onCancel: () => void;
}
interface PopoverInputProps extends PopoverContentProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface PopoverTextareaProps extends PopoverContentProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

interface PopoverComboboxProps {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: ComboboxOption[];
}

export const PopoverInput: React.FC<PopoverInputProps> = ({ label, onSave, onCancel, ...inputProps }) => (
    <div className="edit-popover-content">
        <label htmlFor={`edit-${label}`}>{label} 수정</label>
        <input id={`edit-${label}`} {...inputProps} className="popover-input" autoFocus />
        <div className="edit-popover-actions">
            <ActionButton onClick={onCancel} aria-label="취소">
                <LuUndo2 size={14} className="popover-icon" />
                취소
            </ActionButton>
            <ActionButton onClick={onSave} className="primary" aria-label="저장">
                <LuCheck size={14} className="popover-icon" />
                저장
            </ActionButton>
        </div>
    </div>
);


export const PopoverTextarea: React.FC<PopoverTextareaProps> = ({ label, onSave, onCancel, ...textareaProps }) => (
    <div className="edit-popover-content">
        <label htmlFor={`edit-${label}`}>{label} 수정</label>
        
        {/* [핵심] textarea와 버튼을 함께 담는 새로운 컨테이너 */}
        <div className="textarea-container">
            <textarea id={`edit-${label}`} {...textareaProps} className="popover-textarea" autoFocus />
            
            {/* [핵심] 버튼 그룹을 textarea와 같은 컨테이너 안으로 이동 */}
            <div className="edit-popover-actions on-textarea">
                <ActionButton onClick={onCancel} aria-label="취소">
                    <LuUndo2 size={14} className="popover-icon" />
                    취소
                </ActionButton>
                <ActionButton onClick={onSave} className="primary" aria-label="저장">
                    <LuCheck size={14} className="popover-icon" />
                    저장
                </ActionButton>
            </div>
        </div>
    </div>
);

export const PopoverCombobox: React.FC<PopoverComboboxProps> = ({ label, value, onValueChange, options }) => {
    return (
        <div className="edit-popover-content combobox-content">
            <div className="combobox-label">{label}</div>
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onValueChange(option.value)}
                    className="combobox-option"
                    aria-selected={value === option.value}
                >
                    {value === option.value && <LuCheck size={16} className="check-icon" />}
                    <span className="option-label">{option.label}</span>
                </button>
            ))}
        </div>
    );
};