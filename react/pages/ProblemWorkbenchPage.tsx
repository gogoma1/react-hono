import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Editor from '../shared/ui/codemirror-editor/Editor';
import MathpixRenderer from '../shared/ui/MathpixRenderer';
import { useImageUploadManager } from '../features/image-upload/model/useImageUploadManager';
import ImageManager from '../features/image-upload/ui/ImageManager';
import './ProblemWorkbenchPage.css';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import PromptCollection from '../features/prompt-collection/ui/PromptCollection';
import { LuCopy, LuCopyCheck, LuFilePlus } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

const LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH = 'problem-workbench-draft';

const ProblemWorkbenchPage: React.FC = () => {
    const { registerPageActions, setRightSidebarContent } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore.getState();

    const initialContent = useMemo(() => `# Mathpix Markdown 에디터에 오신 것을 환영합니다! 👋

이곳에서 Markdown 문법과 함께 LaTeX 수식을 실시간으로 편집하고 미리 볼 수 있습니다.

## 이미지 관리 예시

에디터에 \`***이미지1***\` 처럼 입력하면 오른쪽 패널에 이미지 관리 항목이 나타납니다.
각 항목에 이미지를 업로드하고, 최종적으로 '에디터에 적용' 버튼을 눌러보세요.

***이미지1***
***이미지2***
`, []);

    const [markdownContent, setMarkdownContent] = useState(() => {
        const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH);
        return savedContent !== null ? savedContent : initialContent;
    });

    const [previousMarkdownContent, setPreviousMarkdownContent] = useState<string | null>(null);
    
    const imageManager = useImageUploadManager(markdownContent);
    const [isCopied, setIsCopied] = useState(false);

    const handleContentChange = useCallback((content: string) => {
        setMarkdownContent(content);
        if (previousMarkdownContent !== null) {
            setPreviousMarkdownContent(null);
        }
    }, [previousMarkdownContent]);

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                if (markdownContent !== initialContent) {
                    localStorage.setItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH, markdownContent);
                    console.log(`[ProblemWorkbench] ✅ 임시 작업 내용이 로컬에 성공적으로 저장되었습니다. (${new Date().toLocaleTimeString()})`);
                } else {
                    localStorage.removeItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH);
                    console.log(`[ProblemWorkbench] 📝 임시 저장 내용이 삭제되었습니다 (초기 상태). (${new Date().toLocaleTimeString()})`);
                }
            } catch (error) {
                console.error(`[ProblemWorkbench] ❌ 로컬 저장소에 내용 저장 실패:`, error);
            }
        }, 5000);

        return () => clearTimeout(handler);
    }, [markdownContent, initialContent]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (markdownContent && markdownContent !== initialContent) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [markdownContent, initialContent]);

    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarContent(
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                <h4>문제 작업 설정</h4>
                <p>이곳에 문제 작업 관련 설정 UI가 표시됩니다.</p>
            </div>
        );
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleOpenPromptSidebar = useCallback(() => {
        setRightSidebarContent(<PromptCollection />);
        setRightSidebarExpanded(true);
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    const handleCloseSidebar = useCallback(() => {
        setRightSidebarExpanded(false);
        setTimeout(() => setRightSidebarContent(null), 300);
    }, [setRightSidebarExpanded, setRightSidebarContent]);

    useEffect(() => {
        registerPageActions({
            openSettingsSidebar: handleOpenSettingsSidebar,
            openPromptSidebar: handleOpenPromptSidebar,
            onClose: handleCloseSidebar,
        });
        return () => {
            registerPageActions({
                openSettingsSidebar: undefined,
                openPromptSidebar: undefined,
                onClose: undefined,
            });
        };
    }, [registerPageActions, handleOpenSettingsSidebar, handleOpenPromptSidebar, handleCloseSidebar]);

    const handleApplyUrls = useCallback(() => {
        const { extractedImages, uploadedUrls, canApply } = imageManager;
        if (!canApply) return;

        setPreviousMarkdownContent(markdownContent);

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
        }
    }, [markdownContent, imageManager]);
    
    const handleRevertUrls = useCallback(() => {
        if (previousMarkdownContent !== null) {
            setMarkdownContent(previousMarkdownContent);
            setPreviousMarkdownContent(null);
        }
    }, [previousMarkdownContent]);

    const handleCopyContent = useCallback(() => {
        navigator.clipboard.writeText(markdownContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }, [markdownContent]);

    const handleNewDocument = useCallback(() => {
        if (window.confirm('현재 작업 내용을 지우고 새로 시작하시겠습니까? 저장된 임시 내용도 사라집니다.')) {
            setMarkdownContent(initialContent);
            localStorage.removeItem(LOCAL_STORAGE_KEY_PROBLEM_WORKBENCH);
        }
    }, [initialContent]);

    return (
        <div className="problem-workbench-page">
            <input
                type="file"
                ref={imageManager.fileInputRef}
                onChange={imageManager.handleFileSelected}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <div className="problem-workbench-layout">
                <div className="workbench-panel editor-panel">
                    <div className="panel-title-container">
                        <h2 className="panel-title">Markdown & LaTeX 입력</h2>
                        <div className="panel-header-actions">
                            <Tippy content="새 작업 (초기화)" placement="top" theme="custom-glass">
                                <button onClick={handleNewDocument} className="panel-header-button" aria-label="새 작업 시작">
                                    <LuFilePlus size={18} />
                                </button>
                            </Tippy>
                            <Tippy content={isCopied ? "복사 완료!" : "전체 내용 복사"} placement="top" theme="custom-glass">
                                <button onClick={handleCopyContent} className="panel-header-button" aria-label="에디터 내용 복사">
                                    {isCopied ? <LuCopyCheck size={18} color="var(--accent-color)" /> : <LuCopy size={18} />}
                                </button>
                            </Tippy>
                        </div>
                    </div>
                    <div className="panel-content editor-content-wrapper">
                        <Editor
                            initialContent={markdownContent}
                            onContentChange={handleContentChange}
                        />
                    </div>
                </div>
                <div className="workbench-panel preview-panel">
                     <div className="panel-title-container">
                        <h2 className="panel-title">실시간 미리보기 (Mathpix)</h2>
                    </div>
                    <div className="panel-content preview-content-wrapper prose">
                        <MathpixRenderer text={markdownContent} />
                    </div>
                </div>
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
                        onRevertUrls={handleRevertUrls}
                        isApplied={previousMarkdownContent !== null}
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