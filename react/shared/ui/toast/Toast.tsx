import React, { useEffect, useState } from 'react';
import { LuCircleCheck, LuCircleAlert, LuInfo, LuX, LuTriangleAlert } from 'react-icons/lu';
import type { ToastMessage, ToastType } from '../../store/toastStore';
import './Toast.css';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
  duration?: number;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <LuCircleCheck />,
  error: <LuCircleAlert />,
  info: <LuInfo />,
  warning: <LuTriangleAlert />,
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove, duration = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      const removeTimer = setTimeout(() => onRemove(toast.id), 400); // 애니메이션 시간
      return () => clearTimeout(removeTimer);
    }, duration);

    return () => clearTimeout(exitTimer);
  }, [toast.id, duration, onRemove]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 400);
  };

  const toastClassName = `toast-item ${toast.type} ${isExiting ? 'exit' : ''}`;

  return (
    <div className={toastClassName} role="alert" aria-live="assertive">
      <div className="toast-icon">{toastIcons[toast.type]}</div>
      <p className="toast-message">{toast.message}</p>
      <button className="toast-close-button" onClick={handleRemove} aria-label="알림 닫기">
        <LuX size={18} />
      </button>
    </div>
  );
};

export default Toast;