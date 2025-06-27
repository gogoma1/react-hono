import React from 'react';
import { LuSearch, LuX, LuRotateCcw, LuCirclePlus, LuListChecks, LuListX, LuEyeOff } from 'react-icons/lu'; // LuEyeOff 추가
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
    onHide?: () => void; // [추가]
    
    onToggleFiltered?: () => void;
    onCreateProblemSet?: () => void;
    selectedCount?: number;
    showActionControls?: boolean;
    isFilteredAllSelected?: boolean;
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
    onResetFilters,
    onHide, // [추가]
    onToggleFiltered,
    onCreateProblemSet,
    selectedCount = 0,
    showActionControls = true,
    isFilteredAllSelected = false,
}) => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0;
    const hasSuggestions = suggestionGroups.some(g => g.suggestions.length > 0);

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
                    {hasSuggestions && suggestionGroups.map((group) => (
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
                        {/* 1. 문제 출제 또는 결과 선택 버튼 */}
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
                                className="control-button primary" /* [수정] primary 클래스 추가 */
                                onClick={onToggleFiltered}
                            >
                                {isFilteredAllSelected ? <LuListX size={16} /> : <LuListChecks size={16} />}
                                <span>{isFilteredAllSelected ? '선택 해제' : '결과 선택'}</span>
                            </button>
                        )}
                        
                        {/* 2. 검색창 숨기기 버튼 */}
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

                        {/* 3. 초기화 버튼 */}
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