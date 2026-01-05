import { format } from "date-fns";

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
