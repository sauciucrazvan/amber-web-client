import ErrorBox from "@/components/common/error-box";
import UserAvatar from "@/components/common/user-avatar";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import type { TFunction } from "i18next";
import type { CallHistoryItem, ContactListItem } from "../types";
import { formatRelativeTime } from "../../../../lib/utils";

type CallHistoryTabContentProps = {
  t: TFunction;
  callHistory: CallHistoryItem[];
  callHistoryError: unknown;
  isCallHistoryLoading: boolean;
  openingChatUserId: number | null;
  onOpenDirectChat: (contact: ContactListItem["user"]) => Promise<void>;
};

function formatDuration(totalSeconds?: number) {
  const seconds = Math.max(0, totalSeconds ?? 0);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function getCallReasonLabel(t: TFunction, reason: string) {
  return t([`calls.history.reasons.${reason}`, `calls.status.${reason}`], {
    defaultValue: reason.replace(/_/g, " "),
  });
}

export default function CallHistoryTabContent({
  t,
  callHistory,
  callHistoryError,
  isCallHistoryLoading,
  openingChatUserId,
  onOpenDirectChat,
}: CallHistoryTabContentProps) {
  if (isCallHistoryLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-4 gap-3 shrink-0">
        <h2 className="text-lg font-semibold">
          {t("calls.history.title", "Call history")}
        </h2>
      </div>

      <SidebarGroup className="flex-1 min-h-0 pt-2">
        <SidebarMenu className="flex-1 min-h-0 overflow-y-auto pr-1">
          {callHistoryError ? (
            <SidebarMenuItem>
              <ErrorBox>
                {t(
                  "calls.history.failedLoading",
                  "Failed loading call history",
                )}
              </ErrorBox>
            </SidebarMenuItem>
          ) : callHistory.length > 0 ? (
            callHistory.map((call) => {
              const relativeTimeLabel = formatRelativeTime(
                t,
                call.started_at || call.ended_at,
              );
              const reason = call.end_reason || call.status;
              const reasonLabel = getCallReasonLabel(t, reason);
              const isMissed =
                call.status === "missed" ||
                call.end_reason === "missed" ||
                call.end_reason === "timeout" ||
                call.end_reason === "failed" ||
                call.end_reason === "rejected" ||
                call.status === "failed";

              return (
                <SidebarMenuItem key={call.call_id}>
                  <button
                    type="button"
                    className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/40 transition cursor-pointer"
                    onClick={() =>
                      onOpenDirectChat({
                        id: call.peer.id,
                        username: call.peer.username,
                        full_name: call.peer.display_name || call.peer.username,
                        avatar_url: call.peer.avatar_url,
                        online: undefined,
                        last_active_at: call.peer.last_active_at ?? null,
                      })
                    }
                    aria-busy={openingChatUserId === call.peer.id}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        full_name={call.peer.display_name || call.peer.username}
                        username={call.peer.username}
                        avatarUrl={call.peer.avatar_url}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {call.peer.display_name || call.peer.username}
                        </p>

                        <div className="mt-0.5 flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
                          <span
                            className={`capitalize ${isMissed ? "text-red-400 font-medium" : ""}`}
                          >
                            {reasonLabel}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {relativeTimeLabel && relativeTimeLabel}
                        {call.duration_seconds !== 0 &&
                          ` • ${formatDuration(call.duration_seconds)}`}
                      </span>
                    </div>
                  </button>
                </SidebarMenuItem>
              );
            })
          ) : (
            <SidebarMenuItem>
              <span className="mx-1 px-1 text-xs text-muted-foreground">
                {t("calls.history.empty", "No calls yet")}
              </span>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
