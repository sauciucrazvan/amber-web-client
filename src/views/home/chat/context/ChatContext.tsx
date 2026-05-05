import { apiUrl } from "@/config";
/* eslint-disable react-refresh/only-export-components */
import {
  PRESENCE_EVENT_NAME,
  type PresenceEventPayload,
} from "@/auth/AuthContext";
import { useAuth } from "@/auth/AuthContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type DirectConversation = {
  id: string;
  type: string;
  direct_pair: string;
  created_at: string;
  seen: boolean;
};

export type ActiveChat = {
  conversation: DirectConversation;
  otherUser: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string | null;
    online?: boolean;
    last_active_at?: string | null;
  };
};

type ChatContextValue = {
  activeChat: ActiveChat | null;
  openingChatUserId: number | null;
  openDirectChat: (target: ActiveChat["otherUser"]) => Promise<void>;
  closeChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authFetch } = useAuth();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [openingChatUserId, setOpeningChatUserId] = useState<number | null>(
    null,
  );

  const openDirectChat = useCallback(
    async (target: ActiveChat["otherUser"]) => {
      setOpeningChatUserId(target.id);
      try {
        const res = await authFetch(apiUrl(`/chats/v1/direct/${target.id}`), {
          method: "POST",
        });

        if (!res.ok) throw new Error(await readErrorMessage(res));

        const conversation = (await res.json()) as DirectConversation;
        setActiveChat({
          conversation,
          otherUser: target,
        });
      } finally {
        setOpeningChatUserId(null);
      }
    },
    [authFetch],
  );

  const closeChat = useCallback(() => setActiveChat(null), []);

  useEffect(() => {
    const onPresence = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceEventPayload>;
      const detail = customEvent.detail;
      if (!detail || detail.type !== "presence") return;

      setActiveChat((current) => {
        if (!current) return current;
        if (current.otherUser.username !== detail.username) return current;
        if (current.otherUser.online === detail.online) return current;

        return {
          ...current,
          otherUser: {
            ...current.otherUser,
            online: detail.online,
          },
        };
      });
    };

    window.addEventListener(PRESENCE_EVENT_NAME, onPresence as EventListener);

    return () => {
      window.removeEventListener(
        PRESENCE_EVENT_NAME,
        onPresence as EventListener,
      );
    };
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      activeChat,
      openingChatUserId,
      openDirectChat,
      closeChat,
    }),
    [activeChat, closeChat, openDirectChat, openingChatUserId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
