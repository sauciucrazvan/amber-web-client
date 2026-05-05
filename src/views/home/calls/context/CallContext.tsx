import {
  useAuth,
  WS_MESSAGE_EVENT_NAME,
  WS_SEND_EVENT_NAME,
} from "@/auth/AuthContext";
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { Instance, SignalData } from "simple-peer";
import Peer from "simple-peer/simplepeer.min.js";
import { toast } from "sonner";
import { getSettings, setSettings } from "@/platform";
import type {
  AudioOutputDevice,
  CallContextValue,
  CallMode,
  CallScreen,
  CallSummaryPayload,
  ContactPeer,
  QueueSignal,
  SignalingMessage,
  StartCallTarget,
} from "../types";
import { formatPeer, isMobileUserAgent, traceCall } from "../utils";

const CallContext = createContext<CallContextValue | null>(null);

const CALL_SCREEN_TIMEOUT_MS = 4_000;

type MediaPreferences = {
  preferredMicrophoneId?: string;
  preferredCameraId?: string;
  preferredSpeakerId?: string;
};

function resolveCallMode(value: unknown): CallMode | null {
  if (value === "audio" || value === "video") {
    return value;
  }

  return null;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const { t } = useTranslation();

  const [screen, setScreen] = useState<CallScreen>("idle");
  const [callMode, setCallMode] = useState<CallMode>("video");
  const [callId, setCallId] = useState<string | null>(null);
  const [peer, setPeer] = useState<ContactPeer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [audioOutputs, setAudioOutputs] = useState<AudioOutputDevice[]>([]);
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState("default");
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [lastEndReason, setLastEndReason] = useState<string | null>(null);

  const isMobileDevice = useMemo(() => isMobileUserAgent(), []);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  const peerRef = useRef<Instance | null>(null);
  const pendingSignalsRef = useRef<QueueSignal[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const pendingOutgoingCancelRef = useRef(false);
  const acceptingIncomingCallRef = useRef(false);
  const callModeRef = useRef<CallMode>("video");
  const currentFacingModeRef = useRef<"user" | "environment">("user");

  const autoDismissTimeoutRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const incomingEventHandlerRef = useRef<
    (message: SignalingMessage) => Promise<void>
  >(async () => {});

  const clearAutoDismiss = useCallback(() => {
    if (autoDismissTimeoutRef.current) {
      window.clearTimeout(autoDismissTimeoutRef.current);
      autoDismissTimeoutRef.current = null;
    }
  }, []);

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current) {
      window.clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startDurationCounter = useCallback(() => {
    clearDurationInterval();
    setCallDurationSeconds(0);
    durationIntervalRef.current = window.setInterval(() => {
      setCallDurationSeconds((current) => current + 1);
    }, 1000);
  }, [clearDurationInterval]);

  const stopAndReleaseTracks = useCallback(() => {
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
    }
    localStreamRef.current = null;
    setLocalStream(null);

    setRemoteStream(null);
    setRemoteVideoEnabled(true);
  }, []);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    pendingSignalsRef.current = [];
  }, []);

  const softResetCallState = useCallback(() => {
    clearAutoDismiss();
    clearDurationInterval();
    setCallDurationSeconds(0);
    setCallId(null);
    activeCallIdRef.current = null;
    callModeRef.current = "video";
    setCallMode("video");
    setPeer(null);
    setLastEndReason(null);
  }, [clearAutoDismiss, clearDurationInterval]);

  const hardResetCallState = useCallback(() => {
    traceCall("call hard reset", {
      screen,
      call_id: activeCallIdRef.current,
      call_mode: callModeRef.current,
      last_end_reason: lastEndReason,
    });
    acceptingIncomingCallRef.current = false;
    destroyPeer();
    stopAndReleaseTracks();
    softResetCallState();
    setScreen("idle");
    setCameraEnabled(true);
    setMicrophoneEnabled(true);
  }, [
    destroyPeer,
    lastEndReason,
    screen,
    softResetCallState,
    stopAndReleaseTracks,
  ]);

  const sendSignal = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (!accessToken) {
        traceCall("sendSignal skipped (no access token)", { event });
        return false;
      }

      const message: Record<string, unknown> = {
        event,
        ...payload,
      };

      traceCall("sendSignal", message);
      window.dispatchEvent(
        new CustomEvent<Record<string, unknown>>(WS_SEND_EVENT_NAME, {
          detail: message,
        }),
      );
      return true;
    },
    [accessToken],
  );

  const sendMediaState = useCallback(
    (audioEnabled: boolean, videoEnabled: boolean) => {
      const nextCallId = activeCallIdRef.current;
      if (!nextCallId) return;
      sendSignal("call.media-state", {
        call_id: nextCallId,
        payload: {
          audio_enabled: audioEnabled,
          video_enabled: videoEnabled,
        },
      });
    },
    [sendSignal],
  );

  const refreshAudioOutputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputDevices = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label:
            device.label ||
            (index === 0 ? "Default speaker" : `Speaker ${index + 1}`),
        }));

      setAudioOutputs(outputDevices);
      if (
        outputDevices.length > 0 &&
        !outputDevices.some(
          (device) => device.deviceId === selectedAudioOutputId,
        )
      ) {
        setSelectedAudioOutputId(outputDevices[0].deviceId);
      }
    } catch {
      return;
    }
  }, [selectedAudioOutputId]);

  const refreshCameraAvailability = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput",
      );
      setCanSwitchCamera(isMobileDevice && videoInputs.length > 1);
    } catch {
      setCanSwitchCamera(false);
    }
  }, [isMobileDevice]);

  const getPreferredMediaDevices = useCallback(async () => {
    try {
      const settings = (await getSettings()) as MediaPreferences | undefined;

      return {
        preferredMicrophoneId: settings?.preferredMicrophoneId || "",
        preferredCameraId: settings?.preferredCameraId || "",
        preferredSpeakerId: settings?.preferredSpeakerId || "",
      };
    } catch {
      return {
        preferredMicrophoneId: "",
        preferredCameraId: "",
        preferredSpeakerId: "",
      };
    }
  }, []);

  const ensureLocalStream = useCallback(
    async (mode: CallMode = "video") => {
      if (localStreamRef.current) return localStreamRef.current;

      const { preferredMicrophoneId, preferredCameraId, preferredSpeakerId } =
        await getPreferredMediaDevices();

      if (preferredSpeakerId) {
        setSelectedAudioOutputId(preferredSpeakerId);
      }

      const requestedConstraints: MediaStreamConstraints = {
        video:
          mode === "video"
            ? preferredCameraId
              ? { deviceId: { exact: preferredCameraId } }
              : { facingMode: currentFacingModeRef.current }
            : false,
        audio: preferredMicrophoneId
          ? { deviceId: { exact: preferredMicrophoneId } }
          : true,
      };

      let stream: MediaStream;
      try {
        stream =
          await navigator.mediaDevices.getUserMedia(requestedConstraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video:
            mode === "video"
              ? { facingMode: currentFacingModeRef.current }
              : false,
          audio: true,
        });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraEnabled(stream.getVideoTracks().length > 0);
      setMicrophoneEnabled(true);

      return stream;
    },
    [getPreferredMediaDevices],
  );

  const applyPeerSignal = useCallback((signal: QueueSignal) => {
    if (!peerRef.current) {
      pendingSignalsRef.current.push(signal);
      return;
    }

    peerRef.current.signal(signal);
  }, []);

  const createPeer = useCallback(
    (initiator: boolean, nextCallId: string) => {
      destroyPeer();

      const stream = localStreamRef.current ?? undefined;
      let nextPeer: Instance;
      try {
        nextPeer = new Peer({
          initiator,
          // Use full SDP exchange to avoid candidate race/parsing issues.
          trickle: false,
          stream,
        }) as Instance;
      } catch (error) {
        traceCall("createPeer failed", error);
        throw error instanceof Error
          ? error
          : new Error("Failed creating WebRTC peer");
      }

      nextPeer.on("signal", (signalData) => {
        if (!activeCallIdRef.current || activeCallIdRef.current !== nextCallId)
          return;

        const signalPayload = signalData as SignalData;

        if (signalPayload.type === "offer" || signalPayload.type === "answer") {
          sendSignal(`webrtc.${signalPayload.type}`, {
            call_id: nextCallId,
            payload: {
              type: signalPayload.type,
              sdp: signalPayload.sdp,
            },
          });
          return;
        }

        if (signalPayload.type !== "candidate") {
          return;
        }

        const candidateValue = signalPayload.candidate;
        sendSignal("webrtc.ice-candidate", {
          call_id: nextCallId,
          payload: {
            candidate: candidateValue.candidate,
            sdpMLineIndex: candidateValue.sdpMLineIndex ?? undefined,
            sdpMid: candidateValue.sdpMid ?? undefined,
          },
        });
      });

      nextPeer.on("stream", (nextRemoteStream) => {
        setRemoteStream(nextRemoteStream);
      });

      nextPeer.on("close", () => {
        setRemoteStream(null);
      });

      nextPeer.on("error", (error) => {
        traceCall("peer error", {
          call_id: nextCallId,
          initiator,
          error,
        });
      });

      peerRef.current = nextPeer;

      if (pendingSignalsRef.current.length > 0) {
        const queued = [...pendingSignalsRef.current];
        pendingSignalsRef.current = [];
        for (const item of queued) {
          nextPeer.signal(item);
        }
      }
    },
    [destroyPeer, sendSignal],
  );

  const finishWithScreen = useCallback(
    (
      nextScreen: Exclude<
        CallScreen,
        "idle" | "incoming" | "outgoing" | "in-progress"
      >,
      endReason?: string | null,
      durationSeconds?: number,
    ) => {
      traceCall("call closing", {
        next_screen: nextScreen,
        end_reason: endReason ?? null,
        duration_seconds: durationSeconds ?? callDurationSeconds,
        call_id: activeCallIdRef.current,
        call_mode: callModeRef.current,
      });
      destroyPeer();
      stopAndReleaseTracks();
      clearDurationInterval();
      if (typeof durationSeconds === "number") {
        setCallDurationSeconds(durationSeconds);
      }
      if (endReason) {
        setLastEndReason(endReason);
      }
      setScreen(nextScreen);

      clearAutoDismiss();
      autoDismissTimeoutRef.current = window.setTimeout(() => {
        hardResetCallState();
      }, CALL_SCREEN_TIMEOUT_MS);
    },
    [
      clearAutoDismiss,
      clearDurationInterval,
      callDurationSeconds,
      destroyPeer,
      hardResetCallState,
      stopAndReleaseTracks,
    ],
  );

  const handleCallEnded = useCallback(
    (summary: CallSummaryPayload, explicitScreen?: "rejected" | "ended") => {
      const status =
        explicitScreen ||
        (summary.status === "rejected" ? "rejected" : "ended");
      finishWithScreen(
        status,
        summary.end_reason ?? null,
        summary.duration_seconds,
      );
    },
    [finishWithScreen],
  );

  const startCall = useCallback(
    async (target: StartCallTarget, mode: CallMode = "video") => {
      if (!target.online) {
        toast.error(t("calls.toasts.contactOffline"));
        return;
      }

      callModeRef.current = mode;
      setCallMode(mode);

      try {
        await ensureLocalStream(mode);
      } catch {
        toast.error(t("calls.toasts.mediaAccessFailed"));
        return;
      }

      setPeer(formatPeer(target));
      setLastEndReason(null);
      setScreen("outgoing");
      setCallId(null);
      activeCallIdRef.current = null;
      pendingOutgoingCancelRef.current = false;

      const sent = sendSignal("call.invite", {
        to: target.username,
        mode,
      });
      if (!sent) {
        toast.error(t("calls.toasts.connectionUnavailable"));
        hardResetCallState();
      }
    },
    [ensureLocalStream, hardResetCallState, sendSignal, t],
  );

  const cancelOutgoingCall = useCallback(() => {
    if (!activeCallIdRef.current) {
      if (screen === "outgoing") {
        sendSignal("call.cancel", {
          to: peer?.username,
        });
        pendingOutgoingCancelRef.current = true;
      }
      hardResetCallState();
      return;
    }

    pendingOutgoingCancelRef.current = false;
    sendSignal("call.cancel", {
      call_id: activeCallIdRef.current,
    });
  }, [hardResetCallState, peer?.username, screen, sendSignal]);

  const rejectIncomingCall = useCallback(() => {
    const nextCallId = activeCallIdRef.current;
    if (!nextCallId) {
      hardResetCallState();
      return;
    }

    sendSignal("call.reject", {
      call_id: nextCallId,
      reject_all: true,
    });
  }, [hardResetCallState, sendSignal]);

  const acceptIncomingCall = useCallback(async () => {
    const nextCallId = activeCallIdRef.current;
    if (!nextCallId) return;
    if (acceptingIncomingCallRef.current) return;

    acceptingIncomingCallRef.current = true;
    const mode = callModeRef.current;

    try {
      await ensureLocalStream(mode);
    } catch {
      toast.error(t("calls.toasts.mediaAccessFailed"));
      acceptingIncomingCallRef.current = false;
      return;
    }

    if (mode === "audio") {
      setCameraEnabled(false);
    }

    try {
      createPeer(false, nextCallId);
    } catch {
      toast.error(t("calls.toasts.initializeFailed"));
      hardResetCallState();
      acceptingIncomingCallRef.current = false;
      return;
    }

    setScreen("in-progress");
    setRemoteVideoEnabled(true);
    startDurationCounter();

    sendSignal("call.accept", {
      call_id: nextCallId,
    });

    acceptingIncomingCallRef.current = false;
  }, [
    createPeer,
    ensureLocalStream,
    hardResetCallState,
    sendSignal,
    startDurationCounter,
    t,
  ]);

  const endCall = useCallback(() => {
    const nextCallId = activeCallIdRef.current;
    if (!nextCallId) {
      hardResetCallState();
      return;
    }

    sendSignal("call.end", {
      call_id: nextCallId,
      reason: "ended",
    });
  }, [hardResetCallState, sendSignal]);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();

    if (videoTracks.length > 0) {
      const [videoTrack] = videoTracks;
      if (videoTrack.readyState === "ended") {
        stream.removeTrack(videoTrack);
      } else {
        const nextEnabled = !videoTrack.enabled;
        videoTrack.enabled = nextEnabled;
        setCameraEnabled(nextEnabled);
        sendMediaState(microphoneEnabled, nextEnabled);
        return;
      }
    }

    try {
      const { preferredCameraId } = await getPreferredMediaDevices();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: preferredCameraId
          ? { deviceId: { exact: preferredCameraId } }
          : { facingMode: currentFacingModeRef.current },
        audio: false,
      });
      const [newVideoTrack] = newStream.getVideoTracks();
      if (!newVideoTrack) return;

      newVideoTrack.enabled = true;
      stream.addTrack(newVideoTrack);

      if (peerRef.current) {
        await peerRef.current.addTrack(newVideoTrack, stream);
      }

      setCameraEnabled(true);
      sendMediaState(microphoneEnabled, true);
      setLocalStream(new MediaStream(stream.getTracks()));
    } catch {
      toast.error(t("calls.toasts.mediaAccessFailed"));
    }
  }, [getPreferredMediaDevices, microphoneEnabled, sendMediaState, t]);

  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const [audioTrack] = stream.getAudioTracks();
    if (!audioTrack) return;

    const nextEnabled = !audioTrack.enabled;
    audioTrack.enabled = nextEnabled;
    setMicrophoneEnabled(nextEnabled);
    sendMediaState(nextEnabled, cameraEnabled);
  }, [cameraEnabled, sendMediaState]);

  const switchCamera = useCallback(async () => {
    if (!canSwitchCamera) return;

    const existingStream = localStreamRef.current;
    if (!existingStream) return;

    const [oldVideoTrack] = existingStream.getVideoTracks();
    if (!oldVideoTrack) return;

    const nextFacingMode =
      currentFacingModeRef.current === "user" ? "environment" : "user";

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacingMode },
        audio: false,
      });
      const [nextTrack] = nextStream.getVideoTracks();
      if (!nextTrack) return;

      existingStream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
      existingStream.addTrack(nextTrack);

      if (peerRef.current) {
        peerRef.current.replaceTrack(oldVideoTrack, nextTrack, existingStream);
      }

      currentFacingModeRef.current = nextFacingMode;
      setLocalStream(new MediaStream(existingStream.getTracks()));
    } catch {
      toast.error(t("calls.toasts.switchCameraFailed"));
    }
  }, [canSwitchCamera, t]);

  const selectAudioOutput = useCallback((deviceId: string) => {
    setSelectedAudioOutputId(deviceId);
    void setSettings({ preferredSpeakerId: deviceId });
  }, []);

  const dismissOverlay = useCallback(() => {
    hardResetCallState();
  }, [hardResetCallState]);

  const resolveToastMessage = useCallback(
    (messageOrKey: string | null | undefined, fallbackKey: string) => {
      const normalized =
        typeof messageOrKey === "string" ? messageOrKey.trim() : "";

      if (!normalized) {
        return t(fallbackKey);
      }

      if (normalized.includes(".")) {
        return t(normalized, { defaultValue: t(fallbackKey) });
      }

      return normalized;
    },
    [t],
  );

  const handleIncomingSocketEvent = useCallback(
    async (message: SignalingMessage) => {
      traceCall("incoming message", message);

      const rawType =
        typeof message.type === "string" ? message.type.toLowerCase() : "";
      const rawEvent =
        typeof message.event === "string" ? message.event.toLowerCase() : "";
      const payload = (message.payload || {}) as Record<string, unknown>;

      const eventNamespace = rawEvent.includes(".")
        ? rawEvent.split(".")[0]
        : "";

      const normalizedType =
        rawType === "call" ||
        rawType === "webrtc" ||
        rawType === "ack" ||
        rawType === "error"
          ? rawType
          : eventNamespace === "call" ||
              eventNamespace === "webrtc" ||
              eventNamespace === "ack" ||
              eventNamespace === "error"
            ? eventNamespace
            : rawType || eventNamespace;

      traceCall("incoming normalized", {
        rawType,
        rawEvent,
        normalizedType,
      });

      if (normalizedType === "error" || rawEvent === "error") {
        const code = message.code ?? "call.error";
        if (
          screen === "outgoing" ||
          screen === "incoming" ||
          screen === "in-progress"
        ) {
          traceCall("call close via error", {
            code,
            rawEvent,
            normalizedType,
            call_id: activeCallIdRef.current,
            call_mode: callModeRef.current,
            duration_seconds: callDurationSeconds,
          });
          toast.error(
            resolveToastMessage(
              typeof message.message === "string" ? message.message : code,
              "calls.toasts.genericError",
            ),
          );
          hardResetCallState();
        }
        return;
      }

      if (normalizedType === "ack" || rawEvent === "ack") {
        const ackEventRaw =
          rawEvent === "ack"
            ? String(payload.event || "").toLowerCase()
            : rawEvent;
        const ackEvent = ackEventRaw.startsWith("call.")
          ? ackEventRaw.slice("call.".length)
          : ackEventRaw;
        const ackCallId = String(payload.call_id || "");

        if (ackEvent === "invite") {
          const nextCallId = ackCallId;
          if (!nextCallId) return;

          if (pendingOutgoingCancelRef.current) {
            pendingOutgoingCancelRef.current = false;
            setCallId(nextCallId);
            activeCallIdRef.current = nextCallId;
            sendSignal("call.cancel", {
              call_id: nextCallId,
            });
            hardResetCallState();
            return;
          }

          if (screen !== "outgoing") {
            return;
          }

          setCallId(nextCallId);
          activeCallIdRef.current = nextCallId;
          return;
        }

        if (ackEvent === "reject") {
          if (!ackCallId || ackCallId !== activeCallIdRef.current) return;
          traceCall("call close via ack", {
            ack_event: ackEvent,
            call_id: ackCallId,
            call_mode: callModeRef.current,
            duration_seconds: callDurationSeconds,
          });
          handleCallEnded(
            {
              call_id: ackCallId,
              status: "rejected",
              end_reason: "rejected",
            },
            "rejected",
          );
          return;
        }

        if (ackEvent === "cancel") {
          if (!ackCallId || ackCallId !== activeCallIdRef.current) return;
          traceCall("call close via ack", {
            ack_event: ackEvent,
            call_id: ackCallId,
            call_mode: callModeRef.current,
            duration_seconds: callDurationSeconds,
          });
          handleCallEnded({
            call_id: ackCallId,
            status: "canceled",
            end_reason: "canceled",
          });
          return;
        }

        if (ackEvent === "end") {
          if (!ackCallId || ackCallId !== activeCallIdRef.current) return;
          traceCall("call close via ack", {
            ack_event: ackEvent,
            call_id: ackCallId,
            call_mode: callModeRef.current,
            duration_seconds: callDurationSeconds,
          });
          handleCallEnded({
            call_id: ackCallId,
            status: "ended",
            end_reason: "ended",
            duration_seconds: callDurationSeconds,
          });
          return;
        }

        return;
      }
      if (normalizedType === "call") {
        const event = rawEvent.startsWith("call.")
          ? rawEvent.slice("call.".length)
          : rawEvent;
        const payload = (message.payload || {}) as Record<string, unknown>;
        if (event === "ringing" || event === "invite") {
          const fromRaw =
            ((payload.from || payload.peer || payload.caller || {}) as Record<
              string,
              unknown
            >) || {};
          const fromUsername =
            typeof fromRaw.username === "string"
              ? fromRaw.username
              : typeof fromRaw.to === "string"
                ? fromRaw.to
                : typeof fromRaw.from === "string"
                  ? fromRaw.from
                  : typeof fromRaw.user === "string"
                    ? fromRaw.user
                    : "";

          const fromDisplayName =
            typeof fromRaw.display_name === "string"
              ? fromRaw.display_name
              : typeof fromRaw.full_name === "string"
                ? fromRaw.full_name
                : undefined;

          const fromId =
            typeof fromRaw.id === "number" ? fromRaw.id : undefined;
          const fromAvatarUrl =
            typeof fromRaw.avatar_url === "string"
              ? fromRaw.avatar_url
              : typeof fromRaw.avatarUrl === "string"
                ? fromRaw.avatarUrl
                : typeof fromRaw.avatar === "string"
                  ? fromRaw.avatar
                  : typeof payload.avatar_url === "string"
                    ? String(payload.avatar_url)
                    : typeof payload.avatarUrl === "string"
                      ? String(payload.avatarUrl)
                      : undefined;

          const incomingCallId = String(payload.call_id || payload.id || "");
          const incomingMode =
            resolveCallMode(payload.mode) ??
            resolveCallMode(payload.call_mode) ??
            "video";
          const callerUsername =
            fromUsername ||
            (typeof payload.from === "string"
              ? String(payload.from)
              : typeof payload.username === "string"
                ? String(payload.username)
                : fromId !== undefined
                  ? `user-${fromId}`
                  : "");

          if (!incomingCallId || !callerUsername) return;

          setCallId(incomingCallId);
          activeCallIdRef.current = incomingCallId;
          setPeer(
            formatPeer({
              id: fromId,
              username: callerUsername,
              display_name: fromDisplayName,
              avatar_url: fromAvatarUrl,
            }),
          );
          setLastEndReason(null);
          callModeRef.current = incomingMode;
          setCallMode(incomingMode);
          setScreen("incoming");
          return;
        }

        if (event === "call.accepted" || event === "accepted") {
          const summary = payload as unknown as CallSummaryPayload;
          if (!summary.call_id) return;

          const acceptedCallId = String(summary.call_id);
          const currentActiveCallId = activeCallIdRef.current;
          if (currentActiveCallId) {
            if (acceptedCallId !== currentActiveCallId) {
              return;
            }
          } else if (screen !== "outgoing") {
            return;
          }

          setCallId(acceptedCallId);
          activeCallIdRef.current = acceptedCallId;

          const acceptedPeer = summary.peer;
          if (acceptedPeer?.username) {
            setPeer((currentPeer) =>
              formatPeer({
                id: acceptedPeer.id,
                username: acceptedPeer.username,
                display_name:
                  acceptedPeer.display_name ?? currentPeer?.displayName,
                full_name: acceptedPeer.full_name,
                avatar_url: acceptedPeer.avatar_url ?? currentPeer?.avatar_url,
                online: currentPeer?.online,
              }),
            );
          }

          const acceptedMode =
            resolveCallMode(payload.mode) ??
            resolveCallMode(payload.call_mode) ??
            callModeRef.current;
          callModeRef.current = acceptedMode;
          setCallMode(acceptedMode);

          try {
            await ensureLocalStream(acceptedMode);
          } catch {
            toast.error(t("calls.toasts.mediaAccessFailed"));
            return;
          }

          if (acceptedMode === "audio") {
            setCameraEnabled(false);
          }

          try {
            createPeer(true, acceptedCallId);
          } catch {
            toast.error(t("calls.toasts.initializeFailed"));
            hardResetCallState();
            return;
          }

          setRemoteVideoEnabled(true);
          setScreen("in-progress");
          startDurationCounter();
          sendMediaState(microphoneEnabled, cameraEnabled);
          return;
        }

        if (
          event === "rejected" ||
          event === "cancel" ||
          event === "canceled" ||
          event === "missed" ||
          event === "failed" ||
          event === "end" ||
          event === "ended"
        ) {
          const summary = payload as unknown as CallSummaryPayload;
          const endedCallId = String(summary.call_id || "");
          if (!endedCallId || endedCallId !== activeCallIdRef.current) {
            return;
          }
          traceCall("call close via event", {
            event,
            call_id: endedCallId,
            status: summary.status,
            end_reason: summary.end_reason,
            duration_seconds: summary.duration_seconds,
            call_mode: callModeRef.current,
          });
          handleCallEnded(summary);
          return;
        }

        if (
          event === "call.terminated_elsewhere" ||
          event === "terminated_elsewhere"
        ) {
          const terminatedCallId = String(payload.call_id || "");
          if (
            !terminatedCallId ||
            terminatedCallId !== activeCallIdRef.current
          ) {
            return;
          }
          traceCall("call close via terminated_elsewhere", {
            call_id: terminatedCallId,
            call_mode: callModeRef.current,
            duration_seconds: callDurationSeconds,
          });
          handleCallEnded({
            call_id: terminatedCallId,
            status: "ended",
            end_reason: "answered-elsewhere",
          });
        }

        return;
      }

      if (normalizedType === "webrtc") {
        const event = rawEvent.startsWith("webrtc.")
          ? rawEvent.slice("webrtc.".length)
          : rawEvent;

        const payloadData = ((payload.data as
          | Record<string, unknown>
          | undefined) ||
          (payload.payload as Record<string, unknown> | undefined) ||
          payload) as Record<string, unknown>;

        const payloadCallId = String(
          payload.call_id || payloadData.call_id || "",
        );

        if (!payloadCallId || payloadCallId !== activeCallIdRef.current) {
          return;
        }

        if (event === "offer" || event === "answer") {
          const sdp =
            typeof payloadData.sdp === "string" ? payloadData.sdp : "";
          if (!sdp) return;

          applyPeerSignal({
            type: event,
            sdp,
          });
          return;
        }

        if (event === "ice-candidate") {
          const candidateRaw = payloadData.candidate;

          if (typeof candidateRaw === "string") {
            try {
              const parsedCandidate: {
                candidate: string;
                sdpMLineIndex?: number;
                sdpMid?: string;
              } = {
                candidate: candidateRaw,
              };

              if (typeof payloadData.sdpMLineIndex === "number") {
                parsedCandidate.sdpMLineIndex = payloadData.sdpMLineIndex;
              }
              if (typeof payloadData.sdpMid === "string") {
                parsedCandidate.sdpMid = payloadData.sdpMid;
              }

              applyPeerSignal({
                type: "candidate",
                candidate: parsedCandidate as unknown as RTCIceCandidate,
              });
            } catch (error) {
              traceCall("failed to apply ICE candidate", {
                event,
                error,
                payloadData,
              });
            }
          }

          return;
        }

        if (event === "media-state") {
          setRemoteVideoEnabled(payloadData.video_enabled !== false);
        }

        return;
      }
    },
    [
      applyPeerSignal,
      callDurationSeconds,
      cameraEnabled,
      createPeer,
      ensureLocalStream,
      handleCallEnded,
      hardResetCallState,
      microphoneEnabled,
      resolveToastMessage,
      screen,
      sendSignal,
      sendMediaState,
      startDurationCounter,
      t,
    ],
  );

  useEffect(() => {
    incomingEventHandlerRef.current = handleIncomingSocketEvent;
  }, [handleIncomingSocketEvent]);

  useEffect(() => {
    const onSharedWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;
      if (!detail || typeof detail !== "object") return;

      const message = detail as SignalingMessage;
      if (
        typeof message.event !== "string" &&
        typeof message.type !== "string"
      ) {
        return;
      }

      void incomingEventHandlerRef.current(message);
    };

    window.addEventListener(
      WS_MESSAGE_EVENT_NAME,
      onSharedWsMessage as EventListener,
    );
    return () => {
      window.removeEventListener(
        WS_MESSAGE_EVENT_NAME,
        onSharedWsMessage as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      hardResetCallState();
    }
  }, [accessToken, hardResetCallState]);

  useEffect(() => {
    void getPreferredMediaDevices().then((settings) => {
      if (settings.preferredSpeakerId) {
        setSelectedAudioOutputId(settings.preferredSpeakerId);
      }
    });

    return;
  }, [getPreferredMediaDevices]);

  useEffect(() => {
    void refreshAudioOutputDevices();
    void refreshCameraAvailability();

    if (!navigator.mediaDevices) return;

    const onDevicesChanged = () => {
      void refreshAudioOutputDevices();
      void refreshCameraAvailability();
    };

    navigator.mediaDevices.addEventListener("devicechange", onDevicesChanged);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        onDevicesChanged,
      );
    };
  }, [refreshAudioOutputDevices, refreshCameraAvailability]);

  useEffect(() => {
    return () => {
      clearAutoDismiss();
      clearDurationInterval();
      destroyPeer();
      stopAndReleaseTracks();
    };
  }, [
    clearAutoDismiss,
    clearDurationInterval,
    destroyPeer,
    stopAndReleaseTracks,
  ]);

  const value = useMemo<CallContextValue>(
    () => ({
      screen,
      callMode,
      callId,
      peer,
      localStream,
      remoteStream,
      remoteVideoEnabled,
      cameraEnabled,
      microphoneEnabled,
      isMobileDevice,
      canSwitchCamera,
      audioOutputs,
      selectedAudioOutputId,
      callDurationSeconds,
      lastEndReason,
      startCall,
      cancelOutgoingCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCall,
      toggleCamera,
      toggleMicrophone,
      switchCamera,
      selectAudioOutput,
      dismissOverlay,
    }),
    [
      screen,
      callMode,
      callId,
      peer,
      localStream,
      remoteStream,
      remoteVideoEnabled,
      cameraEnabled,
      microphoneEnabled,
      isMobileDevice,
      canSwitchCamera,
      audioOutputs,
      selectedAudioOutputId,
      callDurationSeconds,
      lastEndReason,
      startCall,
      cancelOutgoingCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCall,
      toggleCamera,
      toggleMicrophone,
      switchCamera,
      selectAudioOutput,
      dismissOverlay,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCalls() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCalls must be used within CallProvider");
  }

  return context;
}
