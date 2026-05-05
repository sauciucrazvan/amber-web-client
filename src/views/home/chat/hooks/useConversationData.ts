import { apiUrl } from "@/config";
import { WS_SEND_EVENT_NAME } from "@/auth/AuthContext";
import { useAccount } from "@/account/AccountContext";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { readErrorMessage } from "../errors";
import type { MarkSeenResponse, MessageItem } from "../types";

type UseConversationDataParams = {
  conversationId?: string;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  t: TFunction;
  language: string;
  isWsConnected: boolean;
  setIsWsConnected: (next: boolean) => void;
};

export function useConversationData({
  conversationId,
  authFetch,
  t,
  language,
  isWsConnected,
  setIsWsConnected,
}: UseConversationDataParams) {
  const { account } = useAccount();
  const MESSAGE_PAGE_SIZE = 20;
  const DISCONNECTED_REFRESH_MS = 45_000;
  const READ_CURSOR_DEBOUNCE_MS = 450;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingInitialScrollRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const readCursorTimerRef = useRef<number | null>(null);
  const lastSentReadSeqRef = useRef(0);
  const pendingReadSeqRef = useRef(0);
  const latestLoadedSeqRef = useRef(0);
  const activeConversationIdRef = useRef<string | undefined>(undefined);

  const scrollToBottomWithRetry = useCallback((attempt = 0) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
    bottomRef.current?.scrollIntoView({ block: "end" });

    if (attempt >= 3) return;

    window.requestAnimationFrame(() => {
      const latestContainer = scrollContainerRef.current;
      if (!latestContainer) return;

      const distanceFromBottom =
        latestContainer.scrollHeight -
        latestContainer.scrollTop -
        latestContainer.clientHeight;

      if (distanceFromBottom > 2) {
        scrollToBottomWithRetry(attempt + 1);
      }
    });
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
    lastSentReadSeqRef.current = 0;
    pendingReadSeqRef.current = 0;
    latestLoadedSeqRef.current = 0;
    if (readCursorTimerRef.current) {
      window.clearTimeout(readCursorTimerRef.current);
      readCursorTimerRef.current = null;
    }
  }, [conversationId]);

  useEffect(() => {
    latestLoadedSeqRef.current = messages.at(-1)?.seq ?? 0;
  }, [messages]);

  const isNearBottom = useCallback((node: HTMLDivElement | null) => {
    if (!node) return true;
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    return distanceFromBottom < 80;
  }, []);

  const formatMessageDate = useCallback(
    (dateString: string) => {
      return new Date(dateString).toLocaleDateString(language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    [language],
  );

  const sortMessages = useCallback((items: MessageItem[]) => {
    return [...items].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, []);

  const mergeMessages = useCallback(
    (current: MessageItem[], incoming: MessageItem[]) => {
      const byId = new Map(current.map((message) => [message.id, message]));
      incoming.forEach((message) => {
        byId.set(message.id, message);
      });

      return sortMessages(Array.from(byId.values()));
    },
    [sortMessages],
  );

  const replaceMessageById = useCallback(
    (current: MessageItem[], next: MessageItem) => {
      const index = current.findIndex((message) => message.id === next.id);
      if (index === -1) return current;

      const updated = [...current];
      updated[index] = next;
      return sortMessages(updated);
    },
    [sortMessages],
  );

  const fetchMessagesPage = useCallback(
    async (before?: string) => {
      if (!conversationId) return [] as MessageItem[];

      const params = new URLSearchParams({ limit: String(MESSAGE_PAGE_SIZE) });
      if (before) params.set("before", before);

      const res = await authFetch(
        apiUrl(`/chats/v1/${conversationId}/messages?${params.toString()}`),
      );

      if (!res.ok) throw new Error(await readErrorMessage(res));

      return (await res.json()) as MessageItem[];
    },
    [MESSAGE_PAGE_SIZE, authFetch, conversationId],
  );

  const refreshLatestMessages = useCallback(async () => {
    if (!conversationId) return;

    const data = await fetchMessagesPage();
    shouldAutoScrollRef.current = isNearBottom(scrollContainerRef.current);
    setMessages((current) => mergeMessages(current, data));
    if (data.length < MESSAGE_PAGE_SIZE) setHasMoreMessages(false);
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    isNearBottom,
    mergeMessages,
  ]);

  const fallbackMarkSeenViaMessagesFetch = useCallback(
    async (targetConversationId: string) => {
      const params = new URLSearchParams({ limit: String(MESSAGE_PAGE_SIZE) });
      const res = await authFetch(
        apiUrl(
          `/chats/v1/${targetConversationId}/messages?${params.toString()}`,
        ),
      );

      if (!res.ok) return;

      const latest = (await res.json()) as MessageItem[];
      if (activeConversationIdRef.current !== targetConversationId) return;

      setMessages((current) => mergeMessages(current, latest));
    },
    [MESSAGE_PAGE_SIZE, authFetch, mergeMessages],
  );

  const flushReadCursor = useCallback(
    async (targetConversationId: string) => {
      const pendingSeq = pendingReadSeqRef.current;
      if (!targetConversationId || pendingSeq <= lastSentReadSeqRef.current) {
        return;
      }

      pendingReadSeqRef.current = 0;

      try {
        window.dispatchEvent(
          new CustomEvent(WS_SEND_EVENT_NAME, {
            detail: {
              event: "chat.read_cursor.update",
              payload: {
                conversation_id: targetConversationId,
                upto_seq: pendingSeq,
              },
            },
          }),
        );
        lastSentReadSeqRef.current = pendingSeq;
      } catch {
        const res = await authFetch(
          apiUrl(`/chats/v1/${targetConversationId}/read-cursor`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ upto_seq: pendingSeq }),
          },
        );

        if (res.ok) {
          const data = (await res.json()) as MarkSeenResponse;
          const serverSeq = data.last_seen_seq ?? pendingSeq;
          lastSentReadSeqRef.current = Math.max(
            lastSentReadSeqRef.current,
            serverSeq,
          );
          return;
        }

        if (res.status === 404 || res.status === 405 || res.status === 501) {
          await fallbackMarkSeenViaMessagesFetch(targetConversationId);
        }
      }
    },
    [authFetch, fallbackMarkSeenViaMessagesFetch],
  );

  const markConversationSeen = useCallback(
    async (
      targetConversationId: string,
      uptoSeq?: number,
      flushImmediately = false,
    ) => {
      if (!targetConversationId) return;

      const candidateSeq = uptoSeq ?? latestLoadedSeqRef.current;
      if (candidateSeq <= lastSentReadSeqRef.current) return;

      pendingReadSeqRef.current = Math.max(
        pendingReadSeqRef.current,
        candidateSeq,
      );

      if (flushImmediately) {
        if (readCursorTimerRef.current) {
          window.clearTimeout(readCursorTimerRef.current);
          readCursorTimerRef.current = null;
        }
        await flushReadCursor(targetConversationId);
        return;
      }

      if (readCursorTimerRef.current) {
        return;
      }

      readCursorTimerRef.current = window.setTimeout(() => {
        readCursorTimerRef.current = null;
        void flushReadCursor(targetConversationId);
      }, READ_CURSOR_DEBOUNCE_MS);
    },
    [READ_CURSOR_DEBOUNCE_MS, flushReadCursor],
  );

  const noteReadCursorSynced = useCallback((lastSeenSeq: number) => {
    if (!Number.isFinite(lastSeenSeq)) return;
    lastSentReadSeqRef.current = Math.max(
      lastSentReadSeqRef.current,
      lastSeenSeq,
    );
    pendingReadSeqRef.current = Math.max(
      pendingReadSeqRef.current,
      lastSeenSeq,
    );
  }, []);

  const isActivelyViewingConversation = useCallback(() => {
    return (
      document.visibilityState === "visible" &&
      isNearBottom(scrollContainerRef.current)
    );
  }, [isNearBottom]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMoreRef.current || !hasMoreMessages) return;

    const oldestMessage = messages[0];
    if (!oldestMessage?.created_at) {
      setHasMoreMessages(false);
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    const container = scrollContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;

    try {
      const older = await fetchMessagesPage(oldestMessage.created_at);
      setMessages((current) => mergeMessages(current, older));
      if (older.length < MESSAGE_PAGE_SIZE) setHasMoreMessages(false);

      window.requestAnimationFrame(() => {
        const currentContainer = scrollContainerRef.current;
        if (!currentContainer) return;

        const nextHeight = currentContainer.scrollHeight;
        currentContainer.scrollTop += nextHeight - previousHeight;
      });
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    hasMoreMessages,
    mergeMessages,
    messages,
  ]);

  useEffect(() => {
    if (!conversationId) return;

    let disposed = false;

    setMessages([]);
    setHasMoreMessages(true);
    setIsWsConnected(false);

    const load = async () => {
      setIsLoading(true);
      try {
        const firstPage = await fetchMessagesPage();
        setMessages((current) => mergeMessages(current, firstPage));
        setHasMoreMessages(firstPage.length === MESSAGE_PAGE_SIZE);
        await markConversationSeen(
          conversationId,
          firstPage.at(-1)?.seq ?? 0,
          true,
        );
      } catch (e) {
        if (!disposed) {
          toast.error(
            e instanceof Error
              ? t(e.message)
              : t("conversations.failed_loading"),
          );
        }
      } finally {
        if (!disposed) setIsLoading(false);
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    markConversationSeen,
    mergeMessages,
    setIsWsConnected,
    t,
  ]);

  useEffect(() => {
    if (!conversationId || isWsConnected) return;

    const interval = window.setInterval(() => {
      void refreshLatestMessages().catch(() => null);
    }, DISCONNECTED_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    DISCONNECTED_REFRESH_MS,
    conversationId,
    isWsConnected,
    refreshLatestMessages,
  ]);

  useEffect(() => {
    if (!conversationId) return;

    const onVisibilityChange = () => {
      if (!isActivelyViewingConversation()) return;
      void markConversationSeen(conversationId);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [conversationId, isActivelyViewingConversation, markConversationSeen]);

  useEffect(() => {
    return () => {
      if (!conversationId) return;
      if (readCursorTimerRef.current) {
        window.clearTimeout(readCursorTimerRef.current);
        readCursorTimerRef.current = null;
      }
      void flushReadCursor(conversationId);
    };
  }, [conversationId, flushReadCursor]);

  useEffect(() => {
    if (!conversationId) return;
    if (typeof account?.id !== "number") return;
    setMyUserId(account.id);
  }, [account?.id, conversationId]);

  useEffect(() => {
    if (isLoading) return;

    if (!pendingInitialScrollRef.current && !shouldAutoScrollRef.current) {
      return;
    }

    if (pendingInitialScrollRef.current && messages.length === 0) return;

    window.requestAnimationFrame(() => {
      scrollToBottomWithRetry();
    });

    if (pendingInitialScrollRef.current) {
      pendingInitialScrollRef.current = false;
    }
  }, [isLoading, messages, scrollToBottomWithRetry]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    pendingInitialScrollRef.current = true;
  }, [conversationId]);

  const onScroll = useCallback(() => {
    const wasAutoScrollEnabled = shouldAutoScrollRef.current;
    const nearBottom = isNearBottom(scrollContainerRef.current);
    shouldAutoScrollRef.current = nearBottom;

    if (
      conversationId &&
      nearBottom &&
      document.visibilityState === "visible"
    ) {
      void markConversationSeen(conversationId);
    }

    const container = scrollContainerRef.current;
    if (!container || container.scrollTop > 60 || wasAutoScrollEnabled) return;
    void loadOlderMessages().catch(() => null);
  }, [conversationId, isNearBottom, loadOlderMessages, markConversationSeen]);

  return {
    messages,
    setMessages,
    isLoading,
    isLoadingMore,
    myUserId,
    formatMessageDate,
    onScroll,
    scrollContainerRef,
    bottomRef,
    shouldAutoScrollRef,
    isNearBottom,
    markConversationSeen,
    noteReadCursorSynced,
    mergeMessages,
    replaceMessageById,
  };
}
