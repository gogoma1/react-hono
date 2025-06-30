// ./react/features/problem-publishing/hooks/useHeightMeasurer.ts
import { useCallback, useEffect, useRef } from 'react';

/**
 * ResizeObserver를 사용하여 렌더링된 요소의 높이 변경을 지속적으로 감지하고 보고하는 훅.
 */
export function useHeightMeasurer(onHeightUpdate: (uniqueId: string, height: number) => void, uniqueId: string) {
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const lastReportedHeightRef = useRef<number | null>(null);

    const setRef = useCallback((node: HTMLDivElement | null) => {
        nodeRef.current = node;
    }, []);

    useEffect(() => {
        const element = nodeRef.current;
        if (!element) {
            return;
        }

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const styles = window.getComputedStyle(entry.target);
                const marginBottom = parseFloat(styles.marginBottom);
                
                const totalHeight = (entry.target as HTMLElement).offsetHeight + (isNaN(marginBottom) ? 0 : marginBottom);

                if (totalHeight > 0 && totalHeight !== lastReportedHeightRef.current) {
                    lastReportedHeightRef.current = totalHeight;
                    onHeightUpdate(uniqueId, totalHeight);
                }
            }
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };

    }, [uniqueId, onHeightUpdate]);

    return setRef;
}