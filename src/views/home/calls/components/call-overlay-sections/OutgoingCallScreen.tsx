import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PhoneOff } from "lucide-react";
import { PeerHeader } from "./PeerHeader";
import type { OutgoingCallScreenProps } from "./types";

export function OutgoingCallScreen({
  peerDisplayName,
  peerFallback,
  peerOnline,
  peerAvatar,
  outgoingBadge,
  waitingLabel,
  cancelLabel,
  onCancel,
}: OutgoingCallScreenProps) {
  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <Badge variant="secondary" className="mx-auto">
            {outgoingBadge}
          </Badge>
          <PeerHeader
            peerDisplayName={peerDisplayName}
            peerFallback={peerFallback}
            peerOnline={peerOnline}
            peerAvatar={peerAvatar}
          />
        </CardHeader>

        <CardContent className="text-center text-sm text-muted-foreground">
          {waitingLabel}
        </CardContent>

        <CardFooter className="justify-center pt-0">
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={onCancel}
          >
            <PhoneOff /> {cancelLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
