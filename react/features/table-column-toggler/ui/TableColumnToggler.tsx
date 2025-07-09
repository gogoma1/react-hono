import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useColumnSettingsStore } from '../../../shared/store/columnSettingsStore';
import { useColumnPermissions, STUDENT_DASHBOARD_COLUMN_CONFIG, PROBLEM_PUBLISHING_COLUMN_CONFIG } from '../../../shared/hooks/useColumnPermissions';
import { LuEye, LuEyeOff, LuGripVertical } from 'react-icons/lu';
import './TableColumnToggler.css';

const TableColumnToggler: React.FC = () => {
    const { visibility, toggleVisibility, order, setOrder, initializeOrder } = useColumnSettingsStore();
    const { permittedColumnKeys } = useColumnPermissions();
    const location = useLocation();

    // 현재 페이지 경로에 따라 사용할 상태 키와 설정 원본을 결정합니다.
    const { pageKey, pageConfig } = useMemo(() => {
        if (location.pathname.startsWith('/problem-publishing')) {
            return { pageKey: 'problemPublishing' as const, pageConfig: PROBLEM_PUBLISHING_COLUMN_CONFIG };
        }
        if (location.pathname.startsWith('/dashboard')) {
            return { pageKey: 'studentDashboard' as const, pageConfig: STUDENT_DASHBOARD_COLUMN_CONFIG };
        }
        return { pageKey: null, pageConfig: [] };
    }, [location.pathname]);

    // 페이지가 변경될 때마다 로컬 스토리지에서 복원된 순서와 최신 설정을 동기화합니다.
    useEffect(() => {
        if (pageKey) {
            initializeOrder(pageKey, pageConfig);
        }
    }, [pageKey, pageConfig, initializeOrder]);

    const currentColumnOrder = pageKey ? order[pageKey] : [];
    
    const columnConfigMap = useMemo(() =>
      new Map(pageConfig.map(c => [c.key, c]))
    , [pageConfig]);

    const [draggedKey, setDraggedKey] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, key: string) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', key);
        setTimeout(() => setDraggedKey(key), 0);
    };

    const handleDragEnd = () => setDraggedKey(null);
  
    const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetKey: string) => {
        e.preventDefault();
        const sourceKey = e.dataTransfer.getData('text/plain');
        setDraggedKey(null);

        if (pageKey && sourceKey && sourceKey !== targetKey) {
            const sourceIndex = currentColumnOrder.indexOf(sourceKey as any);
            const targetIndex = currentColumnOrder.indexOf(targetKey as any);

            const newOrder = Array.from(currentColumnOrder);
            const [removed] = newOrder.splice(sourceIndex, 1);
            newOrder.splice(targetIndex, 0, removed);
            
            setOrder(pageKey, newOrder);
        }
    };

    if (!pageKey) {
        return (
            <div className="column-toggler-panel">
                <h4 className="toggler-title">알림</h4>
                <p className="toggler-description">이 페이지에는 컬럼 설정이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="column-toggler-panel">
            <h4 className="toggler-title">테이블 컬럼 설정</h4>
            <p className="toggler-description">핸들을 드래그하여 순서를 변경하세요.</p>
            <div className="toggler-list">
                {currentColumnOrder.map((key) => {
                    const config = columnConfigMap.get(key as any);
                    // 권한이 없는 컬럼은 설정 목록에 표시하지 않습니다.
                    if (!config || !permittedColumnKeys.has(key as any)) return null;

                    const isVisible = visibility[key] ?? !config.defaultHidden;
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
                            onClick={() => toggleVisibility(key)}
                            aria-pressed={isVisible}
                        >
                            <LuGripVertical className="drag-handle" size={16} />
                            <span className="button-label">{config.label}</span>
                            {isVisible ? <LuEye size={16} className="button-icon" /> : <LuEyeOff size={16} className="button-icon" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TableColumnToggler;