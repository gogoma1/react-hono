import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * 클릭-앤-드래그로 요소를 스크롤하는 기능을 제공하는 커스텀 훅.
 * @returns ref: 스크롤 대상 요소에 부착할 ref.
 * @returns onMouseDown: 요소의 onMouseDown 이벤트에 연결할 핸들러.
 * @returns isDragging: 현재 드래그 중인지 여부를 나타내는 boolean 값.
 */
export function useDragToScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isDragging, setIsDragging] = useState(false);

    // [수정] isDragging 상태를 ref로도 관리하여 불필요한 이벤트 리스너 재등록 방지
    const isDraggingRef = useRef(false);

    const dragStartInfo = useRef({
        startX: 0,
        scrollLeft: 0,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // [수정] 왼쪽 마우스 버튼이 아닐 경우, 또는 ref가 없으면 즉시 종료
        if (!ref.current || e.button !== 0) return;
        
        // [추가] 버튼이나 링크 같은 상호작용 가능한 요소 위에서는 드래그를 시작하지 않음
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, [role="button"], [role="checkbox"]')) {
            return;
        }

        e.preventDefault(); // 텍스트 선택 등 기본 동작 방지

        isDraggingRef.current = true; // ref 상태 업데이트
        setIsDragging(true);          // state 업데이트 (CSS 클래스 적용용)

        dragStartInfo.current = {
            startX: e.pageX - ref.current.offsetLeft,
            scrollLeft: ref.current.scrollLeft,
        };
    }, []);

    const handleMouseUp = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !ref.current) return;
        e.preventDefault();

        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - dragStartInfo.current.startX);
        ref.current.scrollLeft = dragStartInfo.current.scrollLeft - walk;
    }, []);

    useEffect(() => {
        // [수정] mousemove와 mouseup 이벤트를 window에 한 번만 등록하고, ref를 통해 상태를 제어
        const currentRef = ref.current;
        if (currentRef) {
            // 마우스가 스크롤 영역 밖으로 나가도 드래그가 유지되도록 window에 이벤트 리스너 추가
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mouseleave', handleMouseUp); // [추가] 창 밖으로 나가도 드래그 종료

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('mouseleave', handleMouseUp);
            };
        }
    }, [handleMouseMove, handleMouseUp]);

    // [수정] isDragging 상태는 외부에서 클래스 적용 등을 위해 그대로 반환
    return { ref, onMouseDown: handleMouseDown, isDragging };
}