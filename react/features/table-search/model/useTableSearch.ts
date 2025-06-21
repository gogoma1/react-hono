// ./react/features/table-search/model/useTableSearch.ts

import { useMemo } from 'react';

type DataItem = Record<string, any>;

interface UseTableSearchOptions {
    data: DataItem[];
    searchTerm: string; 
    searchableKeys: string[];
    activeFilters: Record<string, string>; 
}

export function useTableSearch({
    data,
    searchTerm,
    searchableKeys,
    activeFilters,
}: UseTableSearchOptions): DataItem[] {
    
    // [핵심 수정] 데이터가 아직 없을 경우, 오류를 발생시키는 대신 빈 배열을 반환합니다.
    if (!data) {
        return [];
    }
    
    const filteredData = useMemo(() => {
        let items = [...data]; // 이제 data는 항상 배열이므로 이 코드는 안전합니다.

        // 카테고리 필터링
        const filterKeys = Object.keys(activeFilters);
        if (filterKeys.length > 0) {
            items = items.filter(item => {
                return filterKeys.every(key => {
                    return item[key] != null && String(item[key]) === String(activeFilters[key]);
                });
            });
        }

        // 텍스트 검색 필터링
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