import { Ban, User, X } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiUrl } from "@/config";
import { useAuth } from "@/auth/AuthContext";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, useState } from "react";
import UserProfile from "@/views/dialogs/UserProfile";
import UserAvatar from "./user-avatar";
import { dispatchContactsEvent } from "@/lib/contact-events";
import { useChat } from "@/views/home/chat";
import { ConfirmationDialog } from "../ui/confirmation-dialog";

type ContactProps = {
  username: string;
  full_name: string;
  online?: boolean;
  avatar_url?: string | null;
  last_message?: {
    sender_id: number;
    type: string;
    content?: {
      text?: string;
      event?: string;
      call_id?: string;
      filename?: string;
      name?: string;
      file_name?: string;
    };
    created_at?: string | null;
  } | null;
  unseen_messages: number;
  isActive?: boolean;
  myUserId: number | null;
} & ComponentPropsWithoutRef<"section">;

const CALL_LOG_PREFIX = "call.";

function buildLastMessagePreview(
  t: TFunction,
  lastMessage: ContactProps["last_message"],
  myUserId: number | null,
) {
  if (!lastMessage) return "";

  const content = lastMessage.content ?? {};
  const isMine = myUserId !== null && lastMessage.sender_id === myUserId;
  const prefix = isMine ? `${t("conversations.you")}: ` : "";

  if (lastMessage.type === "text") {
    const text = content.text?.trim() ?? "";
    return text ? `${prefix}${text}` : "";
  }

  if (lastMessage.type === "file") {
    const fileName =
      content.filename || content.file_name || content.name || "";
    const label = fileName || t("contacts.last_message.attachment");
    return `${prefix}${label}`;
  }

  if (lastMessage.type === "log") {
    const eventName = typeof content.event === "string" ? content.event : "";
    if (eventName.startsWith(CALL_LOG_PREFIX)) {
      const callEvent = eventName.slice(CALL_LOG_PREFIX.length);
      const callLabel = t(`calls.logs.${callEvent}`, {
        defaultValue: content.text ?? t("contacts.last_message.call"),
      });
      return `${prefix}${callLabel}`;
    }

    const text = content.text?.trim() ?? "";
    return text ? `${prefix}${text}` : "";
  }

  return `${prefix}${t("contacts.last_message.unknown")}`;
}

export default function Contact({
  username,
  full_name,
  online,
  avatar_url,
  last_message,
  unseen_messages,
  isActive = false,
  myUserId,
  className,
  ...props
}: ContactProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { closeChat, activeChat } = useChat();
  const [confirmingAction, setConfirmingAction] = useState<
    "block" | "remove" | null
  >(null);

  const isOnline = Boolean(online);
  const shouldCloseChat = activeChat?.otherUser.username === username;
  const lastMessagePreview = buildLastMessagePreview(t, last_message, myUserId);

  const onBlock = async () => {
    try {
      const res = await fetch(apiUrl("/contacts/v1/block"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t(data.message).replace("{{user}}", username));
        await mutate("/contacts/v1/list");
        dispatchContactsEvent({
          type: "contacts",
          event: "contact.removed",
          payload: {
            username,
          },
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    } finally {
      if (shouldCloseChat) {
        closeChat();
      }
    }
  };

  const onRemove = async () => {
    try {
      const res = await fetch(apiUrl("/contacts/v1/remove"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t(data.message).replace("{{user}}", username));
        await mutate("/contacts/v1/list");
        dispatchContactsEvent({
          type: "contacts",
          event: "contact.removed",
          payload: {
            username,
          },
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    } finally {
      if (shouldCloseChat) {
        closeChat();
      }
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <section
            className={cn(
              "flex flex-row items-center gap-2 cursor-pointer rounded-md p-1 transition ease-in-out duration-300",
              isActive ? "bg-primary/10" : "hover:bg-primary/10",
              className,
            )}
            {...props}
          >
            <UserAvatar
              full_name={full_name}
              username={username}
              avatarUrl={avatar_url}
              isOnline={isOnline}
              size="sm"
            />
            <div className="flex min-w-0 flex-1 flex-row items-center justify-between gap-1">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "text-sm leading-tight",
                    !isActive && unseen_messages && "font-semibold",
                  )}
                >
                  {full_name}
                </h3>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {lastMessagePreview || `@${username}`}
                </p>
              </div>
              {!isActive && unseen_messages > 0 && (
                <span className="mr-2 h-5 w-5 rounded-full bg-secondary text-white text-xs flex items-center justify-center font-medium">
                  {unseen_messages > 99 ? "99+" : unseen_messages}
                </span>
              )}
            </div>
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <UserProfile
            username={username}
            trigger={
              <ContextMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <User /> {t("contacts.profile")}
              </ContextMenuItem>
            }
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            variant={"destructive"}
            onClick={() => setConfirmingAction("remove")}
            className="cursor-pointer"
          >
            <X /> {t("contacts.remove")}
          </ContextMenuItem>
          <ContextMenuItem
            variant={"destructive"}
            onClick={() => setConfirmingAction("block")}
            className="cursor-pointer"
          >
            <Ban /> {t("contacts.block")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {confirmingAction === "remove" && (
        <ConfirmationDialog
          open={true}
          title={t("contacts.removeConfirm.title")}
          description={t("contacts.removeConfirm.description", {
            user: full_name,
          })}
          onConfirm={onRemove}
          confirmText={t("common.remove")}
          isDestructive
          onOpenChange={(isOpen) => {
            if (!isOpen) setConfirmingAction(null);
          }}
        />
      )}

      {confirmingAction === "block" && (
        <ConfirmationDialog
          open={true}
          title={t("contacts.blockConfirm.title")}
          description={t("contacts.blockConfirm.description", {
            user: full_name,
          })}
          onConfirm={onBlock}
          confirmText={t("common.block")}
          isDestructive
          onOpenChange={(isOpen) => {
            if (!isOpen) setConfirmingAction(null);
          }}
        />
      )}
    </>
  );
}
