import React from 'react';
import './ImageManager.css';
import { LuUndo2 } from 'react-icons/lu'; // '적용 취소' 아이콘 import

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImageManagerProps {
    extractedImages: string[];
    uploadStatuses: Record<string, UploadStatus>;
    uploadedUrls: Record<string, string | undefined>;
    uploadErrors: Record<string, string | null>;
    pendingUploadCount: number;
    canApply: boolean;
    draggingTag: string | null;
    dragOverTag: string | null;
    onUploadSingle: (tag: string) => void;
    onUploadAll: () => void;
    onApplyUrls: () => void;
    onDragStart: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDrop: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDragOver: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
    isApplied: boolean;
    onRevertUrls: () => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({
    extractedImages, uploadStatuses, uploadedUrls, uploadErrors,
    pendingUploadCount, canApply, draggingTag, dragOverTag,
    onUploadSingle, onUploadAll, onApplyUrls,
    onDragStart, onDrop, onDragOver, onDragLeave, onDragEnd,
    isApplied,
    onRevertUrls,
}) => {

    if (extractedImages.length === 0) {
        return (
            <div className="image-manager-panel">
                <div className="panel-title-container">
                    <h2 className="panel-title">이미지 관리</h2>
                </div>
                <div className="panel-content empty-content">
                    <code>***이미지n***</code> 형식의 참조를 찾을 수 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="image-manager-panel">
            <div className="panel-title-container">
                    <h2 className="panel-title">이미지 관리</h2>
                </div>

            <div className="button-row">
                <button onClick={onUploadAll} disabled={pendingUploadCount === 0} className="action-button secondary">
                    전체 업로드 ({pendingUploadCount})
                </button>
                
                {isApplied ? (
                    <button onClick={onRevertUrls} className="action-button secondary">
                        <LuUndo2 size={14} className="action-button-icon"/>
                        적용 취소
                    </button>
                ) : (
                    <button onClick={onApplyUrls} disabled={!canApply} className={`action-button primary ${!canApply ? 'disabled-style' : ''}`.trim()}>
                        에디터에 적용
                    </button>
                )}
            </div>

            <div className="table-content-area">
                <table className="image-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>미리보기</th>
                            <th className="actions-header">액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {extractedImages.map(tag => {
                            const status = uploadStatuses[tag] || 'idle';
                            const url = uploadedUrls[tag];
                            const error = uploadErrors[tag];
                            const isDraggable = !!url;
                            
                            const rowClassName = `
                                image-table-row
                                ${draggingTag === tag ? 'dragging-row' : ''}
                                ${dragOverTag === tag ? 'drag-over-row' : ''}
                            `.trim();

                            return (
                                <tr 
                                    key={tag} 
                                    className={rowClassName}
                                    onDragOver={(e) => onDragOver(e, tag)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, tag)}
                                    onDragEnd={onDragEnd}
                                >
                                    <td className="tag-name">
                                        {tag.slice(3, -3)}
                                    </td>
                                    <td
                                        draggable={isDraggable}
                                        onDragStart={(e) => onDragStart(e, tag)}
                                        className={`preview-cell ${isDraggable ? 'draggable' : ''}`}
                                    >
                                        <div className="preview-box">
                                            {url ? <img src={url} alt={`Preview for ${tag}`} /> : (status === 'loading' ? <span>로딩중...</span> : <span>(대기)</span>)}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        {status !== 'success' ? (
                                            <button onClick={() => onUploadSingle(tag)} disabled={status === 'loading'} className="action-button primary">
                                                {status === 'loading' ? '업로드 중...' : '업로드'}
                                            </button>
                                        ) : (
                                            <button onClick={() => onUploadSingle(tag)} className="action-button secondary">
                                                변경
                                            </button>
                                        )}
                                        {error && <div className="error-display" title={error}>{error}</div>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ImageManager;