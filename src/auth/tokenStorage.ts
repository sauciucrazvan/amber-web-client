const ACCESS_TOKEN_KEY = "amber.accessToken";
const REFRESH_TOKEN_KEY = "amber.refreshToken";

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

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
