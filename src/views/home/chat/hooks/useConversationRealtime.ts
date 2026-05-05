import {
  WS_MESSAGE_EVENT_NAME,
  WS_STATUS_EVENT_NAME,
  type SharedWsStatusPayload,
} from "@/auth/AuthContext";
import { useEffect, useRef } from "react";
import type { MessageItem } from "../types";

type UseConversationRealtimeParams = {
  accessToken: string | null;
  conversationId?: string;
  myUserId: number | null;
  setIsWsConnected: (next: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isNearBottom: (node: HTMLDivElement | null) => boolean;
  mergeMessages: (
    current: MessageItem[],
    incoming: MessageItem[],
  ) => MessageItem[];
  replaceMessageById: (
    current: MessageItem[],
    next: MessageItem,
  ) => MessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  markConversationSeen: (targetConversationId: string) => Promise<void>;
  noteReadCursorSynced?: (lastSeenSeq: number) => void;
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
  onMessageActivity?: () => void;
};

export function useConversationRealtime({
  accessToken,
  conversationId,
  myUserId,
  setIsWsConnected,
  scrollContainerRef,
  isNearBottom,
  mergeMessages,
  replaceMessageById,
  setMessages,
  markConversationSeen,
  noteReadCursorSynced,
  shouldAutoScrollRef,
  onMessageActivity,
}: UseConversationRealtimeParams) {
  const isNearBottomRef = useRef(isNearBottom);
  const mergeMessagesRef = useRef(mergeMessages);
  const replaceMessageByIdRef = useRef(replaceMessageById);
  const markConversationSeenRef = useRef(markConversationSeen);
  const noteReadCursorSyncedRef = useRef(noteReadCursorSynced);
  const myUserIdRef = useRef(myUserId);
  const onMessageActivityRef = useRef(onMessageActivity);

  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
    mergeMessagesRef.current = mergeMessages;
    replaceMessageByIdRef.current = replaceMessageById;
    markConversationSeenRef.current = markConversationSeen;
    noteReadCursorSyncedRef.current = noteReadCursorSynced;
    myUserIdRef.current = myUserId;
    onMessageActivityRef.current = onMessageActivity;
  }, [
    isNearBottom,
    mergeMessages,
    replaceMessageById,
    markConversationSeen,
    noteReadCursorSynced,
    myUserId,
    onMessageActivity,
  ]);

  useEffect(() => {
    if (!conversationId) return;

    setIsWsConnected(Boolean(accessToken));

    const handleIncomingEvent = (raw: unknown) => {
      if (!raw || typeof raw !== "object") return;

      const eventData = raw as {
        event?: string;
        conversation_id?: string;
        payload?: {
          message?: MessageItem;
          message_id?: string;
          message_ids?: string[];
          reader_id?: number;
          last_seen_seq?: number;
        };
      };

      if (!eventData.event || eventData.conversation_id !== conversationId) {
        return;
      }

      if (eventData.event === "message.created") {
        const incomingMessage = eventData.payload?.message;
        if (!incomingMessage) return;
        shouldAutoScrollRef.current = isNearBottomRef.current(
          scrollContainerRef.current,
        );
        setMessages((current) =>
          mergeMessagesRef.current(current, [incomingMessage]),
        );
        onMessageActivityRef.current?.();

        if (
          document.visibilityState === "visible" &&
          isNearBottomRef.current(scrollContainerRef.current)
        ) {
          void markConversationSeenRef.current(conversationId);
        }
        return;
      }

      if (eventData.event === "message.edited") {
        const editedMessage = eventData.payload?.message;
        if (!editedMessage) return;
        setMessages((current) =>
          replaceMessageByIdRef.current(current, editedMessage),
        );
        return;
      }

      if (eventData.event === "message.deleted") {
        const deletedId = eventData.payload?.message_id;
        if (!deletedId) return;
        setMessages((current) =>
          current.filter((message) => message.id !== deletedId),
        );
        return;
      }

      if (eventData.event === "messages.seen") {
        const seenMessageIds = new Set(eventData.payload?.message_ids ?? []);
        if (seenMessageIds.size === 0) return;

        setMessages((current) =>
          current.map((message) =>
            seenMessageIds.has(message.id)
              ? {
                  ...message,
                  seen: true,
                }
              : message,
          ),
        );
        return;
      }

      if (eventData.event === "conversation.read_cursor.updated") {
        const readerId = eventData.payload?.reader_id;
        const lastSeenSeq = eventData.payload?.last_seen_seq;
        if (typeof readerId !== "number" || typeof lastSeenSeq !== "number") {
          return;
        }

        if (myUserIdRef.current !== null && readerId === myUserIdRef.current) {
          noteReadCursorSyncedRef.current?.(lastSeenSeq);
        }

        setMessages((current) =>
          current.map((message) => {
            if (message.seq > lastSeenSeq) return message;
            if (message.sender_id === readerId) return message;
            if (message.seen) return message;
            return {
              ...message,
              seen: true,
            };
          }),
        );
      }
    };

    const onSharedWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;
      if (!detail || typeof detail !== "object") return;
      handleIncomingEvent(detail);
    };

    const onSharedWsStatus = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;
      if (!detail || typeof detail !== "object") return;

      const status = detail as SharedWsStatusPayload & {
        connected?: unknown;
      };

      if (typeof status.connected === "boolean") {
        setIsWsConnected(status.connected);
        return;
      }

      if (status.phase === "connected") {
        setIsWsConnected(true);
        return;
      }

      if (status.phase === "connecting") {
        setIsWsConnected(Boolean(accessToken));
        return;
      }

      setIsWsConnected(false);
    };

    window.addEventListener(
      WS_MESSAGE_EVENT_NAME,
      onSharedWsMessage as EventListener,
    );
    window.addEventListener(
      WS_STATUS_EVENT_NAME,
      onSharedWsStatus as EventListener,
    );

    return () => {
      setIsWsConnected(false);
      window.removeEventListener(
        WS_MESSAGE_EVENT_NAME,
        onSharedWsMessage as EventListener,
      );
      window.removeEventListener(
        WS_STATUS_EVENT_NAME,
        onSharedWsStatus as EventListener,
      );
    };
  }, [
    conversationId,
    accessToken,
    setIsWsConnected,
    shouldAutoScrollRef,
    scrollContainerRef,
    setMessages,
  ]);
}
