import UserAvatar from "@/components/common/user-avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { PeerHeaderProps } from "./types";

export function PeerHeader({
  peerDisplayName,
  peerFallback,
  peerOnline,
  peerAvatar,
}: PeerHeaderProps) {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 text-left">
      <UserAvatar
        full_name={peerDisplayName}
        username={peerFallback}
        isOnline={peerOnline}
        avatarUrl={peerAvatar}
        size="md"
      />
      <div className="min-w-0">
        <CardTitle className="truncate text-base font-semibold">
          {peerDisplayName}
        </CardTitle>
        <CardDescription className="truncate">@{peerFallback}</CardDescription>
      </div>
    </div>
  );
}
