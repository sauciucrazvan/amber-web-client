import { clsx, type ClassValue } from "clsx";
import type { TFunction } from "i18next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Source - https://stackoverflow.com/a
// Posted by Joe Freeman, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-15, License - CC BY-SA 4.0
export const stringToColor = (str: string) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const initials = (first + last).toUpperCase();
  return initials || "?";
}

export function formatHHmm(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatRelativeTime(t: TFunction, dateValue?: string | null) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1)
    return t("calls.history.relative.now", { defaultValue: "now" });
  if (diffMinutes < 60)
    return t("calls.history.relative.minutesAgo", {
      count: diffMinutes,
      defaultValue: "{{count}}m ago",
    });

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return t("calls.history.relative.hoursAgo", {
      count: diffHours,
      defaultValue: "{{count}}h ago",
    });

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7)
    return t("calls.history.relative.daysAgo", {
      count: diffDays,
      defaultValue: "{{count}}d ago",
    });

  const diffWeeks = Math.floor(diffDays / 7);
  return t("calls.history.relative.weeksAgo", {
    count: diffWeeks,
    defaultValue: "{{count}}w ago",
  });
}
