import React from 'react';
import './ImageManager.css'; 

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
}

const ImageManager: React.FC<ImageManagerProps> = ({
    extractedImages, uploadStatuses, uploadedUrls, uploadErrors,
    pendingUploadCount, canApply, draggingTag, dragOverTag,
    onUploadSingle, onUploadAll, onApplyUrls,
    onDragStart, onDrop, onDragOver, onDragLeave, onDragEnd,
}) => {

    if (extractedImages.length === 0) {
        return (
            <div className="image-manager-panel">
                <h2 className="panel-title">이미지 관리</h2>
                <div className="panel-content empty-content">
                    <code>***이미지n***</code> 형식의 참조를 찾을 수 없습니다.
                </div>
            </div>
        );
    }
    
    return (
        <div className="image-manager-panel">
            <h2 className="panel-title">이미지 관리</h2>
            <div className="panel-content">
                <table className="image-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>미리보기</th>
                            <th className="actions-header">
                                <div className="header-buttons">
                                    <button onClick={onUploadAll} disabled={pendingUploadCount === 0} className="action-button">
                                        전체 업로드 ({pendingUploadCount})
                                    </button>
                                    <button onClick={onApplyUrls} disabled={!canApply} className="action-button">
                                        에디터에 적용
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {extractedImages.map(tag => {
                            const status = uploadStatuses[tag] || 'idle';
                            const url = uploadedUrls[tag];
                            const error = uploadErrors[tag];
                            const isDraggable = !!url || status === 'loading';

                            const getRowClassName = () => {
                                let className = 'image-table-row';
                                if (dragOverTag === tag) className += ' drag-over';
                                return className;
                            };

                            return (
                                <tr
                                    key={tag}
                                    className={getRowClassName()}
                                    onDragOver={(e) => onDragOver(e, tag)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, tag)}
                                    onDragEnd={onDragEnd}
                                >
                                    <td className="tag-name">{tag.slice(3, -3)}</td>
                                    <td
                                        draggable={isDraggable}
                                        onDragStart={(e) => onDragStart(e, tag)}
                                        className={`preview-cell ${isDraggable ? 'draggable' : ''} ${draggingTag === tag ? 'dragging' : ''}`}
                                    >
                                        <div className="preview-box">
                                            {url ? (
                                                <img src={url} alt={`Preview for ${tag}`} />
                                            ) : status === 'loading' ? (
                                                <span>로딩중...</span>
                                            ) : (
                                                <span>(대기)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        {status !== 'success' ? (
                                            <button onClick={() => onUploadSingle(tag)} disabled={status === 'loading'} className="action-button">
                                                {status === 'loading' ? '업로드 중...' : '업로드'}
                                            </button>
                                        ) : (
                                            <button onClick={() => onUploadSingle(tag)} className="action-button">
                                                변경
                                            </button>
                                        )}
                                        {url && (
                                            <div className="url-display">
                                                <a href={url} target="_blank" rel="noopener noreferrer" title={url}>
                                                    {url.length > 25 ? `${url.slice(0, 25)}...` : url}
                                                </a>
                                            </div>
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