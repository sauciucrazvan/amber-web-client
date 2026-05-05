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
import { Edit2, Phone, Reply, Send, Video, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "../context/ChatContext";
import ChatBubble from "./ChatBubble";
import { useConversationLogic } from "../hooks/useConversationLogic";
import type { MessageItem } from "../types";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn, formatRelativeTime } from "@/lib/utils";

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
  } = useConversationLogic({
    accessToken,
    authFetch,
    conversationId,
    peerUserId: activeChat?.otherUser.id,
    t,
    language: i18n.language,
  });

  const cancelComposerModes = useCallback(() => {
    setEditing(null);
    setReplyTo(null);
    setMessageText("");
  }, [setEditing, setReplyTo, setMessageText]);

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
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOnline, lastActiveLabel]);

  if (!activeChat) return null;

  return (
    <section className="flex h-full w-full flex-col pt-2">
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
                        {lastActiveLabel}
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
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-border" />
                        <div className="text-xs text-muted-foreground px-2">
                          {row.date}
                        </div>
                        <div className="flex-1 h-px bg-border" />
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
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-border" />
                      <div className="text-xs text-muted-foreground px-2">
                        {currentDate}
                      </div>
                      <div className="flex-1 h-px bg-border" />
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
            <div className="inline-flex min-w-0 items-start gap-2">
              <Edit2 className="size-8 mt-0.5 text-muted-foreground" />
              <div className="w-full bg-primary/5 p-2 rounded-sm whitespace-pre-wrap break-all wrap-anywhere">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {t("conversations.you")}
                </p>
                <p className="text-sm">{editing.content.text}</p>
              </div>
            </div>
            <Button
              variant={"ghost"}
              className="cursor-pointer"
              onClick={cancelComposerModes}
            >
              <X />
            </Button>
          </div>
        )}
        {replyTo && (
          <div className="w-full inline-flex justify-between items-center gap-2 px-4 pt-2 pb-1">
            <div className="inline-flex min-w-0 items-start gap-2">
              <Reply className="size-8 mt-0.5 text-muted-foreground" />
              <div className="w-full bg-primary/5 p-2 rounded-sm whitespace-pre-wrap break-all wrap-anywhere">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {replyTo.sender_id === myUserId
                    ? t("conversations.you")
                    : activeChat.otherUser.full_name}
                </p>
                <p className="text-sm">{replyTo.content.text}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer"
              onClick={cancelComposerModes}
            >
              <X />
            </Button>
          </div>
        )}
        <div className="flex min-w-0 px-4 pt-2 pb-2">
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
