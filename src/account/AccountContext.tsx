import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
/* eslint-disable react-refresh/only-export-components */
import { apiUrl } from "@/config";
import { useAuth, WS_MESSAGE_EVENT_NAME } from "@/auth/AuthContext";

export type AccountMe = {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  online: boolean | null;
  avatar_url: string | null;
  verified: boolean | null;
  registered_at?: string | null;
  last_active_at?: string | null;
};

type AccountWsPayload = {
  type?: unknown;
  event?: unknown;
  payload?: unknown;
};

type AccountContextValue = {
  account: AccountMe | null;
  isLoading: boolean;
  error: string | null;
  refreshAccount: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function parseAccount(raw: unknown): AccountMe | null {
  if (!raw || typeof raw !== "object") return null;

  const payload = raw as {
    id?: unknown;
    username?: unknown;
    full_name?: unknown;
    email?: unknown;
    bio?: unknown;
    online?: unknown;
    avatar_url?: unknown;
    verified?: unknown;
    registered_at?: unknown;
    last_active_at?: unknown;
  };

  if (typeof payload.id !== "number") return null;
  if (typeof payload.username !== "string" || payload.username.length === 0) {
    return null;
  }

  return {
    id: payload.id,
    username: payload.username,
    full_name: typeof payload.full_name === "string" ? payload.full_name : null,
    email: typeof payload.email === "string" ? payload.email : null,
    bio: typeof payload.bio === "string" ? payload.bio : null,
    online: typeof payload.online === "boolean" ? payload.online : null,
    avatar_url:
      typeof payload.avatar_url === "string" ? payload.avatar_url : null,
    verified: typeof payload.verified === "boolean" ? payload.verified : null,
    registered_at:
      typeof payload.registered_at === "string" ? payload.registered_at : null,
    last_active_at:
      typeof payload.last_active_at === "string"
        ? payload.last_active_at
        : null,
  };
}

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, authFetch } = useAuth();
  const [account, setAccount] = useState<AccountMe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAccount = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await authFetch(apiUrl("/account/v1/me"));
      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      const data = parseAccount(await res.json());
      if (!data) {
        throw new Error("invalid account payload");
      }

      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAccount(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    void refreshAccount();
  }, [isAuthenticated, refreshAccount]);

  useEffect(() => {
    const onWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail as AccountWsPayload | undefined;
      if (!detail || detail.type !== "account") return;
      if (detail.event !== "account.updated") return;

      const nextAccount = parseAccount(detail.payload);
      if (!nextAccount) return;
      setAccount(nextAccount);
      setError(null);
    };

    window.addEventListener(
      WS_MESSAGE_EVENT_NAME,
      onWsMessage as EventListener,
    );

    return () => {
      window.removeEventListener(
        WS_MESSAGE_EVENT_NAME,
        onWsMessage as EventListener,
      );
    };
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      account,
      isLoading,
      error,
      refreshAccount,
    }),
    [account, error, isLoading, refreshAccount],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
