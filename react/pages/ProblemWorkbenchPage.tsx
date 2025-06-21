import React, { useState, useCallback } from 'react';
import Editor from '../shared/ui/codemirror-editor/Editor';
import MathpixRenderer from '../shared/ui/MathpixRenderer';
import { useImageUploadManager } from '../features/image-upload/model/useImageUploadManager';
import ImageManager from '../features/image-upload/ui/ImageManager';
import './ProblemWorkbenchPage.css';

const ProblemWorkbenchPage: React.FC = () => {
    const initialContent = `# Mathpix Markdown 에디터에 오신 것을 환영합니다! 👋

이곳에서 Markdown 문법과 함께 LaTeX 수식을 실시간으로 편집하고 미리 볼 수 있습니다.

## 이미지 관리 예시

에디터에 \`***이미지1***\` 처럼 입력하면 오른쪽 패널에 이미지 관리 항목이 나타납니다.
각 항목에 이미지를 업로드하고, 최종적으로 '에디터에 적용' 버튼을 눌러보세요.

***이미지1***
***이미지2***
`;

    const [markdownContent, setMarkdownContent] = useState(initialContent);
    const imageManager = useImageUploadManager(markdownContent);

    const handleContentChange = useCallback((content: string) => {
        setMarkdownContent(content);
    }, []);

    const handleApplyUrls = useCallback(() => {
        const { extractedImages, uploadedUrls } = imageManager;
        let newMarkdown = markdownContent;
        let changesMade = false;

        extractedImages.forEach(tag => {
            const url = uploadedUrls[tag];
            if (url) {
                const tagRegex = new RegExp(tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
                newMarkdown = newMarkdown.replace(tagRegex, `![](${url})`);
                changesMade = true;
            }
        });

        if (changesMade) {
            setMarkdownContent(newMarkdown);
            alert('이미지 URL을 에디터에 적용했습니다.');
        } else {
            alert('적용할 변경사항이 없거나, 모든 URL이 준비되지 않았습니다.');
        }
    }, [markdownContent, imageManager]);

    return (
        <div className="problem-workbench-page">
            {/* 파일 입력을 위한 숨겨진 input 요소 */}
            <input
                type="file"
                ref={imageManager.fileInputRef}
                onChange={imageManager.handleFileSelected}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <div className="problem-workbench-layout">
                {/* 패널 1: 에디터 */}
                <div className="workbench-panel editor-panel">
                    <h2 className="panel-title">Markdown & LaTeX 입력</h2>
                    <div className="panel-content editor-content-wrapper">
                        <Editor
                            initialContent={markdownContent}
                            onContentChange={handleContentChange}
                        />
                    </div>
                </div>

                {/* 패널 2: 미리보기 */}
                <div className="workbench-panel preview-panel">
                    <h2 className="panel-title">실시간 미리보기 (Mathpix)</h2>
                    <div className="panel-content preview-content-wrapper prose">
                        <MathpixRenderer text={markdownContent} />
                    </div>
                </div>

                {/* 패널 3: 이미지 관리 */}
                <div className="workbench-panel image-manager-wrapper-panel">
                    <ImageManager
                        extractedImages={imageManager.extractedImages}
                        uploadStatuses={imageManager.uploadStatuses}
                        uploadedUrls={imageManager.uploadedUrls}
                        uploadErrors={imageManager.uploadErrors}
                        pendingUploadCount={imageManager.pendingUploadCount}
                        canApply={imageManager.canApply}
                        draggingTag={imageManager.draggingTag}
                        dragOverTag={imageManager.dragOverTag}
                        onUploadSingle={imageManager.onUploadSingle}
                        onUploadAll={imageManager.onUploadAll}
                        onApplyUrls={handleApplyUrls}
                        onDragStart={imageManager.onDragStart}
                        onDrop={imageManager.onDrop}
                        onDragOver={imageManager.onDragOver}
                        onDragLeave={imageManager.onDragLeave}
                        onDragEnd={imageManager.onDragEnd}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProblemWorkbenchPage;