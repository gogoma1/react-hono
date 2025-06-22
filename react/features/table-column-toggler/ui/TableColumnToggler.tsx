// ./react/features/table-column-toggler/ui/TableColumnToggler.tsx
import React from 'react';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions'; // [수정] 신규 훅 import
import { LuEye, LuEyeOff } from 'react-icons/lu';
import './TableColumnToggler.css';

// [삭제] 하드코딩된 컬럼 목록 제거
// const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [ ... ];

const TableColumnToggler: React.FC = () => {
  const { columnVisibility, toggleColumnVisibility } = useUIStore();
  // [수정] 권한 훅을 사용하여 렌더링할 컬럼 목록을 가져옴
  const { permittedColumnsConfig } = useColumnPermissions();

  return (
    <div className="column-toggler-panel">
      <h4 className="toggler-title">테이블 컬럼 설정</h4>
      <div className="toggler-list">
        {/* [수정] permittedColumnsConfig를 순회하여 버튼 생성 */}
        {permittedColumnsConfig.map((col) => {
          const isVisible = columnVisibility[col.key] ?? true;
          return (
            <button
              key={col.key}
              type="button"
              className={`toggler-button ${isVisible ? 'active' : ''}`}
              onClick={() => toggleColumnVisibility(col.key)}
              aria-pressed={isVisible}
            >
              <span className="button-label">{col.label}</span>
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