import React from 'react';
import { LuSearch, LuX, LuRotateCcw, LuCirclePlus, LuListChecks, LuEyeOff } from 'react-icons/lu';
import './TableSearch.css';

export interface SuggestionGroup {
    key: string;
    suggestions: string[];
}

export interface TableSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    suggestionGroups: SuggestionGroup[];
    activeFilters: Record<string, Set<string>>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    onHide?: () => void;
    
    onToggleFiltered?: () => void;
    onCreateProblemSet?: () => void;
    selectedCount?: number;
    showActionControls?: boolean;
    isSelectionComplete?: boolean; // [수정] isFilteredAllSelected -> isSelectionComplete
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
    onResetFilters,
    onHide,
    onToggleFiltered,
    onCreateProblemSet,
    selectedCount = 0,
    showActionControls = true,
    isSelectionComplete = false, // [수정]
}) => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchTerm.trim() !== '';

    return (
        <div className="table-search-panel">
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
            
            <div className="filter-actions-container">
                <div className="filter-chips-area">
                    {suggestionGroups.map((group) => (
                        group.suggestions.length > 0 && (
                            <div key={group.key} className="suggestion-group">
                                <div className="suggestion-buttons-wrapper">
                                    {group.suggestions.map((suggestion) => {
                                        const isActive = activeFilters[group.key]?.has(suggestion) ?? false;
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

                {showActionControls && (
                    <div className="action-controls-area">
                        {onCreateProblemSet && (
                             <button
                                type="button"
                                className="control-button primary"
                                onClick={onCreateProblemSet}
                                disabled={selectedCount === 0}
                            >
                                <LuCirclePlus size={16} />
                                <span>문제 출제 ({selectedCount})</span>
                            </button>
                        )}
                       
                        {onToggleFiltered && (
                            <button
                                type="button"
                                className="control-button primary"
                                onClick={onToggleFiltered}
                                // [수정] 비활성화 조건을 새로운 prop으로 변경
                                disabled={isSelectionComplete}
                            >
                                <LuListChecks size={16} />
                                <span>결과 선택</span>
                            </button>
                        )}
                        
                        {onHide && (
                            <button
                                type="button"
                                className="control-button"
                                onClick={onHide}
                            >
                                <LuEyeOff size={16} />
                                <span>검색창 숨기기</span>
                            </button>
                        )}

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
                )}
            </div>
        </div>
    );
};

export default TableSearch;