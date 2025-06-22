import { useRef, useState, useCallback, useEffect } from 'react';

export function useDragToScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);

    const dragStartInfo = useRef({
        startX: 0,
        scrollLeft: 0,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) return;

        if (e.target.closest('button, a, input, [role="button"], [role="checkbox"]')) {
            return;
        }

        if (!ref.current || e.button !== 0) return;
        
        e.preventDefault(); 

        isDraggingRef.current = true;
        setIsDragging(true);

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
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseleave', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return { ref, onMouseDown: handleMouseDown, isDragging };
}