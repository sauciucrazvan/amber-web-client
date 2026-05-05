import { apiUrl } from "@/config";
import {
  PRESENCE_EVENT_NAME,
  WS_MESSAGE_EVENT_NAME,
  type PresenceEventPayload,
} from "@/auth/AuthContext";
import { useAccount } from "@/account/AccountContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import type { CallHistoryItem, ContactListItem } from "../types";

type UseAppSidebarDataParams = {
  isAuthenticated: boolean;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  openDirectChat: (target: ContactListItem["user"]) => Promise<void>;
};

export function useAppSidebarData({
  isAuthenticated,
  authFetch,
  openDirectChat,
}: UseAppSidebarDataParams) {
  const CALL_HISTORY_LIMIT = 15;
  const { account, isLoading: isAccountLoading } = useAccount();

  const [contactsState, setContactsState] = useState<ContactListItem[]>([]);
  const [contactsError, setContactsError] = useState<unknown>(null);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [conversationUnseenCountByUserId, setConversationUnseenCountByUserId] =
    useState<Record<number, number>>({});

  const sortContactsByLastAction = (contacts: ContactListItem[]) => {
    return [...contacts].sort((a, b) => {
      const aTs = Date.parse(a.last_action_at ?? a.created_at ?? "") || 0;
      const bTs = Date.parse(b.last_action_at ?? b.created_at ?? "") || 0;
      if (aTs !== bTs) return bTs - aTs;
      return a.user.username.localeCompare(b.user.username);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setContactsState([]);
      setContactsError(null);
      setIsContactsLoading(false);
      return;
    }

    let cancelled = false;

    const loadContacts = async () => {
      setIsContactsLoading(true);
      setContactsError(null);

      try {
        const res = await authFetch(apiUrl("/contacts/v1/list"));
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data = (await res.json()) as ContactListItem[];
        if (cancelled) return;

        setContactsState(sortContactsByLastAction(data ?? []));
        setConversationUnseenCountByUserId(
          Object.fromEntries(
            (data ?? []).map((contact) => [
              contact.user.id,
              Math.max(0, contact.notifications ?? 0),
            ]),
          ),
        );
      } catch (error) {
        if (cancelled) return;
        setContactsError(error);
      } finally {
        if (!cancelled) {
          setIsContactsLoading(false);
        }
      }
    };

    void loadContacts();

    return () => {
      cancelled = true;
    };
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    const onPresence = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceEventPayload>;
      const detail = customEvent.detail;
      if (!detail || detail.type !== "presence") return;

      setContactsState((current) => {
        let changed = false;

        const next = current.map((contact) => {
          if (contact.user.username !== detail.username) return contact;
          if (contact.user.online === detail.online) return contact;

          changed = true;
          return {
            ...contact,
            user: {
              ...contact.user,
              online: detail.online,
            },
          };
        });

        return changed ? next : current;
      });
    };

    const onWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;
      if (!detail || typeof detail !== "object") return;

      const payload = detail as {
        type?: unknown;
        event?: unknown;
        payload?: unknown;
      };

      if (payload.type !== "contacts") return;
      if (typeof payload.event !== "string") return;
      if (!payload.payload || typeof payload.payload !== "object") return;

      if (
        payload.event === "contact.request.received" ||
        payload.event === "contact.request.removed" ||
        payload.event === "contact.accepted"
      ) {
        void mutate("/contacts/v1/requests");
      }

      const eventPayload = payload.payload as {
        user?: ContactListItem["user"];
        user_id?: number;
        other_user_id?: number;
        username?: string;
        created_at?: string;
        last_action_at?: string;
        last_message?: ContactListItem["last_message"];
      };

      if (payload.event === "contact.accepted" && eventPayload.user) {
        setContactsState((current) => {
          const filtered = current.filter(
            (contact) => contact.user.id !== eventPayload.user?.id,
          );
          filtered.push({
            user: {
              id: eventPayload.user!.id,
              username: eventPayload.user!.username,
              full_name: eventPayload.user!.full_name,
              avatar_url: eventPayload.user!.avatar_url,
              online: eventPayload.user!.online,
              last_active_at: eventPayload.user!.last_active_at ?? null,
            },
            created_at: eventPayload.created_at ?? new Date().toISOString(),
            last_action_at:
              eventPayload.last_action_at ?? eventPayload.created_at,
            last_message: null,
          });
          return sortContactsByLastAction(filtered);
        });
        return;
      }

      if (payload.event === "contact.removed") {
        setContactsState((current) => {
          const byUserId =
            typeof eventPayload.user_id === "number"
              ? eventPayload.user_id
              : null;
          const byOtherUserId =
            typeof eventPayload.other_user_id === "number"
              ? eventPayload.other_user_id
              : null;
          const byUsername =
            typeof eventPayload.username === "string"
              ? eventPayload.username
              : null;

          const removedId = current.some(
            (contact) => contact.user.id === byUserId,
          )
            ? byUserId
            : current.some((contact) => contact.user.id === byOtherUserId)
              ? byOtherUserId
              : (current.find((contact) => contact.user.username === byUsername)
                  ?.user.id ?? null);

          if (removedId === null) return current;

          return current.filter((contact) => contact.user.id !== removedId);
        });
        return;
      }

      if (payload.event === "contact.last_action.updated") {
        if (typeof eventPayload.user_id !== "number") return;
        if (typeof eventPayload.last_action_at !== "string") return;

        setContactsState((current) => {
          const next = current.map((contact) =>
            contact.user.id === eventPayload.user_id
              ? {
                  ...contact,
                  last_action_at: eventPayload.last_action_at,
                }
              : contact,
          );
          return sortContactsByLastAction(next);
        });
      }

      if (payload.event === "contact.last_message.updated") {
        if (typeof eventPayload.user_id !== "number") return;

        setContactsState((current) =>
          current.map((contact) =>
            contact.user.id === eventPayload.user_id
              ? {
                  ...contact,
                  last_message: eventPayload.last_message ?? null,
                }
              : contact,
          ),
        );
      }
    };

    window.addEventListener(PRESENCE_EVENT_NAME, onPresence as EventListener);
    window.addEventListener(
      WS_MESSAGE_EVENT_NAME,
      onWsMessage as EventListener,
    );

    return () => {
      window.removeEventListener(
        PRESENCE_EVENT_NAME,
        onPresence as EventListener,
      );
      window.removeEventListener(
        WS_MESSAGE_EVENT_NAME,
        onWsMessage as EventListener,
      );
    };
  }, []);

  const contacts = useMemo(() => contactsState, [contactsState]);

  const stableContactIds = Array.from(
    new Set((contacts ?? []).map((contact) => contact.user.id)),
  ).sort((a, b) => a - b);

  useEffect(() => {
    const onWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;
      if (!detail || typeof detail !== "object") return;

      const payload = detail as {
        event?: string;
        conversation_id?: string;
        payload?: {
          message?: {
            sender_id?: number;
          };
        };
      };

      if (payload.event !== "message.created") return;
      if (!payload.conversation_id) return;

      const message = payload.payload?.message;
      const senderId = message?.sender_id;
      if (!senderId) return;

      if (stableContactIds.includes(senderId)) {
        setConversationUnseenCountByUserId((current) => ({
          ...current,
          [senderId]: (current[senderId] ?? 0) + 1,
        }));
      }
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
  }, [stableContactIds]);

  const { data: contactRequests, error: contactRequestsError } = useSWR<
    Array<{ user: { id: number }; created_at: string }>
  >(isAuthenticated ? "/contacts/v1/requests" : null, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const requestCount = contactRequestsError
    ? 0
    : (contactRequests?.length ?? 0);

  const {
    data: callHistoryData,
    error: callHistoryError,
    isLoading: isCallHistoryLoading,
  } = useSWR<{
    calls: CallHistoryItem[];
  }>(
    isAuthenticated
      ? `/calls/v1/history?limit=${CALL_HISTORY_LIMIT}&offset=0`
      : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const callHistory = useMemo(
    () => callHistoryData?.calls ?? [],
    [callHistoryData],
  );

  const showVerifyAccount = account?.verified === false;

  const handleOpenDirectChat = async (contact: ContactListItem["user"]) => {
    try {
      const knownContact = contactsState.find(
        (item) =>
          item.user.id === contact.id ||
          item.user.username === contact.username,
      );

      const resolvedContact: ContactListItem["user"] = {
        ...contact,
        online: contact.online ?? knownContact?.user.online,
      };

      await openDirectChat(resolvedContact);
      setConversationUnseenCountByUserId((current) => ({
        ...current,
        [contact.id]: 0,
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed opening chat");
    }
  };

  const clearUnseenCount = useCallback((userId: number) => {
    setConversationUnseenCountByUserId((current) => ({
      ...current,
      [userId]: 0,
    }));
  }, []);

  return {
    account,
    isAccountLoading,
    contacts,
    contactsError,
    isContactsLoading,
    conversationUnseenCountByUserId,
    requestCount,
    callHistory,
    callHistoryError,
    isCallHistoryLoading,
    showVerifyAccount,
    handleOpenDirectChat,
    clearUnseenCount,
  };
}
