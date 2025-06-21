import React from 'react';
import { LuSearch, LuX } from 'react-icons/lu';
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
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
}) => {
    // ===== [핵심] 최상위 div가 바로 'table-search-panel'이 되도록 구조 단순화 =====
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
            {suggestionGroups.map((group) => (
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
    );
};

export default TableSearch;