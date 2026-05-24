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

export function compareAnswers(
  correct: string | null,
  submitted: string,
): boolean {
  if (!correct) return false;
  return correct.trim().toLowerCase() === submitted.trim().toLowerCase();
}
