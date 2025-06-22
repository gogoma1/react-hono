import React from 'react';
import { LuSearch, LuX, LuRotateCcw } from 'react-icons/lu';
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
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
    onResetFilters,
}) => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0;

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
            {suggestionGroups.map((group, index) => (
                group.suggestions.length > 0 && (
                    <div key={group.key} className={`suggestion-group ${index === 2 ? 'with-reset' : ''}`}>
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
                        {/* [추가] 세 번째 줄(index 2)에 초기화 버튼 추가 */}
                        {index === 2 && (
                             <button 
                                type="button" 
                                className="reset-filters-button"
                                onClick={onResetFilters}
                                disabled={!hasActiveFilters}
                                title="필터 초기화"
                            >
                                <LuRotateCcw size={16} />
                                <span>초기화</span>
                            </button>
                        )}
                    </div>
                )
            ))}
        </div>
    );
};

export default TableSearch;