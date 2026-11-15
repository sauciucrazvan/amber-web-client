import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { useTranslation } from "react-i18next";
import type { MessageReactionDetails } from "../types";

interface ReactionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reactionDetails: MessageReactionDetails[];
  myUserId: number | null;
  add_reaction_func?: (emoji: string) => void;
  remove_reaction_func?: (emoji: string) => void;
  text: string;
  fileName: string;
  logText: string;
  isFileMessage: boolean;
  isMine: boolean;
}

export default function ReactionsPanel({
  open,
  onOpenChange,
  reactionDetails,
  myUserId,
  add_reaction_func,
  remove_reaction_func,
  text,
  fileName,
  isFileMessage,
  isMine,
}: ReactionsPanelProps) {
  const { t } = useTranslation();

  const sortedReactions = [...reactionDetails].sort((a, b) => {
    const aMine = myUserId !== null && a.user_ids.includes(myUserId);
    const bMine = myUserId !== null && b.user_ids.includes(myUserId);

    if (aMine !== bMine) return aMine ? -1 : 1;

    return b.count - a.count;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {t("conversations.reactions.title", "Reactions")}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="space-y-5 px-6 pb-6">
          <Bubble variant={isMine ? "default" : "muted"}>
            <BubbleContent className="whitespace-pre-wrap wrap-break-word text-sm">
              {text || (isFileMessage && fileName)}
            </BubbleContent>
          </Bubble>

          <div>
            <div className="grid grid-cols-4 gap-3">
              {sortedReactions.map((reaction) => {
                const hasReacted =
                  myUserId !== null && reaction.user_ids.includes(myUserId);

                return (
                  <Tooltip key={reaction.emoji}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasReacted) {
                            remove_reaction_func?.(reaction.emoji);
                          } else {
                            add_reaction_func?.(reaction.emoji);
                          }
                        }}
                        className={`cursor-pointer flex h-20 flex-col items-center justify-center rounded-xl border transition-all ${
                          hasReacted
                            ? "border-border bg-secondary hover:bg-secondary/80 text-primary shadow-sm"
                            : "border-border bg-card hover:bg-accent"
                        }`}
                      >
                        <span className="text-3xl leading-none">
                          {reaction.emoji}
                        </span>

                        <span
                          className={`mt-2 text-sm font-semibold ${
                            !hasReacted ? "text-muted-foreground" : ""
                          }`}
                        >
                          {reaction.count}
                        </span>
                      </button>
                    </TooltipTrigger>

                    <TooltipContent>
                      {hasReacted
                        ? t("conversations.reactions.remove", "Remove reaction")
                        : t("conversations.reactions.add", "Add reaction")}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t(
              "conversations.reactions.hint",
              "Tap an emoji to add or remove your reaction.",
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
