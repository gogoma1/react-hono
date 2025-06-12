// react-hono/react/shared/ui/glasstable/GlassTable.tsx

import React from 'react';
import './GlassTable.css';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu'; // 정렬 아이콘 추가

// 정렬 상태 타입을 정의합니다.
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  width?: string;
  isSortable?: boolean; // 정렬 가능한 컬럼인지 여부 추가
}

interface GlassTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortConfig?: SortConfig | null; // 현재 정렬 상태 prop 추가
  onSort?: (key: string) => void; // 헤더 클릭 시 호출될 함수 prop 추가
}

const GlassTable = <T extends object>({
  columns,
  data,
  caption,
  isLoading = false,
  emptyMessage = "표시할 데이터가 없습니다.",
  sortConfig, // props 받기
  onSort,     // props 받기
}: GlassTableProps<T>) => {

  const renderSortArrow = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null; // 정렬되지 않은 컬럼은 아이콘 없음
    }
    return sortConfig.direction === 'asc' 
      ? <LuArrowUp className="sort-arrow" /> 
      : <LuArrowDown className="sort-arrow" />;
  };

  return (
    <div className="glass-table-wrapper">
      <div className="glass-table-scroll-container">
        <table className="glass-table">
          {caption && <caption className="glass-table-caption">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ width: col.width }} className={col.isSortable ? 'sortable' : ''}>
                  {col.isSortable && onSort ? (
                    <button type="button" onClick={() => onSort(String(col.key))} className="sort-header-button">
                      {col.header}
                      {renderSortArrow(String(col.key))}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="loading-cell">
                  <div className="spinner"></div>
                  <span>데이터를 불러오는 중...</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {columns.map((col) => (
                    <td key={`cell-${rowIndex}-${String(col.key)}`}>
                      {col.render
                        ? col.render(item)
                        : String(item[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlassTable;