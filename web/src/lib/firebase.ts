import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCob9MI6byfOSmt5sbnhHHv0kLeTSJHNSI',
  authDomain: 'nhn-medical-center.firebaseapp.com',
  projectId: 'nhn-medical-center',
  storageBucket: 'nhn-medical-center.firebasestorage.app',
  messagingSenderId: '813116836899',
  appId: '1:813116836899:web:fefe8ada7d41292af83596',
  measurementId: 'G-HM5QZ00DWM',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/** Chuyển 09xxx hoặc 0xxx sang +849xxx (E.164) cho Firebase */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84')) return `+${digits}`;
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`;
  return `+84${digits}`;
}
