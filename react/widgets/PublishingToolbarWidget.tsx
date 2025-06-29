import React, { useRef, useCallback, useEffect, useState } from 'react';
import LoadingButton from '../shared/ui/loadingbutton/LoadingButton';
import ActionButton from '../shared/ui/actionbutton/ActionButton';
import { LuFileDown } from 'react-icons/lu';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';
import './PublishingToolbarWidget.css';

interface PublishingToolbarWidgetProps {
    useSequentialNumbering: boolean;
    onToggleSequentialNumbering: () => void;
    baseFontSize: string;
    onBaseFontSizeChange: (value: string) => void;
    contentFontSizeEm: number;
    onContentFontSizeEmChange: (value: number) => void;
    onDownloadPdf: () => void;
    isGeneratingPdf: boolean;
    pdfProgressMessage: string; // [추가] 진행 메시지 prop
    previewAreaRef: React.RefObject<HTMLDivElement | null>;
    problemBoxMinHeight: number;
    setProblemBoxMinHeight: (height: number) => void;
}

const PublishingToolbarWidget: React.FC<PublishingToolbarWidgetProps> = (props) => {
    const {
        useSequentialNumbering, onToggleSequentialNumbering,
        baseFontSize, onBaseFontSizeChange,
        contentFontSizeEm, onContentFontSizeEmChange,
        onDownloadPdf,
        isGeneratingPdf,
        pdfProgressMessage, // [추가]
        previewAreaRef,
        problemBoxMinHeight,
        setProblemBoxMinHeight
    } = props;

    const { setDraggingControl, forceRecalculateLayout } = useExamLayoutStore();
    const dragStartRef = useRef<{ startY: number; startHeight: number } | null>(null);
    
    const [displayHeight, setDisplayHeight] = useState(problemBoxMinHeight);
    
    const displayHeightRef = useRef(displayHeight);
    useEffect(() => {
        displayHeightRef.current = displayHeight;
    }, [displayHeight]);

    const [isEditingMinHeight, setIsEditingMinHeight] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDisplayHeight(problemBoxMinHeight);
    }, [problemBoxMinHeight]);

    useEffect(() => {
        if (isEditingMinHeight && inputRef.current) {
            inputRef.current.select();
        }
    }, [isEditingMinHeight]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragStartRef.current || !previewAreaRef.current) return;
        const deltaY = e.clientY - dragStartRef.current.startY;
        const sensitivity = -0.1;
        const newHeight = dragStartRef.current.startHeight + deltaY * sensitivity;
        const clampedHeight = Math.max(5, Math.min(newHeight, 150));
        
        previewAreaRef.current.style.setProperty('--problem-box-min-height-em', `${clampedHeight}em`);
        setDisplayHeight(clampedHeight);
    }, [previewAreaRef]);

    const handleMouseUp = useCallback(() => {
        if (!dragStartRef.current) return;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        setDraggingControl(false);
        
        setProblemBoxMinHeight(displayHeightRef.current);
        forceRecalculateLayout(displayHeightRef.current);
        
        dragStartRef.current = null;
    }, [handleMouseMove, setDraggingControl, forceRecalculateLayout, setProblemBoxMinHeight]);

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

    const handleMinHeightDoubleClick = () => {
        setIsEditingMinHeight(true);
    };

    const handleMinHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayHeight(parseFloat(e.target.value) || 0);
    };

    const handleMinHeightInputBlur = () => {
        const clampedHeight = Math.max(5, Math.min(displayHeight, 150));
        setDisplayHeight(clampedHeight);
        setProblemBoxMinHeight(clampedHeight);
        forceRecalculateLayout(clampedHeight);
        setIsEditingMinHeight(false);
    };

    const handleMinHeightInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleMinHeightInputBlur();
        } else if (e.key === 'Escape') {
            setDisplayHeight(problemBoxMinHeight);
            setIsEditingMinHeight(false);
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
                <LoadingButton 
                    className="primary" 
                    onClick={onDownloadPdf}
                    isLoading={isGeneratingPdf}
                    // [수정] 동적으로 로딩 텍스트 변경
                    loadingText={pdfProgressMessage || "생성 중..."}
                >
                    <LuFileDown size={14} className="toolbar-icon"/>
                    PDF로 다운로드
                </LoadingButton>
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
                        value={displayHeight}
                        onChange={handleMinHeightInputChange}
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
                        aria-valuenow={displayHeight}
                        aria-valuemin={5}
                        aria-valuemax={150}
                        aria-label="문제 최소 높이 조절. 마우스를 누른 채 위아래로 드래그하거나 더블클릭하여 직접 입력하세요."
                        title="드래그 또는 더블클릭하여 수정"
                    >
                        {displayHeight.toFixed(1)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublishingToolbarWidget;