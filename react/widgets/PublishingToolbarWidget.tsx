import React from 'react';
import ActionButton from '../shared/ui/actionbutton/ActionButton';
import { LuFileDown } from 'react-icons/lu';

// Props 타입 정의
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
                <input id="content-font-size" type="number" step="0.1" value={contentFontSizeEm} onChange={e => onContentFontSizeEmChange(parseFloat(e.target.value))} />
            </div>
            <div className="control-group">
                <label htmlFor="min-box-height">문제 최소높이(em):</label>
                <input id="min-box-height" type="number" value={problemBoxMinHeight} onChange={e => onProblemBoxMinHeightChange(parseInt(e.target.value, 10))} />
            </div>
        </div>
    );
};

export default PublishingToolbarWidget;