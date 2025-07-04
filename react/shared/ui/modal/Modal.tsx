import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { LuX } from 'react-icons/lu';
import ActionButton from '../actionbutton/ActionButton';
import LoadingButton from '../loadingbutton/LoadingButton';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    confirmLoadingText?: string; // [신규] 확인 버튼 로딩 텍스트
    isConfirmDestructive?: boolean; // [신규] 확인 버튼이 파괴적 액션인지 여부
    hideFooter?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = '확인',
    cancelText = '취소',
    isConfirming = false,
    confirmLoadingText = '처리 중...', // [신규]
    isConfirmDestructive = false,   // [신규]
    hideFooter = false,
    size = 'medium'
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    // [핵심] 확인 버튼의 클래스를 동적으로 결정
    const confirmButtonClassName = `primary ${isConfirmDestructive ? 'destructive' : ''}`.trim();

    const modalContent = (
        <div className="modal-backdrop" onClick={onClose}>
            <div className={`modal-content-wrapper ${size}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-button" onClick={onClose} aria-label="닫기">
                        <LuX size={22} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {!hideFooter && (
                    <div className="modal-footer">
                        <ActionButton onClick={onClose} disabled={isConfirming}>
                            {cancelText}
                        </ActionButton>
                        {onConfirm && (
                            <LoadingButton
                                onClick={onConfirm}
                                isLoading={isConfirming}
                                className={confirmButtonClassName}
                                loadingText={confirmLoadingText} // [수정] prop 사용
                            >
                                {confirmText}
                            </LoadingButton>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;