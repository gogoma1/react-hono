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
    // [핵심 수정] title의 타입을 string에서 React.ReactNode로 변경합니다.
    title: React.ReactNode; 
    children: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    confirmLoadingText?: string;
    isConfirmDestructive?: boolean;
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
    confirmLoadingText = '처리 중...',
    isConfirmDestructive = false,
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

    const confirmButtonClassName = `primary ${isConfirmDestructive ? 'destructive' : ''}`.trim();

    const modalContent = (
        <div className="modal-backdrop" onClick={onClose}>
            <div className={`modal-content-wrapper ${size}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    {/* [수정] h3 태그로 감싸지 않고, 전달받은 title을 그대로 렌더링합니다. */}
                    {typeof title === 'string' ? (
                        <h3 className="modal-title">{title}</h3>
                    ) : (
                        title // title이 JSX 요소(버튼 등)일 경우 그대로 렌더링
                    )}
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
                                loadingText={confirmLoadingText}
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