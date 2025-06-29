import React, { useState, useMemo } from 'react';
import { useUIStore, type ProblemPublishingColumnKey } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions';
import { LuEye, LuEyeOff, LuGripVertical } from 'react-icons/lu';
import './TableColumnToggler.css';

const TableColumnToggler: React.FC = () => {
  const {
    columnVisibility,
    toggleColumnVisibility,
    problemPublishingColumnOrder,
    setProblemPublishingColumnOrder,
  } = useUIStore();
  
  const { permittedColumnsConfig } = useColumnPermissions();

  const columnConfigMap = useMemo(() =>
    new Map(permittedColumnsConfig.map(c => [c.key, c]))
  , [permittedColumnsConfig]);

  // [수정] 상태의 타입을 구체적인 타입으로 변경합니다.
  const [draggedKey, setDraggedKey] = useState<ProblemPublishingColumnKey | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, key: ProblemPublishingColumnKey) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    setTimeout(() => {
      setDraggedKey(key);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetKey: ProblemPublishingColumnKey) => {
    e.preventDefault();
    // [수정] dataTransfer에서 가져온 값을 구체적인 타입으로 캐스팅합니다.
    const sourceKey = e.dataTransfer.getData('text/plain') as ProblemPublishingColumnKey;
    setDraggedKey(null);

    if (sourceKey && sourceKey !== targetKey) {
        const sourceIndex = problemPublishingColumnOrder.indexOf(sourceKey);
        const targetIndex = problemPublishingColumnOrder.indexOf(targetKey);

        // [수정] 새로 만드는 배열의 타입을 명시적으로 지정합니다.
        const newOrder: ProblemPublishingColumnKey[] = Array.from(problemPublishingColumnOrder);
        const [removed] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, removed);
        
        setProblemPublishingColumnOrder(newOrder);
    }
  };

  return (
    <div className="column-toggler-panel">
      <h4 className="toggler-title">테이블 컬럼 설정</h4>
      <p className="toggler-description">핸들을 드래그하여 순서를 변경하세요.</p>
      <div className="toggler-list">
        {problemPublishingColumnOrder.map((key) => {
          const config = columnConfigMap.get(key);
          if (!config) return null;

          const isVisible = columnVisibility[key] ?? !config.defaultHidden;
          const isDragging = draggedKey === key;
          
          return (
            <button
              key={key}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, key)}
              onDragEnd={handleDragEnd}
              className={`toggler-button ${isVisible ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
              onClick={() => toggleColumnVisibility(key)}
              aria-pressed={isVisible}
            >
              <LuGripVertical className="drag-handle" size={16} />
              <span className="button-label">{config.label}</span>
              {isVisible ? (
                <LuEye size={16} className="button-icon" />
              ) : (
                <LuEyeOff size={16} className="button-icon" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableColumnToggler;