import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseAmount(value: string | number): string {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) throw new Error("Invalid amount");
  return num.toFixed(8);
}

export function formatUsdt(value: string | number): string {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(num);
}

export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? "Africa/Johannesburg";

export function formatAppDateTime(value: Date | string | number | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getAppWeekday(value: Date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
  }).format(value);

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

export function compareAnswers(
  correct: string | null,
  submitted: string,
): boolean {
  if (!correct) return false;
  return correct.trim().toLowerCase() === submitted.trim().toLowerCase();
}
