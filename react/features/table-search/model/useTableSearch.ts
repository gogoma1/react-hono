import { useMemo } from 'react';

type DataItem = Record<string, any>;

interface UseTableSearchOptions {
    data: DataItem[];
    searchTerm: string; 
    activeFilters: Record<string, Set<string>>; // [수정] 타입을 Set<string>으로 변경
    searchableKeys: string[];
}

export function useTableSearch({
    data,
    searchTerm,
    searchableKeys,
    activeFilters,
}: UseTableSearchOptions): DataItem[] {
    
    if (!data) {
        return [];
    }
    
    const filteredData = useMemo(() => {
        let items = [...data];

        // [수정] 필터링 로직을 Set에 값이 포함되어 있는지 확인하도록 변경
        const filterKeys = Object.keys(activeFilters);
        if (filterKeys.length > 0) {
            items = items.filter(item => {
                return filterKeys.every(key => {
                    const filterValues = activeFilters[key]; // Set
                    if (!filterValues || filterValues.size === 0) {
                        return true; 
                    }
                    const itemValue = item[key];
                    return itemValue != null && filterValues.has(String(itemValue));
                });
            });
        }

        const terms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
            items = items.filter(item => {
                const combinedSearchableText = searchableKeys
                    .map(key => item[key])
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                
                return terms.every(term => combinedSearchableText.includes(term));
            });
        }

        return items;
    }, [data, searchTerm, activeFilters, searchableKeys]);

    return filteredData;
}