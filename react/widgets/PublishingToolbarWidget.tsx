import React, { useRef, useCallback, useEffect, useState } from 'react';
import ActionButton from '../shared/ui/actionbutton/ActionButton';
import { LuFileDown } from 'react-icons/lu';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';

interface PublishingToolbarWidgetProps {
    useSequentialNumbering: boolean;
    onToggleSequentialNumbering: () => void;
    baseFontSize: string;
    onBaseFontSizeChange: (value: string) => void;
    contentFontSizeEm: number;
    onContentFontSizeEmChange: (value: number) => void;
    problemBoxMinHeight: number;
    onProblemBoxMinHeightChange: (value: number) => void;
    onDownloadPdf: () => void;
}

const PublishingToolbarWidget: React.FC<PublishingToolbarWidgetProps> = (props) => {
    const {
        useSequentialNumbering, onToggleSequentialNumbering,
        baseFontSize, onBaseFontSizeChange,
        contentFontSizeEm, onContentFontSizeEmChange,
        problemBoxMinHeight, onProblemBoxMinHeightChange,
        onDownloadPdf
    } = props;

    const { setDraggingControl } = useExamLayoutStore.getState();
    const dragStartRef = useRef<{ startY: number; startHeight: number } | null>(null);

    // [추가] 직접 입력을 위한 상태
    const [isEditingMinHeight, setIsEditingMinHeight] = useState(false);
    const [minHeightInput, setMinHeightInput] = useState(String(problemBoxMinHeight));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditingMinHeight) {
            setMinHeightInput(String(problemBoxMinHeight.toFixed(1)));
        }
    }, [problemBoxMinHeight, isEditingMinHeight]);

    useEffect(() => {
        if (isEditingMinHeight && inputRef.current) {
            inputRef.current.select();
        }
    }, [isEditingMinHeight]);


    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaY = e.clientY - dragStartRef.current.startY;
        const sensitivity = -0.1;
        const newHeight = dragStartRef.current.startHeight + deltaY * sensitivity;
        const clampedHeight = Math.max(5, Math.min(newHeight, 150));
        onProblemBoxMinHeightChange(clampedHeight);
    }, [onProblemBoxMinHeightChange]);

    const handleMouseUp = useCallback(() => {
        if (!dragStartRef.current) return;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        setDraggingControl(false);
        
        dragStartRef.current = null;
    }, [handleMouseMove, setDraggingControl]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggingControl(true);
        dragStartRef.current = {
            startY: e.clientY,
            startHeight: problemBoxMinHeight,
        };
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [problemBoxMinHeight, handleMouseMove, handleMouseUp, setDraggingControl]);

    // [추가] 더블클릭 핸들러
    const handleMinHeightDoubleClick = () => {
        setIsEditingMinHeight(true);
    };

    // [추가] 입력 완료 핸들러 (포커스 아웃)
    const handleMinHeightInputBlur = () => {
        const newValue = parseFloat(minHeightInput);
        if (!isNaN(newValue)) {
            onProblemBoxMinHeightChange(Math.max(5, Math.min(newValue, 150)));
        }
        setIsEditingMinHeight(false);
    };

    // [추가] 키보드 입력 핸들러 (Enter, Escape)
    const handleMinHeightInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleMinHeightInputBlur();
        } else if (e.key === 'Escape') {
            setIsEditingMinHeight(false);
            setMinHeightInput(String(problemBoxMinHeight.toFixed(1)));
        }
    };


    useEffect(() => {
        return () => {
            if (dragStartRef.current) {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [handleMouseMove, handleMouseUp]);
    
    return (
        <div className="publishing-controls-panel">
            <div className="control-group">
                <ActionButton className="primary" onClick={onDownloadPdf}>
                    <LuFileDown size={14} style={{ marginRight: '8px' }}/>
                    PDF로 다운로드
                </ActionButton>
                <ActionButton onClick={onToggleSequentialNumbering}>
                    번호: {useSequentialNumbering ? '순차' : '원본'}
                </ActionButton>
            </div>
            <div className="control-group">
                <label htmlFor="base-font-size">기준 크기:</label>
                <input id="base-font-size" type="text" value={baseFontSize} onChange={e => onBaseFontSizeChange(e.target.value)} />
            </div>
            <div className="control-group">
                <label htmlFor="content-font-size">본문 크기(em):</label>
                <input 
                    id="content-font-size" 
                    type="number" 
                    step="0.1" 
                    value={contentFontSizeEm} 
                    onChange={e => onContentFontSizeEmChange(parseFloat(e.target.value) || 0)} 
                />
            </div>
            <div className="control-group">
                <label htmlFor="min-box-height-drag">문제 최소높이(em):</label>
                {isEditingMinHeight ? (
                    <input
                        ref={inputRef}
                        type="number"
                        value={minHeightInput}
                        onChange={(e) => setMinHeightInput(e.target.value)}
                        onBlur={handleMinHeightInputBlur}
                        onKeyDown={handleMinHeightInputKeyDown}
                        className="draggable-number-input"
                    />
                ) : (
                    <div
                        id="min-box-height-drag"
                        className="draggable-number"
                        onMouseDown={handleMouseDown}
                        onDoubleClick={handleMinHeightDoubleClick}
                        role="slider"
                        aria-valuenow={problemBoxMinHeight}
                        aria-valuemin={5}
                        aria-valuemax={150}
                        aria-label="문제 최소 높이 조절. 마우스를 누른 채 위아래로 드래그하거나 더블클릭하여 직접 입력하세요."
                        title="드래그 또는 더블클릭하여 수정"
                    >
                        {problemBoxMinHeight.toFixed(1)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublishingToolbarWidget;