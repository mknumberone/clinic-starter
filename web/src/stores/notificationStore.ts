import { create } from 'zustand';

export interface NewAppointmentNotification {
  id: string;
  patientName: string;
  time: string;
  createdAt: number;
}

interface NotificationState {
  newAppointmentNotifications: NewAppointmentNotification[];
  addNewAppointmentNotification: (item: Omit<NewAppointmentNotification, 'createdAt'>) => void;
  clearNewAppointmentNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  newAppointmentNotifications: [],

  addNewAppointmentNotification: (item) =>
    set((state) => ({
      newAppointmentNotifications: [
        { ...item, createdAt: Date.now() },
        ...state.newAppointmentNotifications.slice(0, 49),
      ],
    })),

  clearNewAppointmentNotifications: () => set({ newAppointmentNotifications: [] }),
}));
