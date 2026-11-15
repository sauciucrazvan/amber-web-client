import { apiUrl } from "@/config";
import { useCallback } from "react";
import { toast } from "sonner";
import type { TFunction } from "i18next";
import { readErrorMessage } from "../errors";
import type { MessageItem } from "../types";

type UseReactionsParams = {
  conversationId?: string;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  t: TFunction;
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
};

export function useReactions({
  conversationId,
  authFetch,
  t,
  setMessages,
}: UseReactionsParams) {
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId) return;

      try {
        const res = await authFetch(
          apiUrl(`/chats/v1/${conversationId}/messages/${messageId}/reactions`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ emoji }),
          },
        );

        if (!res.ok) {
          const errorMsg = await readErrorMessage(res);
          if (errorMsg.includes("too_many_reactions")) {
            throw new Error("conversations.error.too_many_reactions");
          } else if (errorMsg.includes("invalid_reaction")) {
            throw new Error("conversations.error.invalid_reaction");
          }
          throw new Error(errorMsg);
        }

        const updatedMessage = (await res.json()) as MessageItem;
        setMessages((current) =>
          current.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: updatedMessage.reactions,
                  reaction_details: updatedMessage.reaction_details,
                }
              : msg,
          ),
        );
      } catch (e) {
        toast.error(e instanceof Error ? t(e.message) : t("common.error"));
      }
    },
    [authFetch, conversationId, setMessages, t],
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId) return;

      try {
        const res = await authFetch(
          apiUrl(`/chats/v1/${conversationId}/messages/${messageId}/reactions`),
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ emoji }),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));

        const updatedMessage = (await res.json()) as MessageItem;
        setMessages((current) =>
          current.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: updatedMessage.reactions,
                  reaction_details: updatedMessage.reaction_details,
                }
              : msg,
          ),
        );
      } catch (e) {
        toast.error(e instanceof Error ? t(e.message) : t("common.error"));
      }
    },
    [authFetch, conversationId, setMessages, t],
  );

  return { addReaction, removeReaction };
}
