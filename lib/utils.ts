import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = days[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];

  return `${day}, ${dateNum} ${month}`;
}

export function isWorkoutDay(date: Date): boolean {
  // Workout days: Tuesday (2), Thursday (4), Saturday (6)
  const day = date.getDay();
  return day === 2 || day === 4 || day === 6;
}

export function isMidnight(): boolean {
  const now = new Date();
  return now.getHours() >= 0 && now.getHours() < 3;
}

export function getYesterdayDate(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

export function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0];
}

export const textSizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl md:text-5xl font-bold tracking-wider",
} as const;
