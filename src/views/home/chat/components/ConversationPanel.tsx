import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import UserAvatar from "@/components/common/user-avatar";
import UserProfile from "@/views/dialogs/UserProfile";
import { useCalls } from "@/views/home/calls";
import {
  Edit2,
  File as FileIcon,
  FileArchive,
  FileCode,
  FileText,
  Paperclip,
  Phone,
  Reply,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "../context/ChatContext";
import ChatBubble from "./ChatBubble";
import { useConversationLogic } from "../hooks/useConversationLogic";
import { useReactions } from "../hooks/useReactions";
import type { MessageItem } from "../types";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn, formatRelativeTime } from "@/lib/utils";
import EmojiPanel from "./EmojiPanel";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";

function formatBytes(bytes?: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(contentType?: string) {
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

  return <FileIcon className={`${baseClasses} opacity-70`} />;
}

type ConversationRow =
  | {
      type: "date";
      key: string;
      date: string;
    }
  | {
      type: "message";
      key: string;
      message: MessageItem;
    };

export default function ConversationPanel() {
  const { accessToken, authFetch } = useAuth();
  const { activeChat, closeChat } = useChat();
  const { startCall, screen } = useCalls();
  const { t, i18n } = useTranslation();

  const conversationId = activeChat?.conversation.id;
  const {
    messages,
    messageText,
    setMessageText,
    selectedFile,
    setSelectedFile,
    replyTo,
    setReplyTo,
    editing,
    setEditing,
    isLoading,
    isLoadingMore,
    myUserId,
    canSend,
    textareaRef,
    scrollContainerRef,
    bottomRef,
    formatMessageDate,
    onSend,
    onDelete,
    onReply,
    onEdit,
    onScroll,
    setMessages,
  } = useConversationLogic({
    accessToken,
    authFetch,
    conversationId,
    peerUserId: activeChat?.otherUser.id,
    t,
    language: i18n.language,
  });

  const { addReaction, removeReaction } = useReactions({
    conversationId,
    authFetch,
    t,
    setMessages,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const cancelComposerModes = useCallback(() => {
    setEditing(null);
    setReplyTo(null);
    setSelectedFile(null);
    setMessageText("");
  }, [setEditing, setMessageText, setReplyTo, setSelectedFile]);

  useEffect(() => {
    if (!editing && !replyTo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cancelComposerModes();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cancelComposerModes, editing, replyTo]);

  useEffect(() => {
    const preventWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("dragover", preventWindowDrop, false);
    window.addEventListener("drop", preventWindowDrop, false);

    return () => {
      window.removeEventListener("dragover", preventWindowDrop, false);
      window.removeEventListener("drop", preventWindowDrop, false);
    };
  }, []);

  const VIRTUALIZE_MESSAGES_THRESHOLD = 120;
  const shouldVirtualize = messages.length >= VIRTUALIZE_MESSAGES_THRESHOLD;

  const rows = useMemo<ConversationRow[]>(() => {
    const nextRows: ConversationRow[] = [];
    let previousDate: string | null = null;

    for (const message of messages) {
      const currentDate = formatMessageDate(message.created_at);
      if (currentDate !== previousDate) {
        nextRows.push({
          type: "date",
          key: `date-${currentDate}-${message.id}`,
          date: currentDate,
        });
      }

      nextRows.push({
        type: "message",
        key: message.id,
        message,
      });

      previousDate = currentDate;
    }

    return nextRows;
  }, [formatMessageDate, messages]);

  const messageRowIndexById = useMemo(() => {
    const indexMap = new Map<string, number>();
    rows.forEach((row, index) => {
      if (row.type !== "message") return;
      indexMap.set(row.message.id, index);
    });
    return indexMap;
  }, [rows]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => (rows[index]?.type === "date" ? 34 : 88),
    overscan: 10,
  });

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const rowIndex = messageRowIndexById.get(messageId);
      if (rowIndex === undefined) return;

      if (shouldVirtualize) {
        rowVirtualizer.scrollToIndex(rowIndex, {
          align: "center",
        });

        window.requestAnimationFrame(() => {
          const element = document.getElementById(`message-${messageId}`);
          if (!element) return;
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
        return;
      }

      const element = document.getElementById(`message-${messageId}`);
      if (!element) return;
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [messageRowIndexById, rowVirtualizer, shouldVirtualize],
  );

  const isOnline = Boolean(activeChat?.otherUser.online);
  const lastActiveLabel = formatRelativeTime(
    t,
    activeChat?.otherUser.last_active_at,
  );
  const [showLastActivity, setShowLastActivity] = useState(false);

  useEffect(() => {
    if (isOnline || !lastActiveLabel) {
      setShowLastActivity(false);
      return;
    }

    setShowLastActivity(false);
    const intervalId = window.setInterval(() => {
      setShowLastActivity((current) => !current);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOnline, lastActiveLabel]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (editing) return;

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
      setIsDragging(true);
    },
    [editing],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (editing) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    },
    [editing, setSelectedFile],
  );

  if (!activeChat) return null;

  return (
    <section
      className={cn(
        "relative flex h-full w-full flex-col pt-2 transition-colors duration-150",
        isDragging &&
          !editing &&
          "bg-primary/3 shadow-[inset_0_0_0_2px_rgba(var(--primary),0.15)]",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && !editing && (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col items-center justify-center border-2 border-dashed border-primary/40 m-2 rounded-xl bg-background/50 backdrop-blur-xs transition-all duration-150 animate-in fade-in">
          <Paperclip className="size-10 text-primary animate-bounce" />
        </div>
      )}

      <div className="border-b">
        <div className="mb-1 flex items-center justify-between px-4 pb-1">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <UserProfile
              username={activeChat.otherUser.username}
              trigger={
                <button
                  type="button"
                  className="flex min-w-0 w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors cursor-pointer"
                >
                  <UserAvatar
                    full_name={activeChat.otherUser.full_name}
                    username={activeChat.otherUser.username}
                    isOnline={activeChat.otherUser.online}
                    avatarUrl={activeChat.otherUser.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold">
                      {activeChat.otherUser.full_name}
                    </h2>
                    <div className="relative h-4 truncate text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "absolute inset-0 transition-opacity duration-500",
                          showLastActivity && lastActiveLabel
                            ? "opacity-0"
                            : "opacity-100",
                        )}
                      >
                        @{activeChat.otherUser.username}
                      </span>
                      <span
                        className={cn(
                          "absolute inset-0 transition-opacity duration-500",
                          showLastActivity && lastActiveLabel
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      >
                        {t("stats.last_active", "Last active")}{" "}
                        {isOnline ? t("common.now", "now") : lastActiveLabel}
                      </span>
                    </div>
                  </div>
                </button>
              }
            />
          </div>

          <ButtonGroup>
            <ButtonGroup className="inline-flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      if (!activeChat) return;
                      void startCall(
                        {
                          id: activeChat.otherUser.id,
                          username: activeChat.otherUser.username,
                          full_name: activeChat.otherUser.full_name,
                          avatar_url: activeChat.otherUser.avatar_url,
                          online: activeChat.otherUser.online,
                        },
                        "audio",
                      );
                    }}
                    disabled={screen !== "idle" || !activeChat.otherUser.online}
                  >
                    <Phone className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeChat.otherUser.online
                    ? t("calls.actions.startAudio")
                    : t("calls.actions.contactOffline")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      if (!activeChat) return;
                      void startCall(
                        {
                          id: activeChat.otherUser.id,
                          username: activeChat.otherUser.username,
                          full_name: activeChat.otherUser.full_name,
                          avatar_url: activeChat.otherUser.avatar_url,
                          online: activeChat.otherUser.online,
                        },
                        "video",
                      );
                    }}
                    disabled={screen !== "idle" || !activeChat.otherUser.online}
                  >
                    <Video className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeChat.otherUser.online
                    ? t("calls.actions.startVideo")
                    : t("calls.actions.contactOffline")}
                </TooltipContent>
              </Tooltip>
            </ButtonGroup>
            <ButtonGroup>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={closeChat}
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("conversations.close", "Close chat")}
                </TooltipContent>
              </Tooltip>
            </ButtonGroup>
          </ButtonGroup>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4"
        onScroll={onScroll}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("conversations.no_messages")}
          </div>
        ) : shouldVirtualize ? (
          <div className="relative w-full py-1" style={{ minHeight: "100%" }}>
            {isLoadingMore ? (
              <div className="flex justify-center py-2 text-muted-foreground">
                <Spinner />
              </div>
            ) : null}

            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;

                return (
                  <div
                    key={row.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={`absolute left-0 top-0 w-full ${row.type === "message" ? "pb-2" : ""}`}
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                    id={
                      row.type === "message"
                        ? `message-${row.message.id}`
                        : undefined
                    }
                  >
                    {row.type === "date" ? (
                      <div className="flex justify-center py-3">
                        <Badge variant="outline" className="px-3">
                          {row.date}
                        </Badge>
                      </div>
                    ) : (
                      <ChatBubble
                        myUserId={myUserId}
                        message={row.message}
                        otherUserName={activeChat.otherUser.full_name}
                        onScrollToMessage={scrollToMessage}
                        edit_func={() => onEdit(row.message.id)}
                        reply_func={() => onReply(row.message.id)}
                        delete_func={() => onDelete(row.message.id)}
                        add_reaction_func={(emoji) =>
                          addReaction(row.message.id, emoji)
                        }
                        remove_reaction_func={(emoji) =>
                          removeReaction(row.message.id, emoji)
                        }
                      />
                    )}
                  </div>
                );
              })}
              <div
                ref={bottomRef}
                className="absolute left-0 h-px w-full"
                style={{ top: `${rowVirtualizer.getTotalSize()}px` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-2 py-1">
            {isLoadingMore ? (
              <div className="flex justify-center py-2 text-muted-foreground">
                <Spinner />
              </div>
            ) : null}
            {messages.map((message, index) => {
              const currentDate = formatMessageDate(message.created_at);
              const previousDate =
                index > 0
                  ? formatMessageDate(messages[index - 1].created_at)
                  : null;
              const showDateSeparator = currentDate !== previousDate;

              return (
                <div key={message.id} id={`message-${message.id}`}>
                  {showDateSeparator && (
                    <div className="flex justify-center py-3">
                      <Badge variant="outline" className="px-3">
                        {currentDate}
                      </Badge>
                    </div>
                  )}
                  <ChatBubble
                    myUserId={myUserId}
                    message={message}
                    otherUserName={activeChat.otherUser.full_name}
                    onScrollToMessage={scrollToMessage}
                    edit_func={() => onEdit(message.id)}
                    reply_func={() => onReply(message.id)}
                    delete_func={() => onDelete(message.id)}
                    add_reaction_func={(emoji) =>
                      addReaction(message.id, emoji)
                    }
                    remove_reaction_func={(emoji) =>
                      removeReaction(message.id, emoji)
                    }
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t overflow-hidden">
        {editing && (
          <div className="w-full inline-flex justify-between items-center gap-2 px-4 pt-2 pb-1">
            <div className="min-w-0 flex-1 border-l-4 px-3 py-2 rounded-r-md rounded-l-sm text-left transition-colors flex flex-col bg-muted-foreground/10 border-muted-foreground/30 text-foreground">
              <span className="text-xs font-semibold mb-0.5 text-muted-foreground inline-flex items-center gap-1.5">
                <Edit2 className="size-3.5" />
                {t("conversations.editing_message", "Editing message")}
              </span>
              <span className="text-sm inline-flex items-center gap-1 opacity-90 line-clamp-2 w-full">
                {editing.type === "file" ? (
                  <>
                    <Paperclip size="14" className="shrink-0" />
                    <span className="truncate">
                      {editing.content.filename ||
                        t("conversations.files.attachment", "Attachment")}
                    </span>
                  </>
                ) : (
                  <span className="line-clamp-2 text-left wrap-break-word w-full">
                    {editing.content.text}
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={cancelComposerModes}
              aria-label={t("common.cancel", "Cancel")}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {replyTo && (
          <div className="w-full inline-flex justify-between items-center gap-2 px-4 pt-2 pb-1">
            <div className="min-w-0 flex-1 border-l-4 px-3 py-2 rounded-r-md rounded-l-sm text-left transition-colors flex flex-col bg-muted-foreground/10 border-muted-foreground/30 text-foreground">
              <span className="text-xs font-semibold mb-0.5 text-muted-foreground inline-flex items-center gap-1.5">
                <Reply className="size-3.5" />
                {replyTo.sender_id === myUserId
                  ? t("conversations.you")
                  : activeChat.otherUser.full_name}
              </span>
              <span className="text-sm inline-flex items-center gap-1 opacity-90 line-clamp-2 w-full">
                {replyTo.type === "file" ? (
                  <>
                    <Paperclip size="14" className="shrink-0" />
                    <span className="truncate">
                      {replyTo.content.filename ||
                        t("conversations.files.attachment", "Attachment")}
                    </span>
                  </>
                ) : (
                  <span className="line-clamp-2 text-left wrap-break-word w-full">
                    {replyTo.content.text}
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={cancelComposerModes}
              aria-label={t("common.cancel", "Cancel")}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {selectedFile && (
          <div className="w-full inline-flex justify-between items-center gap-2 px-4 pt-2 pb-1">
            <Attachment className="w-full min-w-0">
              <AttachmentMedia>
                {getFileIcon(selectedFile.type)}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{selectedFile.name}</AttachmentTitle>
                <AttachmentDescription>
                  {(() => {
                    const extension = selectedFile.name.includes(".")
                      ? selectedFile.name.split(".").pop()?.toUpperCase()
                      : "";
                    return `${extension ? `${extension} • ` : ""}${formatBytes(selectedFile.size)}`;
                  })()}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  aria-label={t("common.remove", "Remove")}
                >
                  <X className="size-4" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          </div>
        )}
        <div className="flex min-w-0 px-4 pt-2 pb-2 gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />
          <ButtonGroup>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t("conversations.attach_file", "Attach file")}
              className="shrink-0 cursor-pointer"
              disabled={Boolean(editing)}
            >
              <Paperclip className="size-4" />
            </Button>
            <EmojiPanel
              onEmojiSelect={(emoji) =>
                setMessageText((current) => current + emoji)
              }
              customTrigger={
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 cursor-pointer"
                >
                  <Smile className="size-4" />
                </Button>
              }
              closeOnSelect={false}
            />
          </ButtonGroup>

          <ButtonGroup className="w-full">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t("conversations.type_message")}
              className="min-h-9 max-h-9 min-w-0 max-w-full w-full flex-1 resize-none field-sizing-fixed overflow-x-hidden overflow-y-hidden wrap-break-word"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelComposerModes();
                  return;
                }

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onSend}
              disabled={!canSend}
              aria-label={t("conversations.send_message")}
              className="shrink-0 cursor-pointer"
            >
              <Send className="size-4" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </section>
  );
}
