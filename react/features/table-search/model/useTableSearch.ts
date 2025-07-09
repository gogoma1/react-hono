import { useMemo } from 'react';

type DataItem = Record<string, any>;

interface UseTableSearchOptions {
    data: DataItem[];
    searchTerm: string; 
    activeFilters: Record<string, Set<string>>;
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

        const filterKeys = Object.keys(activeFilters);
        if (filterKeys.length > 0) {
            items = items.filter(item => {
                return filterKeys.every(key => {
                    const filterValues = activeFilters[key];
                    if (!filterValues || filterValues.size === 0) {
                        return true; 
                    }
                    const itemValue = item[key];
                    if (itemValue == null) return false;

                    // [핵심 수정] 'teacher' 필터링 로직 변경
                    if (key === 'teacher') {
                        // 선택된 필터 값 중 하나라도 itemValue에 포함되면 true
                        return Array.from(filterValues).some(filterValue => 
                            String(itemValue).includes(filterValue)
                        );
                    } else {
                        // 나머지 필드는 기존 로직(정확히 일치) 유지
                        return filterValues.has(String(itemValue));
                    }
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