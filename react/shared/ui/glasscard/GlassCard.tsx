import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { LuX } from 'react-icons/lu';
import ActionButton from '../actionbutton/ActionButton';
import LoadingButton from '../loadingbutton/LoadingButton';
import './GlassCard.css';

interface GlassCardProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    onConfirm?: () => void;
    confirmText?: string;
    isConfirming?: boolean;
    confirmLoadingText?: string;
    hideFooter?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    onConfirm,
    confirmText = '확인',
    isConfirming = false,
    confirmLoadingText = '처리 중...',
    hideFooter = false,
}) => {
    const [isRendered, setIsRendered] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            document.body.style.overflow = 'hidden';
        } else {
            // 애니메이션 종료 후 컴포넌트 언마운트
            const timer = setTimeout(() => {
                setIsRendered(false);
                document.body.style.overflow = '';
            }, 300); // CSS 애니메이션 시간과 일치
            return () => clearTimeout(timer);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isRendered) {
        return null;
    }
    
    const overlayClassName = `glasscard-overlay ${!isOpen ? 'exit' : ''}`;

      const modalContent = (
        <div className={overlayClassName} onClick={onClose}>
            <div className={`glasscard-container size-${size}`} onClick={e => e.stopPropagation()}>
                <header className="glasscard-header">
                    <h2 className="glasscard-title">{title}</h2>
                    <button className="glasscard-close-button" onClick={onClose} aria-label="닫기">
                        <LuX size={22} />
                    </button>
                </header>
                <main className="glasscard-body">
                    {children}
                </main>
                {/* [수정] hideFooter 조건문 위치 변경 */}
                {!hideFooter && (
                    <footer className="glasscard-footer">
                        <ActionButton onClick={onClose} disabled={isConfirming}>
                            취소
                        </ActionButton>
                        {onConfirm && (
                            <LoadingButton
                                onClick={onConfirm}
                                isLoading={isConfirming}
                                className="primary"
                                loadingText={confirmLoadingText}
                            >
                                {confirmText}
                            </LoadingButton>
                        )}
                    </footer>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default GlassCard;