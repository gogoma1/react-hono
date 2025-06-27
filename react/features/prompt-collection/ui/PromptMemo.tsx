import React, { useState } from 'react';
import { LuCopy, LuCopyCheck, LuPencil, LuTrash2, LuSave, LuCircleX, LuRotateCcw, LuChevronDown, LuLayers } from 'react-icons/lu'; // LuLayers 추가
import Tippy from '@tippyjs/react';
import type { Prompt } from '../model/usePromptManager';
import './PromptCollection.css';

interface PromptMemoProps {
    prompt: Prompt;
    isEditing: boolean;
    isExpanded: boolean;
    editingTitle: string;
    onSetEditingTitle: (title: string) => void;
    editingContent: string;
    onSetEditingContent: (content: string) => void;
    onStartEditing: (prompt: Prompt) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
    onReset: (id: string) => void;
    onToggleExpand: (id: string) => void;
    workbenchContent?: string; // [추가] prop 받기
}

const PromptMemo: React.FC<PromptMemoProps> = ({
    prompt, isEditing, isExpanded, editingTitle, onSetEditingTitle, editingContent, onSetEditingContent,
    onStartEditing, onSave, onCancel, onDelete, onReset, onToggleExpand, workbenchContent
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isCombinedCopied, setIsCombinedCopied] = useState(false); // [추가] 새 버튼을 위한 상태

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    };

    // [추가] 새로운 결합 복사 핸들러
    const handleCombinedCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!workbenchContent) {
            alert('복사할 작업 내용이 없습니다.');
            return;
        }

        const combinedText = `${prompt.content}\n${workbenchContent}`;
        
        navigator.clipboard.writeText(combinedText).then(() => {
            setIsCombinedCopied(true);
            setTimeout(() => setIsCombinedCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy combined text: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    };


    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartEditing(prompt);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(prompt.id);
    };

    const handleResetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onReset(prompt.id);
    };
    
    const editModeHeader = (
        <div className="prompt-memo-header non-clickable">
            <input 
                type="text" 
                value={editingTitle} 
                onChange={(e) => onSetEditingTitle(e.target.value)} 
                className="title-input"
                placeholder="프롬프트 제목"
            />
            <div className="button-group">
                <Tippy content="저장" theme="custom-glass"><button onClick={onSave} className="prompt-action-button save"><LuSave size={16} /></button></Tippy>
                <Tippy content="취소" theme="custom-glass"><button onClick={onCancel} className="prompt-action-button cancel"><LuCircleX size={16} /></button></Tippy>
            </div>
        </div>
    );
    
    const viewModeHeader = (
        <div className="prompt-memo-header" onClick={() => onToggleExpand(prompt.id)}>
            <div className="header-top-row">
                <button className="expand-toggle-button" aria-expanded={isExpanded}>
                    <LuChevronDown size={18} className="chevron-icon" />
                </button>
                <h5 className="prompt-memo-title">{prompt.title}</h5>
            </div>
            <div className="header-bottom-row">
                <div className="button-group">
                    <Tippy content={isCopied ? "복사 완료!" : "프롬프트 복사"} theme="custom-glass"><button onClick={handleCopy} className="prompt-action-button copy">{isCopied ? <LuCopyCheck size={16} /> : <LuCopy size={16} />}</button></Tippy>
                    
                    {/* [추가] '문제 개별화 작업' 프롬프트에만 특별 버튼 표시 */}
                    {prompt.id === 'default-3' && workbenchContent && (
                        <Tippy content={isCombinedCopied ? "복사 완료!" : "작업할 문제와 프롬프트를 한 번에 복사"} theme="custom-glass">
                            <button onClick={handleCombinedCopy} className="prompt-action-button combined-copy">
                                {isCombinedCopied ? <LuCopyCheck size={16} /> : <LuLayers size={16} />}
                            </button>
                        </Tippy>
                    )}

                    <Tippy content="수정" theme="custom-glass"><button onClick={handleEditClick} className="prompt-action-button edit"><LuPencil size={16} /></button></Tippy>
                    
                    {prompt.id.startsWith('default-') && (
                         <Tippy content="기본값으로 초기화" theme="custom-glass"><button onClick={handleResetClick} className="prompt-action-button reset"><LuRotateCcw size={16} /></button></Tippy>
                    )}
                    
                    <Tippy content="삭제" theme="custom-glass"><button onClick={handleDeleteClick} disabled={prompt.id.startsWith('default-')} className="prompt-action-button delete"><LuTrash2 size={16} /></button></Tippy>
                </div>
            </div>
        </div>
    );


    if (isEditing) {
        return (
            <div className="prompt-memo-card editing expanded"> 
                {editModeHeader}
                <div className="prompt-memo-content">
                    <textarea 
                        value={editingContent} 
                        onChange={(e) => onSetEditingContent(e.target.value)} 
                        className="content-textarea"
                        placeholder="프롬프트 내용"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`prompt-memo-card ${isExpanded ? 'expanded' : ''}`}>
            {viewModeHeader}
            <div className="prompt-memo-content">
                <pre>{prompt.content}</pre>
            </div>
        </div>
    );
};

export default PromptMemo;