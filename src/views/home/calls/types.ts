import type { SignalData } from "simple-peer";

export type ContactPeer = {
  id?: number;
  username: string;
  displayName: string;
  avatar_url?: string | null;
  online?: boolean;
};

export type CallMode = "audio" | "video";

export type CallScreen =
  | "idle"
  | "outgoing"
  | "incoming"
  | "rejected"
  | "in-progress"
  | "ended";

export type AudioOutputDevice = {
  deviceId: string;
  label: string;
};

export type CallSummaryPayload = {
  call_id: string;
  status: string;
  call_mode?: CallMode;
  peer?: {
    id?: number;
    username: string;
    display_name?: string;
    full_name?: string;
    avatar_url?: string | null;
  };
  duration_seconds?: number;
  end_reason?: string | null;
};

export type StartCallTarget = {
  id?: number;
  username: string;
  full_name?: string;
  avatar_url?: string | null;
  online?: boolean;
};

export type CallContextValue = {
  screen: CallScreen;
  callMode: CallMode;
  callId: string | null;
  peer: ContactPeer | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteVideoEnabled: boolean;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  isMobileDevice: boolean;
  canSwitchCamera: boolean;
  audioOutputs: AudioOutputDevice[];
  selectedAudioOutputId: string;
  callDurationSeconds: number;
  lastEndReason: string | null;
  startCall: (target: StartCallTarget, mode?: CallMode) => Promise<void>;
  cancelOutgoingCall: () => void;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCall: () => void;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  switchCamera: () => Promise<void>;
  selectAudioOutput: (deviceId: string) => void;
  dismissOverlay: () => void;
};

export type SignalingMessage = {
  type?: string;
  event?: string;
  payload?: Record<string, unknown>;
  code?: string;
  message?: string;
};

export type QueueSignal = SignalData;
