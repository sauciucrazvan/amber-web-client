import type { CallMode } from "../../types";

export type PeerHeaderProps = {
  peerDisplayName: string;
  peerFallback: string;
  peerOnline?: boolean;
  peerAvatar?: string | null;
};

export type OutgoingCallScreenProps = PeerHeaderProps & {
  outgoingBadge: string;
  waitingLabel: string;
  cancelLabel: string;
  onCancel: () => void;
};

export type IncomingCallScreenProps = PeerHeaderProps & {
  incomingBadgeLabel: string;
  incomingCallMode: CallMode | null;
  declineLabel: string;
  answerLabel: string;
  onDecline: () => void;
  onAnswer: () => void;
};

export type EndedCallScreenProps = PeerHeaderProps & {
  endedTitle: string;
  durationLabel: string;
  isRejected: boolean;
  closeLabel: string;
  onClose: () => void;
};
