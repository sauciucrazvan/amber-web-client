import type { ContactPeer } from "./types";

export function isMobileUserAgent() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isCallTraceEnabled() {
  try {
    return globalThis.localStorage?.getItem("amber.trace.calls") === "1";
  } catch {
    return false;
  }
}

export function traceCall(label: string, detail?: unknown) {
  if (!isCallTraceEnabled()) return;

  if (detail === undefined) {
    console.debug(`[amber:calls] ${label}`);
    return;
  }

  console.debug(`[amber:calls] ${label}`, detail);
}

export function formatPeer(target: {
  id?: number;
  username: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string | null;
  online?: boolean;
}): ContactPeer {
  const displayName =
    target.full_name || target.display_name || target.username || "Unknown";

  return {
    id: target.id,
    username: target.username,
    displayName,
    avatar_url: target.avatar_url ?? null,
    online: target.online,
  };
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
