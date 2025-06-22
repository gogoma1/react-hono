// ./react/features/table-search/ui/TableSearch.tsx
import React from 'react';
import { LuSearch, LuX, LuRotateCcw, LuCirclePlus, LuListChecks } from 'react-icons/lu';
import './TableSearch.css';

export interface SuggestionGroup {
    key: string;
    suggestions: string[];
}

export interface TableSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    suggestionGroups: SuggestionGroup[];
    activeFilters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    onToggleFiltered: () => void;
    onCreateProblemSet: () => void;
    selectedCount: number;
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
    onResetFilters,
    onToggleFiltered,
    onCreateProblemSet,
    selectedCount,
}) => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0;
    const hasSuggestions = suggestionGroups.some(g => g.suggestions.length > 0);

    return (
        <div className="table-search-panel">
            {/* 검색 입력창 */}
            <div className="search-input-wrapper">
                <LuSearch className="search-input-icon" size={20} />
                <input
                    type="text"
                    placeholder="검색어를 입력하세요 (예: 고1 수학)"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>
            
            {/* [수정] 필터 및 액션 버튼들을 포함하는 새로운 메인 그룹 */}
            <div className="filter-actions-container">
                {/* 왼쪽: 필터 칩 영역 */}
                <div className="filter-chips-area">
                    {hasSuggestions && suggestionGroups.map((group) => (
                        group.suggestions.length > 0 && (
                            <div key={group.key} className="suggestion-group">
                                <div className="suggestion-buttons-wrapper">
                                    {group.suggestions.map((suggestion) => {
                                        const isActive = activeFilters[group.key] === suggestion;
                                        return (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                className={`suggestion-chip ${isActive ? 'active' : ''}`}
                                                onClick={() => onFilterChange(group.key, suggestion)}
                                            >
                                                {suggestion}
                                                {isActive && <LuX size={14} className="suggestion-chip-clear" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* 오른쪽: 액션 버튼 컨트롤 영역 */}
                <div className="action-controls-area">
                    <button
                        type="button"
                        className="control-button primary"
                        onClick={onCreateProblemSet}
                        disabled={selectedCount === 0}
                    >
                        <LuCirclePlus size={16} />
                        <span>문제 출제 ({selectedCount})</span>
                    </button>
                    <button
                        type="button"
                        className="control-button"
                        onClick={onToggleFiltered}
                    >
                        <LuListChecks size={16} />
                        <span>결과 선택</span>
                    </button>
                    <button 
                        type="button" 
                        className="control-button"
                        onClick={onResetFilters}
                        disabled={!hasActiveFilters}
                        title="필터 초기화"
                    >
                        <LuRotateCcw size={16} />
                        <span>초기화</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableSearch;