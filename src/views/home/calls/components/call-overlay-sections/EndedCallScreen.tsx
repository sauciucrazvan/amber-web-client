import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PeerHeader } from "./PeerHeader";
import type { EndedCallScreenProps } from "./types";

export function EndedCallScreen({
  peerDisplayName,
  peerFallback,
  peerOnline,
  peerAvatar,
  endedTitle,
  durationLabel,
  isRejected,
  closeLabel,
  onClose,
}: EndedCallScreenProps) {
  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <Badge
            className="mx-auto"
            variant={isRejected ? "destructive" : "secondary"}
          >
            {endedTitle}
          </Badge>
          <PeerHeader
            peerDisplayName={peerDisplayName}
            peerFallback={peerFallback}
            peerOnline={peerOnline}
            peerAvatar={peerAvatar}
          />
        </CardHeader>

        <CardContent className="text-center text-sm text-muted-foreground">
          {durationLabel}
        </CardContent>

        <CardFooter className="justify-center pt-0">
          <Button
            variant="secondary"
            className="cursor-pointer"
            onClick={onClose}
          >
            {closeLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
