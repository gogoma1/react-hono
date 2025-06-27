import React, { useState, useCallback } from 'react';
import { LuCopy, LuChevronDown, LuPencil, LuTrash2, LuSave, LuCircleX, LuRotateCcw, LuCirclePlus } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import { useLatexHelpManager, type LatexHelpItem } from '../model/useLatexHelpManager';
import '../../prompt-collection/ui/PromptCollection.css';

interface HelpItemMemoProps {
    item: LatexHelpItem;
    isEditing: boolean;
    isExpanded: boolean;
    editingTitle: string;
    onSetEditingTitle: (title: string) => void;
    editingContent: string;
    onSetEditingContent: (content: string) => void;
    onStartEditing: (item: LatexHelpItem) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
    onReset: (id: string) => void;
    onToggleExpand: (id: string) => void;
}

const HelpItemMemo: React.FC<HelpItemMemoProps> = ({
    item, isEditing, isExpanded, editingTitle, onSetEditingTitle, editingContent, onSetEditingContent,
    onStartEditing, onSave, onCancel, onDelete, onReset, onToggleExpand
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }, [item.content]);

    const handleEditClick = (e: React.MouseEvent) => { e.stopPropagation(); onStartEditing(item); };
    const handleDeleteClick = (e: React.MouseEvent) => { e.stopPropagation(); onDelete(item.id); };
    const handleResetClick = (e: React.MouseEvent) => { e.stopPropagation(); onReset(item.id); };
    
    const editModeHeader = (
        <div className="prompt-memo-header non-clickable">
            <input 
                type="text" 
                value={editingTitle} 
                onChange={(e) => onSetEditingTitle(e.target.value)} 
                className="title-input"
                placeholder="도움말 제목"
            />
            <div className="button-group">
                <Tippy content="저장" theme="custom-glass"><button onClick={onSave} className="prompt-action-button save"><LuSave size={16} /></button></Tippy>
                <Tippy content="취소" theme="custom-glass"><button onClick={onCancel} className="prompt-action-button cancel"><LuCircleX size={16} /></button></Tippy>
            </div>
        </div>
    );
    
    const viewModeHeader = (
        <div className="prompt-memo-header" onClick={() => onToggleExpand(item.id)}>
            <div className="header-top-row">
                <button className="expand-toggle-button" aria-expanded={isExpanded}>
                    <LuChevronDown size={18} className="chevron-icon" />
                </button>
                <h5 className="prompt-memo-title">{item.title}</h5>
            </div>
            <div className="header-bottom-row">
                <div className="button-group">
                    <Tippy content={isCopied ? "복사 완료!" : "내용 복사"} theme="custom-glass"><button onClick={handleCopy} className="prompt-action-button copy"><LuCopy size={16} /></button></Tippy>
                    <Tippy content="수정" theme="custom-glass"><button onClick={handleEditClick} className="prompt-action-button edit"><LuPencil size={16} /></button></Tippy>
                    {item.id.startsWith('default-') && (
                         <Tippy content="기본값으로 초기화" theme="custom-glass"><button onClick={handleResetClick} className="prompt-action-button reset"><LuRotateCcw size={16} /></button></Tippy>
                    )}
                    <Tippy content="삭제" theme="custom-glass"><button onClick={handleDeleteClick} disabled={item.id.startsWith('default-')} className="prompt-action-button delete"><LuTrash2 size={16} /></button></Tippy>
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
                        placeholder="LaTeX 내용"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`prompt-memo-card ${isExpanded ? 'expanded' : ''}`}>
            {viewModeHeader}
            <div className="prompt-memo-content">
                <pre>{item.content}</pre>
            </div>
        </div>
    );
};


const LatexHelpPanel: React.FC = () => {
    const {
        helpItems,
        editingItemId,
        editingTitle,
        setEditingTitle,
        editingContent,
        setEditingContent,
        expandedItemId,
        toggleExpand,
        addHelpItem,
        deleteHelpItem,
        resetDefaultHelpItem,
        startEditing,
        cancelEditing,
        saveEditing
    } = useLatexHelpManager();

    return (
        <div className="prompt-collection-container">
            <div className="prompt-collection-header">
                <h4 className="prompt-collection-title">LaTeX 도우미</h4>
            </div>
            <div className="add-prompt-section">
                <button onClick={addHelpItem} className="add-prompt-button">
                    <LuCirclePlus size={16} />
                    <span>새 도움말 추가</span>
                </button>
            </div>
            <div className="prompt-list">
                {helpItems.map(item => (
                    <HelpItemMemo
                        key={item.id}
                        item={item}
                        isEditing={editingItemId === item.id}
                        isExpanded={expandedItemId === item.id}
                        editingTitle={editingTitle}
                        onSetEditingTitle={setEditingTitle}
                        editingContent={editingContent}
                        onSetEditingContent={setEditingContent}
                        onStartEditing={startEditing}
                        onSave={saveEditing}
                        onCancel={cancelEditing}
                        onDelete={deleteHelpItem}
                        onReset={resetDefaultHelpItem}
                        onToggleExpand={toggleExpand}
                    />
                ))}
                {helpItems.length === 0 && (
                    <div className="empty-prompt-list">
                        <p>저장된 도움말이 없습니다.</p>
                        <p>'새 도움말 추가' 버튼을 눌러 시작하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LatexHelpPanel;