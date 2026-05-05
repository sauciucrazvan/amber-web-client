import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
/* eslint-disable react-refresh/only-export-components */
import { SWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { API_BASE_URL, WS_BASE_URL, apiUrl } from "@/config";
import {
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
  type StoredTokens,
} from "@/auth/tokenStorage";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
  fullName: string;
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  authFetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const PRESENCE_EVENT_NAME = "amber:presence";
export const WS_MESSAGE_EVENT_NAME = "amber:ws-message";
export const WS_SEND_EVENT_NAME = "amber:ws-send";
export const WS_STATUS_EVENT_NAME = "amber:ws-status";

export type SharedWsStatusPayload = {
  phase: "connecting" | "connected" | "failed" | "disconnected";
  connected: boolean;
  message?: string;
};

export type PresenceEventPayload = {
  type: "presence";
  event: "user_connected" | "user_disconnected";
  username: string;
  online: boolean;
};

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

function resolveApiUrl(key: string) {
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (key.startsWith("/")) return `${API_BASE_URL}${key}`;
  return `${API_BASE_URL}/${key}`;
}

const WS_SESSION_ID_KEY = "amber.wsSessionId";

function getOrCreateWsSessionId() {
  const stored = globalThis.localStorage?.getItem(WS_SESSION_ID_KEY);
  if (stored) return stored;

  const nextId =
    globalThis.crypto?.randomUUID?.() ||
    `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  globalThis.localStorage?.setItem(WS_SESSION_ID_KEY, nextId);
  return nextId;
}

function resolveWsUrl(path: string, accessToken: string, sessionId: string) {
  const wsUrl = new URL(WS_BASE_URL + path);
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  wsUrl.searchParams.set("token", accessToken);
  wsUrl.searchParams.set("session_id", sessionId);
  return wsUrl.toString();
}

function toPresencePayload(raw: unknown): PresenceEventPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const payload = raw as {
    type?: unknown;
    event?: unknown;
    username?: unknown;
    online?: unknown;
  };

  if (payload.type !== "presence") return null;
  if (
    payload.event !== "user_connected" &&
    payload.event !== "user_disconnected"
  ) {
    return null;
  }
  if (typeof payload.username !== "string" || payload.username.length === 0) {
    return null;
  }

  const online =
    typeof payload.online === "boolean"
      ? payload.online
      : payload.event === "user_connected";

  return {
    type: "presence",
    event: payload.event,
    username: payload.username,
    online,
  };
}

const HEARTBEAT_ENDPOINT = "/ping";
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_RECONNECT_MS = 5_000;

function isWsTraceEnabled() {
  try {
    return globalThis.localStorage?.getItem("amber.trace.calls") === "1";
  } catch {
    return false;
  }
}

function traceWs(label: string, detail?: unknown) {
  if (!isWsTraceEnabled()) return;
  if (detail === undefined) {
    console.debug(`[amber:ws] ${label}`);
    return;
  }
  console.debug(`[amber:ws] ${label}`, detail);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialTokens = getStoredTokens();
  const [tokens, setTokens] = useState<StoredTokens>(initialTokens);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const wsSessionId = useMemo(() => getOrCreateWsSessionId(), []);

  const persistTokens = useCallback((next: StoredTokens) => {
    setTokens(next);
    setStoredTokens(next);
  }, []);

  const logout = useCallback(() => {
    setTokens({ accessToken: null, refreshToken: null });
    clearStoredTokens();
  }, []);

  const loginMutation = useSWRMutation<
    TokenResponse,
    Error,
    string,
    { username: string; password: string }
  >(apiUrl("/auth/v1/login"), async (url, { arg }) => {
    const body = new URLSearchParams();
    body.set("username", arg.username);
    body.set("password", arg.password);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (res.status == 422) throw new Error("login.fillInput");
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return (await res.json()) as TokenResponse;
  });

  const registerMutation = useSWRMutation<
    unknown,
    Error,
    string,
    RegisterRequest
  >(apiUrl("/auth/v1/register"), async (url, { arg }) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: arg.username,
        password: arg.password,
        email: arg.email || null,
        full_name: arg.fullName,
      }),
    });

    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  });

  const refreshMutation = useSWRMutation<
    TokenResponse,
    Error,
    string,
    { refreshToken: string }
  >(apiUrl("/auth/v1/refresh"), async (url, { arg }) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: arg.refreshToken }),
    });

    if (!res.ok) throw new Error(await readErrorMessage(res));
    return (await res.json()) as TokenResponse;
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await loginMutation.trigger({ username, password });
      persistTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    },
    [loginMutation, persistTokens],
  );

  const register = useCallback(
    async (req: RegisterRequest) => {
      await registerMutation.trigger(req);
      await login(req.username, req.password);
    },
    [login, registerMutation],
  );

  const refreshAccessToken = useCallback(async () => {
    const currentRefresh = tokens.refreshToken;
    if (!currentRefresh) return null;

    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        try {
          const data = await refreshMutation.trigger({
            refreshToken: currentRefresh,
          });
          persistTokens({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          });
          return data.access_token;
        } catch {
          logout();
          return null;
        }
      })().finally(() => {
        refreshInFlight.current = null;
      });
    }

    return refreshInFlight.current;
  }, [logout, persistTokens, refreshMutation, tokens.refreshToken]);

  useEffect(() => {
    const heartbeatAccessToken = tokens.accessToken;
    if (!heartbeatAccessToken) return;

    let socket: WebSocket | null = null;
    let pingIntervalId: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const clearPingInterval = () => {
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
    };

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }
    };

    const connect = () => {
      if (disposed) return;

      window.dispatchEvent(
        new CustomEvent<SharedWsStatusPayload>(WS_STATUS_EVENT_NAME, {
          detail: {
            phase: "connecting",
            connected: false,
          },
        }),
      );

      traceWs("auth-socket connect", {
        endpoint: HEARTBEAT_ENDPOINT,
        sessionId: wsSessionId,
      });

      socket = new WebSocket(
        resolveWsUrl(HEARTBEAT_ENDPOINT, heartbeatAccessToken, wsSessionId),
      );

      const onWsSend = (customEvent: Event) => {
        const event = customEvent as CustomEvent<unknown>;
        const detail = event.detail;
        if (!detail || typeof detail !== "object") return;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          traceWs("auth-socket send skipped (not open)");
          return;
        }

        try {
          socket.send(JSON.stringify(detail));
          traceWs("auth-socket send", detail);
        } catch {
          traceWs("auth-socket send failed");
        }
      };

      window.addEventListener(WS_SEND_EVENT_NAME, onWsSend as EventListener);

      socket.onopen = () => {
        traceWs("auth-socket open");
        window.dispatchEvent(
          new CustomEvent<SharedWsStatusPayload>(WS_STATUS_EVENT_NAME, {
            detail: { phase: "connected", connected: true },
          }),
        );
        clearPingInterval();
        socket?.send("ping");
        pingIntervalId = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        try {
          const parsed = JSON.parse(event.data) as unknown;
          traceWs("auth-socket message", parsed);
          window.dispatchEvent(
            new CustomEvent<unknown>(WS_MESSAGE_EVENT_NAME, {
              detail: parsed,
            }),
          );

          const presence = toPresencePayload(parsed);
          if (!presence) return;

          window.dispatchEvent(
            new CustomEvent<PresenceEventPayload>(PRESENCE_EVENT_NAME, {
              detail: presence,
            }),
          );
        } catch {
          return;
        }
      };

      socket.onerror = () => {};

      socket.onclose = (event) => {
        window.removeEventListener(
          WS_SEND_EVENT_NAME,
          onWsSend as EventListener,
        );
        traceWs("auth-socket close", {
          code: event.code,
          reason: event.reason,
        });
        clearPingInterval();

        const isCleanShutdown = disposed || event.code === 1000;

        window.dispatchEvent(
          new CustomEvent<SharedWsStatusPayload>(WS_STATUS_EVENT_NAME, {
            detail: {
              phase: isCleanShutdown ? "disconnected" : "failed",
              connected: false,
              message:
                !isCleanShutdown && event.reason ? event.reason : undefined,
            },
          }),
        );

        if (disposed) return;
        if (event.code === 1008) {
          logout();
          return;
        }

        clearReconnectTimeout();
        reconnectTimeoutId = setTimeout(connect, HEARTBEAT_RECONNECT_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      window.dispatchEvent(
        new CustomEvent<SharedWsStatusPayload>(WS_STATUS_EVENT_NAME, {
          detail: { phase: "disconnected", connected: false },
        }),
      );
      clearPingInterval();
      clearReconnectTimeout();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [logout, tokens.accessToken, wsSessionId]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (tokens.accessToken)
        headers.set("Authorization", `Bearer ${tokens.accessToken}`);

      const doFetch = (hdrs: Headers) =>
        fetch(input, {
          ...init,
          headers: hdrs,
        });

      let res = await doFetch(headers);
      if (res.status !== 401) return res;

      const nextAccess = await refreshAccessToken();
      if (!nextAccess) return res;

      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set("Authorization", `Bearer ${nextAccess}`);

      res = await doFetch(retryHeaders);
      return res;
    },
    [refreshAccessToken, tokens.accessToken],
  );

  const swrFetcher = useCallback(
    async (key: string) => {
      const res = await authFetch(resolveApiUrl(key));
      if (!res.ok) throw new Error(await readErrorMessage(res));
      return res.json();
    },
    [authFetch],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: Boolean(tokens.accessToken),
      login,
      register,
      logout,
      authFetch,
    }),
    [
      authFetch,
      login,
      logout,
      register,
      tokens.accessToken,
      tokens.refreshToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      <SWRConfig value={{ fetcher: swrFetcher }}>{children}</SWRConfig>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
