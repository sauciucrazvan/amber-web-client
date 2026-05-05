const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.amber.razvansauciuc.dev/api";
const DEFAULT_WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || "https://api.amber.razvansauciuc.dev/ws";

export let API_BASE_URL = DEFAULT_API_BASE_URL;
export let WS_BASE_URL = DEFAULT_WS_BASE_URL;

type SelectableServer = {
  id: string;
  name: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
};

export function setServerBaseUrls(apiBaseUrl: string, wsBaseUrl: string) {
  const nextApiBaseUrl = apiBaseUrl.trim();
  const nextWsBaseUrl = wsBaseUrl.trim();

  if (!nextApiBaseUrl || !nextWsBaseUrl) return;

  API_BASE_URL = nextApiBaseUrl;
  WS_BASE_URL = nextWsBaseUrl;
}

export function apiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function applyServerConfig(server: SelectableServer) {
  setServerBaseUrls(server.apiBaseUrl, server.wsBaseUrl);
}

export async function initializeServerConfig() {
  setServerBaseUrls(DEFAULT_API_BASE_URL, DEFAULT_WS_BASE_URL);
}
