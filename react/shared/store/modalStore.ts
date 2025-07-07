import { create } from 'zustand';

interface ModalState {
  isAccountSettingsOpen: boolean;
  openAccountSettings: () => void;
  closeAccountSettings: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isAccountSettingsOpen: false,
  openAccountSettings: () => set({ isAccountSettingsOpen: true }),
  closeAccountSettings: () => set({ isAccountSettingsOpen: false }),
}));