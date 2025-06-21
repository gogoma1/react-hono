import React, { forwardRef } from 'react';
import './GlassTable.css';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  width?: string;
  isSortable?: boolean;
  className?: string;
  dataLabel?: string; // [추가] 모바일 뷰에서 사용할 데이터 레이블
}

interface GlassTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
}

function GlassTableInner<T extends object>(
  {
    columns,
    data,
    caption,
    isLoading = false,
    emptyMessage = "표시할 데이터가 없습니다.",
    sortConfig,
    onSort,
    scrollContainerProps,
  }: GlassTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {

  const renderSortArrow = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' 
      ? <LuArrowUp className="sort-arrow" /> 
      : <LuArrowDown className="sort-arrow" />;
  };

  return (
    <div className="glass-table-wrapper">
      <div
        ref={ref}
        {...scrollContainerProps}
        className={`glass-table-scroll-container ${scrollContainerProps?.className || ''}`.trim()}
      >
        <table className="glass-table">
          {caption && <caption className="glass-table-caption">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`${col.isSortable ? 'sortable' : ''} ${col.className || ''}`.trim()}
                >
                  <div className="cell-content">
                    {col.isSortable && onSort ? (
                      <button type="button" onClick={() => onSort(String(col.key))} className="sort-header-button">
                        {col.header}
                        {renderSortArrow(String(col.key))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length} className="loading-cell"><div className="spinner"></div><span>데이터를 불러오는 중...</span></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-cell">{emptyMessage}</td></tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {columns.map((col) => (
                    // [수정] data-label 속성을 td에 추가합니다.
                    <td 
                      key={`cell-${rowIndex}-${String(col.key)}`} 
                      className={col.className || ''}
                      data-label={col.dataLabel} 
                    >
                      <div className="cell-content">
                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                      </div>
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
}

const GlassTable = forwardRef(GlassTableInner) as <T extends object>(
  props: GlassTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;


export default GlassTable;