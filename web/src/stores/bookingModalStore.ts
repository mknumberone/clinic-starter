import { create } from 'zustand';

interface BookingModalState {
    isOpen: boolean;
    openBooking: () => void;
    closeBooking: () => void;
}

export const useBookingModalStore = create<BookingModalState>((set) => ({
    isOpen: false,
    openBooking: () => set({ isOpen: true }),
    closeBooking: () => set({ isOpen: false }),
}));