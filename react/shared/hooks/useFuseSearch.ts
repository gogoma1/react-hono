// react/shared/hooks/useFuseSearch.ts

// [핵심 수정 1] Fuse는 default로, IFuseOptions 타입은 named로 명확하게 import 합니다.
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useMemo } from 'react';

/**
 * Fuse.js를 사용하여 퍼지 검색을 수행하는 재사용 가능한 커스텀 훅.
 * 검색 대상 리스트, 검색어, Fuse.js 옵션을 받아 필터링된 결과를 반환합니다.
 *
 * @template T - 검색할 데이터 아이템의 타입.
 * @param list - 검색 대상이 되는 전체 데이터 배열.
 * @param searchTerm - 사용자가 입력한 검색어.
 * @param fuseOptions - Fuse.js에 전달할 설정 객체.
 * @returns 필터링된 데이터 아이템의 배열.
 */
export function useFuseSearch<T>(
    list: T[],
    searchTerm: string,
    // [핵심 수정 2] 'Fuse.' 네임스페이스 없이 IFuseOptions 타입을 직접 사용합니다.
    fuseOptions: IFuseOptions<T>
): T[] {
    const fuse = useMemo(() => {
        // 이제 'Fuse'는 클래스 생성자로 명확하게 인식됩니다.
        return new Fuse(list, fuseOptions);
    }, [list, fuseOptions]);

    const results = useMemo(() => {
        if (!searchTerm.trim()) {
            return list;
        }
        return fuse.search(searchTerm).map(result => result.item);
    }, [fuse, searchTerm, list]);

    return results;
}