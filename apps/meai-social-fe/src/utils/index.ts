import { differenceInDays, differenceInHours, format } from 'date-fns';

export const setLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getLocalStorage = (key: string) => {
  const value = localStorage.getItem(key);
  if (value) return JSON.parse(value);
  return null;
};

export const removeLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
};

export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(
    date instanceof Date ? date : new Date(date),
    "HH:mm:ss dd/MM/yyyy"
  );
};

export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), "HH:mm:ss");
};

export const formatDateToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), "dd-MM-yyyy");
};

export const formatDate = (dateString: string) => {
  // Use date-fns format for consistent server/client rendering
  return format(new Date(dateString), "d MMMM, yyyy 'at' HH:mm");
};

export const formatRelativeTime = (dateString?: string | null) => {
  if (!dateString) return '';

  const now = new Date();
  const target = new Date(dateString);
  const hours = differenceInHours(now, target);
  const minutes = Math.floor((now.getTime() - target.getTime()) / (1000 * 60));

  if (minutes < 60) {
    return `${Math.max(0, minutes)}m ago`;
  }

  if (hours < 24) {
    return `${Math.max(0, hours)}h ago`;
  }

  const days = differenceInDays(now, target);
  if (days < 7) {
    return `${Math.max(0, days)}d ago`;
  }

  return format(target, 'dd-MM-yyyy');
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
