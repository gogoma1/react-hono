import React from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { usePromptManager } from '../model/usePromptManager';
import PromptMemo from './PromptMemo';
import './PromptCollection.css';

const PromptCollection: React.FC = () => {
    const {
        prompts,
        editingPromptId,
        editingTitle,
        setEditingTitle,
        editingContent,
        setEditingContent,
        expandedPromptId, // [추가]
        toggleExpand, // [추가]
        addPrompt,
        deletePrompt,
        resetDefaultPrompt,
        startEditing,
        cancelEditing,
        saveEditing
    } = usePromptManager();

    return (
        <div className="prompt-collection-container">
            <div className="prompt-collection-header">
                <h4 className="prompt-collection-title">프롬프트 모음</h4>
            </div>
            <div className="add-prompt-section">
                <button onClick={addPrompt} className="add-prompt-button">
                    <LuCirclePlus size={16} />
                    <span>새 프롬프트 추가</span>
                </button>
            </div>

            <div className="prompt-list">
                {prompts.map(prompt => (
                    <PromptMemo
                        key={prompt.id}
                        prompt={prompt}
                        isEditing={editingPromptId === prompt.id}
                        isExpanded={expandedPromptId === prompt.id} // [추가]
                        editingTitle={editingTitle}
                        onSetEditingTitle={setEditingTitle}
                        editingContent={editingContent}
                        onSetEditingContent={setEditingContent}
                        onStartEditing={startEditing}
                        onSave={saveEditing}
                        onCancel={cancelEditing}
                        onDelete={deletePrompt}
                        onReset={resetDefaultPrompt}
                        onToggleExpand={toggleExpand} // [추가]
                    />
                ))}
                {prompts.length === 0 && (
                    <div className="empty-prompt-list">
                        <p>저장된 프롬프트가 없습니다.</p>
                        <p>'새 프롬프트 추가' 버튼을 눌러 시작하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptCollection;