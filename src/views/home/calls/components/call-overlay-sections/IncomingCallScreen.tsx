import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { CircleHelp, Phone, PhoneCall, PhoneOff, Video } from "lucide-react";
import { PeerHeader } from "./PeerHeader";
import type { IncomingCallScreenProps } from "./types";

export function IncomingCallScreen({
  peerDisplayName,
  peerFallback,
  peerOnline,
  peerAvatar,
  incomingBadgeLabel,
  incomingCallMode,
  declineLabel,
  answerLabel,
  onDecline,
  onAnswer,
}: IncomingCallScreenProps) {
  const BadgeIcon =
    incomingCallMode === "audio"
      ? PhoneCall
      : incomingCallMode === "video"
        ? Video
        : CircleHelp;

  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <Badge className="mx-auto gap-2" variant="default">
            <BadgeIcon className="h-3.5 w-3.5" />
            {incomingBadgeLabel}
          </Badge>
          <PeerHeader
            peerDisplayName={peerDisplayName}
            peerFallback={peerFallback}
            peerOnline={peerOnline}
            peerAvatar={peerAvatar}
          />
        </CardHeader>

        <CardFooter className="justify-center gap-3 pt-0">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onDecline}
          >
            <PhoneOff /> {declineLabel}
          </Button>
          <Button className="cursor-pointer" onClick={onAnswer}>
            <Phone /> {answerLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
