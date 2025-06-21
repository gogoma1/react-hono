import React from 'react';
import { useUIStore } from '../../../shared/store/uiStore';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import './TableColumnToggler.css';

// 토글 가능한 컬럼 목록 정의
const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'grade', label: '학년' },
  { key: 'subject', label: '과목' },
  { key: 'status', label: '상태' },
  { key: 'teacher', label: '담당 강사' },
  { key: 'student_phone', label: '학생 연락처' },
  { key: 'guardian_phone', label: '학부모 연락처' },
  { key: 'school_name', label: '학교명' },
  { key: 'tuition', label: '수강료' },
  { key: 'admission_date', label: '입원일' },
  { key: 'discharge_date', label: '퇴원일' },
];

const TableColumnToggler: React.FC = () => {
  const { columnVisibility, toggleColumnVisibility } = useUIStore();

  return (
    <div className="column-toggler-panel">
      <h4 className="toggler-title">테이블 컬럼 설정</h4>
      <div className="toggler-list">
        {TOGGLEABLE_COLUMNS.map((col) => {
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