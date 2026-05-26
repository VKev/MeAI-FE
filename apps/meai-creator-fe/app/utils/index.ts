import type { Role } from '@/contants/type';
import { format } from 'date-fns';

export function normalizeRole(role: string): Role | null {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'admin';
    case 'user':
      return 'user';
    default:
      return null;
  }
}

export function getNavigateByRoles(roles: Role[]) {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('user')) return '/user/onboarding';
  return '/';
}

// Helper: Decode JWT và check expired
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path;
};

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(number);
};

export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss dd/MM/yyyy');
};

export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss');
};

export const formatDateToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'dd-MM-yyyy');
};

export const formatDate = (dateString: string) => {
  // Use date-fns format for consistent server/client rendering
  return format(new Date(dateString), "d MMMM, yyyy 'at' HH:mm");
};

export const setLocalStorageItem = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

export const removeLocalStorageItem = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export const clearLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
};

export const localStorage = {
  setItem: setLocalStorageItem,
  getItem: getLocalStorageItem,
  removeItem: removeLocalStorageItem,
  clear: clearLocalStorage
};

export function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim();
}

export function parseDateOnly(value: string | null | undefined) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function toDateOnlyString(date: Date | undefined) {
  if (!date) return undefined;
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDateOnly(value: string | null | undefined) {
  if (!value) return undefined;
  return value.split('T')[0];
}

export function isAtLeastAge(value: string | undefined, minAge: number) {
  if (!value) return true;
  const date = parseDateOnly(value);
  if (!date) return false;
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  return date <= cutoff;
}
