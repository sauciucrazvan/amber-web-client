import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatHHmm } from "@/lib/utils";
import { Check, CheckCheck, Pencil, Reply, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { MessageItem } from "../types";
import MessageEditHistoryDialog from "./MessageEditHistoryDialog";

const LOG_SUFFIX_BY_EVENT: Record<string, string> = {
  initiated: " started a call",
  accepted: " accepted the call",
  rejected: " rejected the call",
  finished: " finished the call",
};

function extractActorFromLegacyCallLogText(text: string, eventName: string) {
  const suffix = LOG_SUFFIX_BY_EVENT[eventName];
  if (!suffix) return "";
  if (!text.endsWith(suffix)) return "";

  const actor = text.slice(0, text.length - suffix.length).trim();
  return actor;
}

interface Props {
  myUserId: number | null;
  message: MessageItem;
  otherUserName?: string;
  onScrollToMessage?: (messageId: string) => void;

  delete_func: (id: string) => void;
  reply_func: (id: string) => void;
  edit_func: (id: string) => void;
}

export default function ChatBubble({
  myUserId,
  message,
  otherUserName,
  onScrollToMessage,
  delete_func,
  reply_func,
  edit_func,
}: Props) {
  const { t } = useTranslation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isMine = myUserId !== null && message.sender_id === myUserId;
  const text = message.content?.text ?? "";

  const isTextMessage = message.type === "text";
  const isLogMessage = message.type === "log";
  const logEvent =
    typeof message.content?.event === "string" ? message.content.event : "";
  const logEventName = logEvent.startsWith("call.")
    ? logEvent.slice("call.".length)
    : logEvent;

  const actorFromPayload =
    typeof message.content?.actor_display_name === "string"
      ? message.content.actor_display_name.trim()
      : "";
  const actorFromLegacyText = extractActorFromLegacyCallLogText(
    text,
    logEventName,
  );
  const logActor = actorFromPayload || actorFromLegacyText;

  const supportsActorInterpolation =
    logEventName === "initiated" ||
    logEventName === "accepted" ||
    logEventName === "rejected" ||
    logEventName === "finished";

  const logText =
    isLogMessage && logEventName
      ? supportsActorInterpolation && logActor
        ? t(`calls.logs.${logEventName}WithActor`, {
            actor: logActor,
            defaultValue: text,
          })
        : t(`calls.logs.${logEventName}`, { defaultValue: text })
      : text;

  return (
    <div
      key={message.id}
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      {isLogMessage && (
        <div className="flex w-full justify-center">
          <div className="flex max-w-[90%] items-center gap-2 rounded-full border border-dashed bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="max-w-full text-center">{logText}</span>
            <span className="shrink-0 text-[10px] opacity-80">
              {formatHHmm(new Date(message.created_at))}
            </span>
          </div>
        </div>
      )}

      {isTextMessage && (
        <ContextMenu key={message.id}>
          <ContextMenuTrigger
            className={`flex min-w-0 flex-col text-sm max-w-[75%] rounded-md border px-3 py-2 ${isMine ? "bg-muted" : "bg-background"}`}
          >
            {message.content.reply_to && (
              <button
                type="button"
                onClick={() =>
                  onScrollToMessage?.(message.content.reply_to!.id)
                }
                className="w-full bg-primary/5 border-l-2 p-2 rounded-sm mb-1 whitespace-pre-wrap break-all wrap-anywhere text-left hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {message.content.reply_to.sender_id === myUserId
                    ? t("conversations.you")
                    : otherUserName}
                </p>
                <p className="text-sm">
                  {message.content.reply_to.content.text}
                </p>
              </button>
            )}

            <div className="inline-flex min-w-0 items-center gap-1">
              <div className="min-w-0 whitespace-pre-wrap break-all wrap-anywhere select-text">
                {text}
              </div>

              <div className="mt-1 self-end inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <MessageEditHistoryDialog
                  editedAt={message.edited_at}
                  history={message.content?.history}
                />

                {formatHHmm(new Date(message.created_at))}

                {message.seen ? (
                  <CheckCheck size="16" className="text-blue-400" />
                ) : (
                  <Check size="16" />
                )}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="max-w-xs">
            <ContextMenuGroup>
              <ContextMenuItem
                className="cursor-pointer"
                onClick={() => reply_func(message.id)}
              >
                <Reply /> {t("conversations.actions.reply")}
              </ContextMenuItem>

              {isMine && (
                <>
                  <ContextMenuItem
                    className="cursor-pointer"
                    onClick={() => edit_func(message.id)}
                  >
                    <Pencil /> {t("conversations.actions.edit")}
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 /> {t("conversations.actions.delete")}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {confirmingDelete && (
        <ConfirmationDialog
          open={true}
          title={t("conversations.deleteMessage.confirm.title")}
          description={t("conversations.deleteMessage.confirm.description")}
          onConfirm={() => delete_func(message.id)}
          confirmText={t("common.delete")}
          isDestructive
          onOpenChange={(isOpen) => {
            if (!isOpen) setConfirmingDelete(false);
          }}
        />
      )}
    </div>
  );
}
