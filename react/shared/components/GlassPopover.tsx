import React, { useEffect, useRef, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './GlassPopover.css'; // Popover 스타일을 위한 CSS 파일

interface GlassPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null; // Popover가 기준으로 할 HTML 요소
    children: ReactNode; // Popover 내부에 표시될 콘텐츠
    placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start'; // 위치 (간단하게 몇 가지만)
    offsetY?: number; // 세로 간격
    offsetX?: number; // 가로 간격
}

const GlassPopover: React.FC<GlassPopoverProps> = ({
    isOpen,
    onClose,
    anchorEl,
    children,
    placement = 'bottom-end',
    offsetY = 8,
    offsetX = 0,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 Popover 닫기
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                anchorEl && // 앵커 요소가 있고
                !anchorEl.contains(event.target as Node) // 앵커 요소 클릭이 아닌 경우
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorEl]);

    // Popover 위치 계산 (간단한 버전)
    const getPopoverStyle = (): React.CSSProperties => {
        if (!anchorEl || !popoverRef.current) {
            return { visibility: 'hidden', opacity: 0 };
        }

        const anchorRect = anchorEl.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
            case 'bottom-end':
                top = anchorRect.bottom + offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
                break;
            case 'bottom-start':
                top = anchorRect.bottom + offsetY;
                left = anchorRect.left + offsetX;
                break;
            case 'top-end':
                top = anchorRect.top - popoverRect.height - offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
                break;
            case 'top-start':
                top = anchorRect.top - popoverRect.height - offsetY;
                left = anchorRect.left + offsetX;
                break;
            default: // bottom-end as default
                top = anchorRect.bottom + offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
        }

        // 화면 경계를 벗어나는 경우 간단히 조정 (더 정교한 로직 필요)
        if (left + popoverRect.width > window.innerWidth - 10) { // 오른쪽 경계
            left = window.innerWidth - popoverRect.width - 10;
        }
        if (left < 10) { // 왼쪽 경계
            left = 10;
        }
        if (top + popoverRect.height > window.innerHeight - 10) { // 아래쪽 경계
            top = anchorRect.top - popoverRect.height - offsetY; // 위로 변경
        }
        if (top < 10) { // 위쪽 경계
            top = 10;
        }


        return {
            position: 'fixed', // fixed 포지션 사용
            top: `${top}px`,
            left: `${left}px`,
            visibility: isOpen ? 'visible' : 'hidden',
            opacity: isOpen ? 1 : 0,
        };
    };

    // Portal을 사용하여 body에 렌더링
    if (typeof document === 'undefined') {
        return null; // SSR 환경에서는 렌더링하지 않음
    }

    return ReactDOM.createPortal(
        <div
            ref={popoverRef}
            className={`glass-popover ${isOpen ? 'open' : ''}`}
            style={getPopoverStyle()}
            role="dialog" // 접근성을 위해 역할 명시
            aria-modal="false" // 모달이 아님을 명시
            aria-hidden={!isOpen}
        >
            {children}
        </div>,
        document.body
    );
};

export default GlassPopover;