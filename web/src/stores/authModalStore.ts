import { create } from 'zustand';

interface AuthModalState {
    isOpen: boolean;
    view: 'login' | 'register';
    openLogin: () => void;
    openRegister: () => void;
    closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
    isOpen: false,
    view: 'login', // Mặc định là tab đăng nhập
    openLogin: () => set({ isOpen: true, view: 'login' }),
    openRegister: () => set({ isOpen: true, view: 'register' }),
    closeModal: () => set({ isOpen: false }),
}));