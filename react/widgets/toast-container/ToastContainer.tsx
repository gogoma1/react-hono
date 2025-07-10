import React from 'react';
import useToastStore from '../../shared/store/toastStore';
import Toast from '../../shared/ui/toast/Toast';
import '../../shared/ui/toast/Toast.css';

const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const { removeToast } = useToastStore.getState();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;