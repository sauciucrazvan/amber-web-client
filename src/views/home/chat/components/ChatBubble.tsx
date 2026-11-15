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
import {
  Check,
  CheckCheck,
  Pencil,
  Reply,
  Trash2,
  ChevronRight,
  FileText,
  FileArchive,
  FileCode,
  File as FileIcon,
  Download,
  Paperclip,
  Smile,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import type { MessageItem } from "../types";
import EmojiPanel from "./EmojiPanel";
import MessageEditHistoryDialog from "./MessageEditHistoryDialog";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import ReactionsPanel from "./ReactionsPanel";
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { Marker, MarkerContent } from "@/components/ui/marker";

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

function formatBytes(bytes?: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(contentType?: string, isMine?: boolean) {
  const type = contentType?.toLowerCase() || "";
  const baseClasses = "h-8 w-8 shrink-0 text-primary";

  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("tar") ||
    type.includes("gzip")
  ) {
    return <FileArchive className={baseClasses} />;
  }
  if (
    type.includes("text") ||
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("sheet")
  ) {
    return <FileText className={baseClasses} />;
  }
  if (
    type.includes("javascript") ||
    type.includes("json") ||
    type.includes("html") ||
    type.includes("css")
  ) {
    return <FileCode className={baseClasses} />;
  }
  return (
    <FileIcon
      className={`${baseClasses} ${
        isMine ? "text-primary-foreground opacity-90" : "opacity-70"
      }`}
    />
  );
}

function getVisibleReactionsCount(
  textLength: number,
  hasFile: boolean,
): number {
  if (hasFile) return 3;
  if (textLength < 15) return 1;
  if (textLength < 40) return 2;
  if (textLength < 80) return 3;
  return 4;
}

interface Props {
  myUserId: number | null;
  message: MessageItem;
  otherUserName?: string;
  onScrollToMessage?: (messageId: string) => void;
  delete_func: (id: string) => void;
  reply_func: (id: string) => void;
  edit_func: (id: string) => void;
  add_reaction_func?: (emoji: string) => void;
  remove_reaction_func?: (emoji: string) => void;
}

export default function ChatBubble({
  myUserId,
  message,
  otherUserName,
  onScrollToMessage,
  delete_func,
  reply_func,
  edit_func,
  add_reaction_func,
  remove_reaction_func,
}: Props) {
  const { t } = useTranslation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [ReactionsPanelOpen, setReactionsPanelOpen] = useState(false);

  const isMine = myUserId !== null && message.sender_id === myUserId;
  const text = message.content?.text ?? "";

  const isTextMessage = message.type === "text";
  const isLogMessage = message.type === "log";
  const isFileMessage = message.type === "file";
  const canEditFileMessage =
    isFileMessage && typeof message.content?.text === "string";
  const hasBodyText = text.trim().length > 0;

  const fileUrl = message.content?.url ?? "";
  const fileName = message.content?.filename ?? "file";
  const fileType = message.content?.content_type ?? "";
  const fileSize = message.content?.size;
  const isImageFile = fileType.startsWith("image/");
  const fileExtension = fileName.includes(".")
    ? fileName.split(".").pop()?.toUpperCase()
    : "";

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
  const actorUserId =
    typeof message.content?.actor_user_id === "number"
      ? message.content.actor_user_id
      : message.sender_id;
  const isViewerActor = myUserId !== null && actorUserId === myUserId;
  const otherDisplayName = otherUserName?.trim() || t("calls.unknown");

  const supportsActorInterpolation =
    logEventName === "initiated" ||
    logEventName === "accepted" ||
    logEventName === "rejected" ||
    logEventName === "finished";

  const logText =
    isLogMessage && logEventName
      ? logEventName === "missed"
        ? isViewerActor
          ? t("calls.logs.missedNoAnswer", {
              actor: otherDisplayName,
              defaultValue: text,
            })
          : t("calls.logs.missedFrom", {
              actor: logActor || otherDisplayName,
              defaultValue: text,
            })
        : supportsActorInterpolation && logActor
          ? t(`calls.logs.${logEventName}WithActor`, {
              actor: logActor,
              defaultValue: text,
            })
          : t(`calls.logs.${logEventName}`, { defaultValue: text })
      : text;

  const reactionDetails = useMemo(() => {
    const details = message.reaction_details
      ? [...message.reaction_details]
      : Object.entries(message.reactions ?? {}).map(([emoji, count]) => ({
          emoji,
          count,
          user_ids: [],
          created_at: new Date(0).toISOString(),
        }));

    return details.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
  }, [message.reaction_details, message.reactions]);

  const closeReactionMenus = () => {
    setEmojiPickerOpen(false);
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
  };

  const downloadFile = async () => {
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("download_failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const fallbackLink = document.createElement("a");
      fallbackLink.href = fileUrl;
      fallbackLink.download = fileName || "file";
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
    }
  };

  const maxVisibleReactions = getVisibleReactionsCount(
    text.length,
    isFileMessage,
  );

  return (
    <div
      className={`flex w-full flex-col ${reactionDetails.length > 0 ? "mb-4" : "mb-0"}`}
    >
      {isLogMessage && (
        <Marker variant="separator">
          <MarkerContent>
            <span className="text-xs">{logText}</span>
            <span className="pl-2 text-[10px] opacity-80">
              {formatHHmm(new Date(message.created_at))}
            </span>
          </MarkerContent>
        </Marker>
      )}

      {(isTextMessage || isFileMessage) && (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={`flex flex-col w-full ${isMine ? "items-end" : "items-start"}`}
            >
              <Bubble
                align={isMine ? "end" : "start"}
                variant={isMine ? undefined : "muted"}
              >
                <BubbleContent className="flex flex-col gap-1 min-w-0">
                  {message.content.reply_to && (
                    <button
                      type="button"
                      onClick={() =>
                        onScrollToMessage?.(message.content.reply_to!.id)
                      }
                      className={`w-full border-l-4 px-3 py-2 rounded-r-md rounded-l-sm text-left transition-colors cursor-pointer flex flex-col ${"bg-muted-foreground/10 border-muted-foreground/30 hover:bg-muted-foreground/20 text-foreground"}`}
                    >
                      <span
                        className={`text-xs font-semibold mb-0.5 text-muted-foreground`}
                      >
                        {message.content.reply_to.sender_id === myUserId
                          ? t("conversations.you")
                          : otherUserName}
                      </span>
                      <span className="text-sm inline-flex items-center gap-1 opacity-90 line-clamp-2 w-full">
                        {message.content.reply_to.type === "file" ? (
                          <>
                            <Paperclip size="14" className="shrink-0" />
                            <span className="truncate">
                              {message.content.reply_to.content.filename ||
                                t(
                                  "conversations.files.attachment",
                                  "Attachment",
                                )}
                            </span>
                          </>
                        ) : (
                          <span className="line-clamp-2 text-left wrap-break-word w-full">
                            {message.content.reply_to.content.text}
                          </span>
                        )}
                      </span>
                    </button>
                  )}

                  {isFileMessage && (
                    <div className="max-w-full min-w-60">
                      {isImageFile ? (
                        <ImagePreviewModal
                          fileUrl={fileUrl}
                          fileName={fileName}
                          downloadFile={downloadFile}
                        />
                      ) : (
                        <Attachment>
                          <AttachmentMedia>
                            {getFileIcon(fileType, isMine)}
                          </AttachmentMedia>
                          <AttachmentContent>
                            <AttachmentTitle>{fileName}</AttachmentTitle>
                            <AttachmentDescription>
                              {fileExtension ? `${fileExtension} • ` : ""}
                              {formatBytes(fileSize)}
                            </AttachmentDescription>
                          </AttachmentContent>
                          <AttachmentActions>
                            <AttachmentAction
                              onClick={() => {
                                void downloadFile();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </AttachmentAction>
                          </AttachmentActions>
                        </Attachment>
                      )}
                    </div>
                  )}

                  {(isTextMessage || (isFileMessage && hasBodyText)) && (
                    <div className="whitespace-pre-wrap wrap-break-word min-w-0">
                      {text}
                    </div>
                  )}

                  <div
                    className={`flex items-center gap-1.5 text-[11px] opacity-70 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {(isTextMessage || canEditFileMessage) && (
                      <MessageEditHistoryDialog
                        editedAt={message.edited_at}
                        history={message.content?.history}
                      />
                    )}
                    <span>{formatHHmm(new Date(message.created_at))}</span>
                    {isMine && (
                      <span className="flex items-center">
                        {message.seen ? (
                          <CheckCheck size="12" className="text-blue-400" />
                        ) : (
                          <Check size="12" />
                        )}
                      </span>
                    )}
                  </div>
                </BubbleContent>

                {reactionDetails.length > 0 && (
                  <BubbleReactions
                    className={`cursor-pointer ${
                      isMine
                        ? "left-2 right-auto self-start"
                        : "right-2 left-auto self-end"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReactionsPanelOpen(true);
                    }}
                  >
                    {reactionDetails
                      .slice(0, maxVisibleReactions)
                      .map((reaction) => (
                        <span key={reaction.emoji}>{reaction.emoji}</span>
                      ))}
                    {reactionDetails.length > maxVisibleReactions && (
                      <span>
                        +{reactionDetails.length - maxVisibleReactions}
                      </span>
                    )}
                  </BubbleReactions>
                )}
              </Bubble>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="max-w-xs">
            <ContextMenuGroup>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("👍");
                        closeReactionMenus();
                      }}
                    >
                      👍
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.like")}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("❤️");
                        closeReactionMenus();
                      }}
                    >
                      ❤️
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.love")}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("😊");
                        closeReactionMenus();
                      }}
                    >
                      😊
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.smile")}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("😂");
                        closeReactionMenus();
                      }}
                    >
                      😂
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.laugh")}</p>
                  </TooltipContent>
                </Tooltip>
                <EmojiPanel
                  onEmojiSelect={(emoji) => {
                    add_reaction_func?.(emoji);
                    closeReactionMenus();
                  }}
                  open={emojiPickerOpen}
                  onOpenChange={setEmojiPickerOpen}
                  triggerTooltip={t("conversations.reactions.more")}
                  customTrigger={
                    <button
                      type="button"
                      className="ml-1 p-1 text-muted-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  }
                />
              </div>

              <ContextMenuSeparator />

              <ContextMenuItem
                className="cursor-pointer"
                onClick={() => reply_func(message.id)}
              >
                <Reply className="mr-2 h-4 w-4" />{" "}
                {t("conversations.actions.reply")}
              </ContextMenuItem>

              {isMine && (
                <>
                  {(isTextMessage || canEditFileMessage) && (
                    <ContextMenuItem
                      className="cursor-pointer"
                      onClick={() => edit_func(message.id)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />{" "}
                      {t("conversations.actions.edit")}
                    </ContextMenuItem>
                  )}
                </>
              )}

              {reactionDetails.length > 0 && (
                <ContextMenuItem
                  className="cursor-pointer"
                  onClick={() => setReactionsPanelOpen(true)}
                >
                  <Smile className="mr-2 h-4 w-4" />{" "}
                  {t("conversations.actions.view_reactions", "Reactions")}
                </ContextMenuItem>
              )}

              {isFileMessage && isImageFile && (
                <>
                  <ContextMenuSeparator />

                  <ContextMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      void downloadFile();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />{" "}
                    {t("conversations.actions.save_as")}
                  </ContextMenuItem>
                </>
              )}

              {isMine && (
                <>
                  <ContextMenuSeparator />

                  <ContextMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />{" "}
                    {t("conversations.actions.delete")}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )}

      <ReactionsPanel
        open={ReactionsPanelOpen}
        onOpenChange={setReactionsPanelOpen}
        reactionDetails={reactionDetails}
        myUserId={myUserId}
        add_reaction_func={add_reaction_func}
        remove_reaction_func={remove_reaction_func}
        text={text}
        fileName={fileName}
        logText={logText}
        isFileMessage={isFileMessage}
        isMine={isMine}
      />

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
