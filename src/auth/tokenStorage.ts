const ACCESS_TOKEN_KEY = "amber.accessToken";
const REFRESH_TOKEN_KEY = "amber.refreshToken";

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== "number") return null;

  return payload.exp * 1000;
}

export function isTokenExpiringSoon(
  token: string | null,
  bufferMs: number = 5 * 60 * 1000,
): boolean {
  const expiration = getTokenExpiration(token);
  if (expiration === null) return false;

  const now = Date.now();
  return now + bufferMs >= expiration;
}

export function getStoredTokens(): StoredTokens {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setStoredTokens(tokens: StoredTokens) {
  if (tokens.accessToken)
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);

  if (tokens.refreshToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
