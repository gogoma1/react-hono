import React, { useState } from 'react';
import { LuCopy, LuCopyCheck, LuPencil, LuTrash2, LuSave, LuCircleX, LuRotateCcw, LuChevronDown } from 'react-icons/lu';
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
}

const PromptMemo: React.FC<PromptMemoProps> = ({
    prompt, isEditing, isExpanded, editingTitle, onSetEditingTitle, editingContent, onSetEditingContent,
    onStartEditing, onSave, onCancel, onDelete, onReset, onToggleExpand
}) => {
    const [isCopied, setIsCopied] = useState(false);

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
                    <Tippy content="수정" theme="custom-glass"><button onClick={handleEditClick} className="prompt-action-button edit"><LuPencil size={16} /></button></Tippy>
                    
                    {/* [수정] ID가 'default-'로 시작하는 모든 프롬프트에 초기화 버튼 표시 */}
                    {prompt.id.startsWith('default-') && (
                         <Tippy content="기본값으로 초기화" theme="custom-glass"><button onClick={handleResetClick} className="prompt-action-button reset"><LuRotateCcw size={16} /></button></Tippy>
                    )}
                    
                    {/* [수정] ID가 'default-'로 시작하는 모든 프롬프트의 삭제 버튼 비활성화 */}
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