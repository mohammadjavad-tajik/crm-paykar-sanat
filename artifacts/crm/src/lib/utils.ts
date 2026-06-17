import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns-jalali"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatToman = (n: number | undefined | null) => {
  if (n === undefined || n === null) return "۰ تومان";
  return n.toLocaleString('fa-IR') + ' تومان';
}

export const formatJalaliDate = (dateString: string | undefined | null) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "yyyy/MM/dd");
  } catch (e) {
    return dateString;
  }
}

export const formatPersianNumber = (n: number | string | undefined | null) => {
  if (n === undefined || n === null) return "۰";
  return Number(n).toLocaleString('fa-IR', { useGrouping: false });
}

export const formatJalaliTime = (dateString: string | undefined | null) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "HH:mm");
  } catch (e) {
    return "-";
  }
}
