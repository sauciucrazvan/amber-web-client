export type AppSettings = {
  allowTray?: boolean;
  startOnBoot?: boolean;
  preferredMicrophoneId?: string;
  preferredCameraId?: string;
  preferredSpeakerId?: string;
  selectedServerId?: string;
};

const SETTINGS_KEY = "amber.settings";

function readSettings(): AppSettings {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as AppSettings;
  } catch {
    return {};
  }
}

export async function getSettings(): Promise<AppSettings> {
  return readSettings();
}

export async function setSettings(next: AppSettings): Promise<AppSettings> {
  const current = readSettings();
  const merged = { ...current, ...next };

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    return current;
  }

  return merged;
}
