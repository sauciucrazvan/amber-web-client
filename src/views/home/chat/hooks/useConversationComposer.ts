import { apiUrl } from "@/config";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { readErrorMessage } from "../errors";
import type { MessageItem } from "../types";
import { dispatchContactsEvent } from "@/lib/contact-events";

type UseConversationComposerParams = {
  conversationId?: string;
  peerUserId?: number | null;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  t: TFunction;
  messages: MessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  mergeMessages: (
    current: MessageItem[],
    incoming: MessageItem[],
  ) => MessageItem[];
  replaceMessageById: (
    current: MessageItem[],
    next: MessageItem,
  ) => MessageItem[];
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
  onMessageActivity?: () => void;
};

export function useConversationComposer({
  conversationId,
  peerUserId,
  authFetch,
  t,
  messages,
  setMessages,
  mergeMessages,
  replaceMessageById,
  shouldAutoScrollRef,
  onMessageActivity,
}: UseConversationComposerParams) {
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [editing, setEditing] = useState<MessageItem | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    setReplyTo((current) =>
      current && current.conversation_id !== conversationId ? null : current,
    );
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const timeoutId = window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [conversationId]);

  useEffect(() => {
    if (!replyTo) return;
    const timeoutId = window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [replyTo]);

  const canSend = useMemo(
    () => messageText.trim().length > 0 && !isSending,
    [isSending, messageText],
  );

  const emitLastActionUpdate = useCallback(
    (lastActionAt: string) => {
      if (typeof peerUserId !== "number") return;

      dispatchContactsEvent({
        type: "contacts",
        event: "contact.last_action.updated",
        payload: {
          user_id: peerUserId,
          last_action_at: lastActionAt,
        },
      });
    },
    [peerUserId],
  );

  const onSend = useCallback(async () => {
    if (!conversationId || !canSend) return;

    const trimmedMessage = messageText.trim();

    setIsSending(true);
    shouldAutoScrollRef.current = true;
    try {
      if (replyTo) {
        const payload = { message_id: replyTo.id, text: trimmedMessage };
        const res = await authFetch(
          apiUrl(`/chats/v1/${conversationId}/reply`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        const createdMessage = (await res.json()) as MessageItem;
        setMessages((current) => mergeMessages(current, [createdMessage]));
        onMessageActivity?.();
        emitLastActionUpdate(createdMessage.created_at);
      } else if (editing) {
        const payload = { message_id: editing.id, text: trimmedMessage };
        const res = await authFetch(
          apiUrl(`/chats/v1/${conversationId}/messages`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        const editedMessage = (await res.json()) as MessageItem;
        setMessages((current) => replaceMessageById(current, editedMessage));
        emitLastActionUpdate(
          editedMessage.edited_at ?? new Date().toISOString(),
        );
      } else {
        const payload = { text: trimmedMessage };
        const res = await authFetch(
          apiUrl(`/chats/v1/${conversationId}/messages`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        const createdMessage = (await res.json()) as MessageItem;
        setMessages((current) => mergeMessages(current, [createdMessage]));
        onMessageActivity?.();
        emitLastActionUpdate(createdMessage.created_at);
      }

      setMessageText("");
    } catch (e) {
      toast.error(
        e instanceof Error ? t(e.message) : t("conversations.failed_sending"),
      );
    } finally {
      setIsSending(false);
      setReplyTo(null);
      setEditing(null);
    }
  }, [
    authFetch,
    canSend,
    conversationId,
    editing,
    emitLastActionUpdate,
    mergeMessages,
    messageText,
    replaceMessageById,
    replyTo,
    setMessages,
    shouldAutoScrollRef,
    onMessageActivity,
    t,
  ]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!conversationId) return;

      shouldAutoScrollRef.current = true;
      try {
        const payload = { message_id: id };
        const res = await authFetch(
          apiUrl(`/chats/v1/${conversationId}/messages`),
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        toast.success(t("conversations.deleted_message"));

        setMessages((current) =>
          current.filter((message) => message.id !== id),
        );
      } catch (e) {
        toast.error(e instanceof Error ? t(e.message) : t("common.error"));
      }
    },
    [authFetch, conversationId, setMessages, shouldAutoScrollRef, t],
  );

  const onReply = useCallback(
    (id: string) => {
      if (!conversationId) return;
      setEditing(null);
      setReplyTo(messages.find((message) => message.id === id) ?? null);
    },
    [conversationId, messages],
  );

  const onEdit = useCallback(
    (id: string) => {
      if (!conversationId) return;
      setReplyTo(null);
      const messageToEdit =
        messages.find((message) => message.id === id) ?? null;
      setEditing(messageToEdit);
      setMessageText(messageToEdit?.content.text ?? "");

      window.setTimeout(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }, 0);
    },
    [conversationId, messages],
  );

  return {
    messageText,
    setMessageText,
    replyTo,
    setReplyTo,
    editing,
    setEditing,
    isSending,
    canSend,
    textareaRef,
    onSend,
    onDelete,
    onReply,
    onEdit,
  };
}
