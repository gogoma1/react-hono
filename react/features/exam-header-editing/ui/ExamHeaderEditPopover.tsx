import React from 'react';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import { LuCheck, LuUndo2 } from 'react-icons/lu';
import '../../../shared/ui/popover-content/PopoverContent.css';

interface ExamHeaderEditPopoverProps {
    targetLabel: string;
    textValue: string;
    onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fontSizeValue?: number;
    onFontSizeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onCancel: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

const ExamHeaderEditPopover: React.FC<ExamHeaderEditPopoverProps> = ({
    targetLabel,
    textValue,
    onTextChange,
    fontSizeValue,
    onFontSizeChange,
    onSave,
    onCancel,
    onKeyDown
}) => {
    return (
        <div className="edit-popover-content">
            <label htmlFor={`edit-${targetLabel}`}>{targetLabel} 수정</label>
            
            <div className="form-group form-group-gapped">
                <input 
                    id={`edit-${targetLabel}`}
                    type="text"
                    value={textValue}
                    onChange={onTextChange}
                    onKeyDown={onKeyDown}
                    className="popover-input" 
                    autoFocus 
                    placeholder="내용"
                />

                {fontSizeValue !== undefined && onFontSizeChange && (
                     <input
                        type="number"
                        step="0.01"
                        value={fontSizeValue}
                        onChange={onFontSizeChange}
                        onKeyDown={onKeyDown}
                        className="popover-input"
                        placeholder="크기(em)"
                    />
                )}
            </div>

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
};

export default ExamHeaderEditPopover;