import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastMessage[];
}

interface ToastActions {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastState & ToastActions>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const newToast: ToastMessage = {
      id: nanoid(),
      message,
      type,
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

// 사용 편의성을 위한 커스텀 훅
export const useToast = () => {
  const { addToast } = useToastStore.getState();

  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning'),
  };
};

export default useToastStore;