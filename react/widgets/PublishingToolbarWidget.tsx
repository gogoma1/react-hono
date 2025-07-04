import React, { useRef, useCallback, useEffect, useState } from 'react';
import LoadingButton from '../shared/ui/loadingbutton/LoadingButton';
import ActionButton from '../shared/ui/actionbutton/ActionButton';
import { LuFileDown, LuSmartphone } from 'react-icons/lu';
import { useExamLayoutStore } from '../features/problem-publishing/model/examLayoutStore';
import './PublishingToolbarWidget.css';

interface PublishingToolbarWidgetProps {
    useSequentialNumbering: boolean;
    onToggleSequentialNumbering: () => void;
    baseFontSize: string;
    onBaseFontSizeChange: (value: string) => void;
    contentFontSizeEm: number;
    onContentFontSizeEmChange: (value: number) => void;
    displayMinHeight: number;
    onDisplayMinHeightChange: (height: number) => void;
    onFinalMinHeightChange: (height: number) => void;
    onDownloadPdf: () => void;
    isGeneratingPdf: boolean;
    pdfProgress: { current: number; total: number; message: string };
    onPublishMobileExam: () => void;
    isPublishing: boolean;
}

interface DragInfo {
    startY: number;
    startHeight: number;
    onDisplayChange: (height: number) => void;
    onFinalChange: (height: number) => void;
    setDragging: (isDragging: boolean) => void;
}

const PublishingToolbarWidget: React.FC<PublishingToolbarWidgetProps> = (props) => {
    const {
        useSequentialNumbering, onToggleSequentialNumbering,
        baseFontSize, onBaseFontSizeChange,
        contentFontSizeEm, onContentFontSizeEmChange,
        displayMinHeight,
        onDisplayMinHeightChange,
        onFinalMinHeightChange,
        onDownloadPdf, isGeneratingPdf, pdfProgress,
        onPublishMobileExam, isPublishing,
    } = props;

    const dragInfoRef = useRef<DragInfo | null>(null);
    const setDraggingControl = useExamLayoutStore(state => state.setDraggingControl);
    const [isEditingMinHeight, setIsEditingMinHeight] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (isEditingMinHeight && inputRef.current) { inputRef.current.select(); } }, [isEditingMinHeight]);
    const handleMouseMove = useCallback((e: MouseEvent) => { if (!dragInfoRef.current) return; const { startY, startHeight, onDisplayChange } = dragInfoRef.current; const deltaY = e.clientY - startY; const sensitivity = -0.1; const newHeight = startHeight + deltaY * sensitivity; const clampedHeight = parseFloat(Math.max(5, Math.min(newHeight, 150)).toFixed(1)); onDisplayChange(clampedHeight); }, []);
    const handleMouseUp = useCallback((e: MouseEvent) => { if (!dragInfoRef.current) return; const { onFinalChange, setDragging } = dragInfoRef.current; const deltaY = e.clientY - dragInfoRef.current.startY; const sensitivity = -0.1; const newHeight = dragInfoRef.current.startHeight + deltaY * sensitivity; const finalHeight = parseFloat(Math.max(5, Math.min(newHeight, 150)).toFixed(1)); onFinalChange(finalHeight); document.body.style.cursor = ''; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); setDragging(false); dragInfoRef.current = null; }, [handleMouseMove]);
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); dragInfoRef.current = { startY: e.clientY, startHeight: displayMinHeight, onDisplayChange: onDisplayMinHeightChange, onFinalChange: onFinalMinHeightChange, setDragging: setDraggingControl, }; setDraggingControl(true); document.body.style.cursor = 'ns-resize'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }, [displayMinHeight, onDisplayMinHeightChange, onFinalMinHeightChange, setDraggingControl, handleMouseMove, handleMouseUp]);
    const handleMinHeightDoubleClick = useCallback(() => setIsEditingMinHeight(true), []);
    const handleMinHeightInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { onDisplayMinHeightChange(parseFloat(e.target.value) || 0); }, [onDisplayMinHeightChange]);
    const handleMinHeightInputBlur = useCallback(() => { const clampedHeight = parseFloat(Math.max(5, Math.min(displayMinHeight, 150)).toFixed(1)); onDisplayMinHeightChange(clampedHeight); onFinalMinHeightChange(clampedHeight); setIsEditingMinHeight(false); }, [displayMinHeight, onDisplayMinHeightChange, onFinalMinHeightChange]);
    const handleMinHeightInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { handleMinHeightInputBlur(); } else if (e.key === 'Escape') { setIsEditingMinHeight(false); } }, [handleMinHeightInputBlur]);

    return (
        <div className="publishing-controls-panel">
            <div className="control-group">
                <LoadingButton 
                    className="primary" 
                    onClick={onDownloadPdf}
                    isLoading={isGeneratingPdf}
                    loadingText={pdfProgress.message || "변환 중..."}
                    disabled={isPublishing}
                >
                    <LuFileDown size={14} className="toolbar-icon"/>
                    PDF로 다운로드
                </LoadingButton>
                
                <LoadingButton
                    className="primary"
                    onClick={onPublishMobileExam}
                    isLoading={isPublishing}
                    loadingText="출제 중..."
                    disabled={isGeneratingPdf}
                >
                    <LuSmartphone size={14} className="toolbar-icon"/>
                    모바일 출제
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
                <input id="content-font-size" type="number" step="0.1" value={contentFontSizeEm} onChange={e => onContentFontSizeEmChange(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="control-group">
                <label htmlFor="min-box-height-drag">문제 최소높이(em):</label>
                {isEditingMinHeight ? (
                    <input ref={inputRef} type="number" value={displayMinHeight} onChange={handleMinHeightInputChange} onBlur={handleMinHeightInputBlur} onKeyDown={handleMinHeightInputKeyDown} className="draggable-number-input" />
                ) : (
                    <div id="min-box-height-drag" className="draggable-number" onMouseDown={handleMouseDown} onDoubleClick={handleMinHeightDoubleClick} role="slider" aria-valuenow={displayMinHeight} aria-valuemin={5} aria-valuemax={150} aria-label="문제 최소 높이 조절. 마우스를 누른 채 위아래로 드래그하거나 더블클릭하여 직접 입력하세요." title="드래그 또는 더블클릭하여 수정">
                        {displayMinHeight.toFixed(1)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(PublishingToolbarWidget);