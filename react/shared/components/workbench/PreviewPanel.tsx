import React from 'react';
import MathpixRenderer from '../../ui/MathpixRenderer';
import './PreviewPanel.css';

interface PreviewPanelProps {
  title: string;
  content: string;
  className?: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  content,
  className = '',
}) => {
  return (
    <div className={`workbench-panel preview-panel ${className}`}>
      <div className="panel-title-container">
        <h2 className="panel-title">{title}</h2>
      </div>
      <div className="panel-content preview-content-wrapper prose">
        <MathpixRenderer text={content} />
      </div>
    </div>
  );
};

export default React.memo(PreviewPanel);