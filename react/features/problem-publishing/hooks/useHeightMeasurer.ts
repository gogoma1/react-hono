import { useCallback, useEffect, useRef } from 'react';

/**
 * [수정] ResizeObserver를 사용하여 렌더링된 요소의 높이 변경을 지속적으로 감지하고 보고하는 훅.
 * @param onHeightUpdate 높이가 측정되거나 변경되었을 때 호출될 콜백 함수 (uniqueId, height)
 * @param uniqueId 이 훅 인스턴스가 담당할 요소의 고유 ID
 */
export function useHeightMeasurer(onHeightUpdate: (uniqueId: string, height: number) => void, uniqueId: string) {
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const lastReportedHeightRef = useRef<number | null>(null);

    // setRef는 컴포넌트로부터 DOM 노드를 받아 nodeRef에 저장하는 역할을 합니다.
    const setRef = useCallback((node: HTMLDivElement | null) => {
        nodeRef.current = node;
    }, []);

    useEffect(() => {
        // 관찰할 DOM 요소가 없으면 아무것도 하지 않습니다.
        const element = nodeRef.current;
        if (!element) {
            return;
        }

        // ResizeObserver 인스턴스를 생성합니다.
        // 요소의 크기가 변경될 때마다 이 콜백이 실행됩니다.
        const observer = new ResizeObserver(entries => {
            // 일반적으로 entries 배열에는 하나의 요소만 있습니다.
            for (const entry of entries) {
                // getComputedStyle을 사용해 현재 스타일(margin 포함)을 가져옵니다.
                const styles = window.getComputedStyle(entry.target);
                const marginBottom = parseFloat(styles.marginBottom);
                
                // offsetHeight를 사용해 테두리(border)를 포함한 높이를 가져옵니다.
                // clientHeight는 패딩까지만 포함하므로 offsetHeight가 더 정확합니다.
                const totalHeight = (entry.target as HTMLElement).offsetHeight + (isNaN(marginBottom) ? 0 : marginBottom);

                // 높이가 0보다 크고, 이전에 보고된 높이와 다를 경우에만 콜백을 호출합니다.
                // 이는 불필요한 상태 업데이트를 방지합니다.
                if (totalHeight > 0 && totalHeight !== lastReportedHeightRef.current) {
                    lastReportedHeightRef.current = totalHeight;
                    onHeightUpdate(uniqueId, totalHeight);
                }
            }
        });

        // 요소 관찰을 시작합니다.
        observer.observe(element);

        // 클린업 함수: 컴포넌트가 언마운트될 때 observer 연결을 해제하여 메모리 누수를 방지합니다.
        return () => {
            observer.disconnect();
        };

    }, [uniqueId, onHeightUpdate]); // uniqueId나 콜백 함수가 변경될 때마다 observer를 재설정합니다.

    return setRef;
}