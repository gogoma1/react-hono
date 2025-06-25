import React from 'react';
import Editor from '../../ui/codemirror-editor/Editor';
import './CodeEditorPanel.css';

interface CodeEditorPanelProps {
  title: string;
  content: string;
  onContentChange: (content: string) => void;
  headerActions?: React.ReactNode;
  className?: string;
}

const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  title,
  content,
  onContentChange,
  headerActions,
  className = '',
}) => {
  return (
    <div className={`workbench-panel editor-panel ${className}`}>
      <div className="panel-title-container">
        <h2 className="panel-title">{title}</h2>
        {headerActions && <div className="panel-header-actions">{headerActions}</div>}
      </div>
      <div className="panel-content editor-content-wrapper">
        <Editor
          initialContent={content}
          onContentChange={onContentChange}
        />
      </div>
    </div>
  );
};

export default React.memo(CodeEditorPanel);