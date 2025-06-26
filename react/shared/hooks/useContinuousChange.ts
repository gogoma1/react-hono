// ----- ./react/shared/hooks/useContinuousChange.ts -----
import { useRef, useCallback } from 'react';

type Direction = 'increase' | 'decrease';

// 기본값 설정
const INITIAL_INTERVAL = 150; // ms
const MIN_INTERVAL = 20;      // ms
const ACCELERATION = 0.95;    // 95%씩 간격 감소 (조금 더 부드러운 가속)

/**
 * 버튼을 누르고 있을 때 숫자를 연속적으로, 가속도 붙여 변경하는 훅.
 * @param onChange - (updater: (prev: number) => number) 형식의 콜백. 이전 값을 받아 새 값을 반환해야 합니다.
 * @param step - 한 번에 변경될 값의 크기
 */
export function useContinuousChange(onChange: (updater: (prev: number) => number) => void, step: number) {
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentIntervalRef = useRef(INITIAL_INTERVAL);

    const stopChanging = useCallback(() => {
        if (intervalRef.current) {
            cancelAnimationFrame(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const startChanging = useCallback((direction: Direction) => {
        stopChanging();
        currentIntervalRef.current = INITIAL_INTERVAL;

        const change = () => {
            // 가속도 적용된 스텝 계산
            const dynamicStep = direction === 'increase' ? step : -step;
            onChange(prev => parseFloat((prev + dynamicStep * (INITIAL_INTERVAL / currentIntervalRef.current)).toFixed(2)));
            
            // 다음 프레임 요청
            intervalRef.current = requestAnimationFrame(change);
        };
        
        const accelerate = () => {
            currentIntervalRef.current = Math.max(MIN_INTERVAL, currentIntervalRef.current * ACCELERATION);
            timeoutRef.current = setTimeout(accelerate, 50); // 50ms 마다 가속
        };
        
        // 1. 즉시 1회 실행
        onChange(prev => parseFloat((prev + (direction === 'increase' ? step : -step)).toFixed(2)));
        
        // 2. 400ms 후 연속 변경 및 가속 시작
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = requestAnimationFrame(change);
            accelerate();
        }, 400);

    }, [onChange, step, stopChanging]);

    const getHandlers = (direction: Direction) => ({
        onMouseDown: (e: React.MouseEvent) => {
            e.preventDefault();
            startChanging(direction);
        },
        onMouseUp: stopChanging,
        onMouseLeave: stopChanging,
        onTouchStart: (e: React.TouchEvent) => {
            e.preventDefault();
            startChanging(direction);
        },
        onTouchEnd: stopChanging,
    });

    return { getHandlers };
}