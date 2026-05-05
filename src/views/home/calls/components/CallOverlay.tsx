import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  EndedCallScreen,
  IncomingCallScreen,
  OutgoingCallScreen,
} from "./CallOverlaySections.tsx";
import { useCalls } from "../context/CallContext";
import { formatDuration } from "../utils";

export default function CallOverlay() {
  const { t } = useTranslation();

  const {
    screen,
    callMode,
    peer,
    callDurationSeconds,
    lastEndReason,
    cancelOutgoingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    dismissOverlay,
  } = useCalls();

  const peerDisplayName =
    peer?.displayName || peer?.username || t("calls.unknown");
  const peerFallback = peer?.username || t("calls.unknown");

  const endedTitle = useMemo(() => {
    if (screen === "rejected") return t("calls.status.rejected");

    if (lastEndReason === "missed") return t("calls.status.missed");
    if (lastEndReason === "failed") return t("calls.status.failed");

    return t("calls.status.ended");
  }, [lastEndReason, screen, t]);

  if (screen === "idle" || screen === "in-progress") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100">
      {screen === "outgoing" && (
        <OutgoingCallScreen
          peerDisplayName={peerDisplayName}
          peerFallback={peerFallback}
          peerOnline={peer?.online}
          peerAvatar={peer?.avatar_url}
          outgoingBadge={t("calls.badge.outgoing")}
          waitingLabel={t("calls.outgoing.waiting")}
          cancelLabel={t("calls.actions.cancelCall")}
          onCancel={cancelOutgoingCall}
        />
      )}

      {screen === "incoming" && (
        <IncomingCallScreen
          peerDisplayName={peerDisplayName}
          peerFallback={peerFallback}
          peerOnline={peer?.online}
          peerAvatar={peer?.avatar_url}
          incomingBadgeLabel={
            callMode === "audio"
              ? t("calls.badge.incomingAudioCall", {
                  defaultValue: "Incoming audio call",
                })
              : callMode === "video"
                ? t("calls.badge.incomingVideoCall", {
                    defaultValue: "Incoming video call",
                  })
                : t("calls.badge.incomingCall", {
                    defaultValue: "Incoming call",
                  })
          }
          incomingCallMode={callMode}
          declineLabel={t("calls.actions.decline")}
          answerLabel={t("calls.actions.answer")}
          onDecline={rejectIncomingCall}
          onAnswer={() => {
            void acceptIncomingCall();
          }}
        />
      )}

      {(screen === "rejected" || screen === "ended") && (
        <EndedCallScreen
          peerDisplayName={peerDisplayName}
          peerFallback={peerFallback}
          peerOnline={peer?.online}
          peerAvatar={peer?.avatar_url}
          endedTitle={endedTitle}
          durationLabel={t("calls.ended.duration", {
            duration: formatDuration(callDurationSeconds),
          })}
          isRejected={screen === "rejected"}
          closeLabel={t("calls.actions.close")}
          onClose={dismissOverlay}
        />
      )}
    </div>
  );
}
