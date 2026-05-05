import { Button } from "@/components/ui/button";
import Settings from "@/views/settings/Settings";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  RotateCcw,
  Video,
  VideoOff,
} from "lucide-react";
import { useCalls } from "../context/CallContext";
import { useCallMediaElements } from "../hooks/useCallMediaElements";
import { formatDuration } from "../utils";

export default function InProgressCallView() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ x: 16, y: 16 });

  const {
    screen,
    peer,
    localStream,
    remoteStream,
    remoteVideoEnabled,
    cameraEnabled,
    microphoneEnabled,
    isMobileDevice,
    canSwitchCamera,
    selectedAudioOutputId,
    callDurationSeconds,
    endCall,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
  } = useCalls();

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  const FLOATING_WIDTH = 208;
  const FLOATING_HEIGHT = 156;
  const FLOATING_MARGIN = 16;

  useCallMediaElements({
    remoteVideoRef,
    localVideoRef,
    remoteStream,
    localStream,
    selectedAudioOutputId,
  });

  useEffect(() => {
    if (screen !== "in-progress" && location === "/call") {
      setLocation("/");
    }
  }, [location, screen, setLocation]);

  useEffect(() => {
    if (screen !== "in-progress") {
      setIsMinimized(false);
      return;
    }

    if (!isMinimized && location !== "/call") {
      setLocation("/call");
    }
  }, [isMinimized, location, screen, setLocation]);

  useEffect(() => {
    if (!isMinimized) return;

    const maxX = Math.max(
      FLOATING_MARGIN,
      window.innerWidth - FLOATING_WIDTH - FLOATING_MARGIN,
    );
    const maxY = Math.max(
      FLOATING_MARGIN,
      window.innerHeight - FLOATING_HEIGHT - FLOATING_MARGIN,
    );

    setFloatingPosition((current) => ({
      x: Math.min(Math.max(current.x, FLOATING_MARGIN), maxX),
      y: Math.min(Math.max(current.y, FLOATING_MARGIN), maxY),
    }));

    const onResize = () => {
      const resizedMaxX = Math.max(
        FLOATING_MARGIN,
        window.innerWidth - FLOATING_WIDTH - FLOATING_MARGIN,
      );
      const resizedMaxY = Math.max(
        FLOATING_MARGIN,
        window.innerHeight - FLOATING_HEIGHT - FLOATING_MARGIN,
      );

      setFloatingPosition((current) => ({
        x: Math.min(Math.max(current.x, FLOATING_MARGIN), resizedMaxX),
        y: Math.min(Math.max(current.y, FLOATING_MARGIN), resizedMaxY),
      }));
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [isMinimized]);

  useEffect(() => {
    if (!isMinimized) return;

    setFloatingPosition({
      x: Math.max(
        FLOATING_MARGIN,
        window.innerWidth - FLOATING_WIDTH - FLOATING_MARGIN,
      ),
      y: Math.max(
        FLOATING_MARGIN,
        window.innerHeight - FLOATING_HEIGHT - FLOATING_MARGIN,
      ),
    });
  }, [isMinimized]);

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    if (location !== "/call") {
      setLocation("/call");
    }
  };

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;

    draggingRef.current = true;
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    const maxX = Math.max(
      FLOATING_MARGIN,
      window.innerWidth - FLOATING_WIDTH - FLOATING_MARGIN,
    );
    const maxY = Math.max(
      FLOATING_MARGIN,
      window.innerHeight - FLOATING_HEIGHT - FLOATING_MARGIN,
    );

    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;

    setFloatingPosition({
      x: Math.min(Math.max(nextX, FLOATING_MARGIN), maxX),
      y: Math.min(Math.max(nextY, FLOATING_MARGIN), maxY),
    });
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleEndCall = () => {
    setIsMinimized(false);
    endCall();
  };

  const peerFallback = peer?.username || t("calls.unknown");

  if (screen !== "in-progress") {
    return null;
  }

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 overflow-hidden rounded-xl border border-white/20 bg-black/80 shadow-xl"
        style={{
          left: floatingPosition.x,
          top: floatingPosition.y,
          width: FLOATING_WIDTH,
          height: FLOATING_HEIGHT,
        }}
      >
        <div
          className="flex items-center justify-between bg-black/70 px-2 py-1 text-xs text-neutral-100"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span className="select-none">@{peerFallback}</span>
          <span className="select-none">
            {formatDuration(callDurationSeconds)}
          </span>
        </div>

        <div className="relative h-[calc(100%-1.75rem)] w-full bg-neutral-900">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-300">
              {t("calls.inProgress.waitingRemoteVideo")}
            </div>
          )}

          {!remoteVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-xs text-neutral-300">
              {t("calls.inProgress.cameraOff")}
            </div>
          )}

          <div className="absolute bottom-2 right-2 inline-flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 cursor-pointer rounded-full"
              title={t("calls.actions.maximize")}
              aria-label={t("calls.actions.maximize")}
              onClick={handleRestore}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7 cursor-pointer rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 h-full bg-black/70 backdrop-blur-sm">
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-neutral-950 text-neutral-100">
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-center gap-1">
          <div className="rounded-full bg-black/60 px-4 py-1 text-sm text-neutral-200">
            @{peerFallback}
          </div>

          <div className="rounded-full bg-black/60 px-4 py-1 text-sm text-neutral-200">
            {formatDuration(callDurationSeconds)}
          </div>
        </div>

        <div className="absolute inset-0 bg-neutral-900">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              {t("calls.inProgress.waitingRemoteVideo")}
            </div>
          )}
          {!remoteVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-neutral-300">
              {t("calls.inProgress.cameraOff")}
            </div>
          )}
        </div>

        {cameraEnabled && (
          <div className="absolute right-4 top-4 z-10 h-36 w-24 overflow-hidden rounded-xl border border-white/20 bg-black/70 sm:h-44 sm:w-32">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                {t("calls.inProgress.noCamera")}
              </div>
            )}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/70 p-4">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
            <Button
              variant="secondary"
              className="cursor-pointer rounded-full"
              onClick={handleMinimize}
            >
              <Minimize2 /> {t("calls.actions.minimize")}
            </Button>

            <div className="inline-flex gap-2">
              <Button
                variant={microphoneEnabled ? "secondary" : "outline"}
                className="cursor-pointer rounded-full"
                onClick={toggleMicrophone}
              >
                {microphoneEnabled ? <Mic /> : <MicOff />}
                {microphoneEnabled
                  ? t("calls.actions.mute")
                  : t("calls.actions.unmute")}
              </Button>
              <Button
                variant={cameraEnabled ? "secondary" : "outline"}
                className="cursor-pointer rounded-full"
                onClick={toggleCamera}
              >
                {cameraEnabled ? <Video /> : <VideoOff />}
                {cameraEnabled
                  ? t("calls.actions.cameraOn")
                  : t("calls.actions.cameraOff")}
              </Button>
              {isMobileDevice && canSwitchCamera && (
                <Button
                  variant="secondary"
                  className="cursor-pointer rounded-full"
                  onClick={() => {
                    void switchCamera();
                  }}
                >
                  <RotateCcw /> {t("calls.actions.switchCamera")}
                </Button>
              )}
              <Button
                variant="destructive"
                className="cursor-pointer rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff /> {t("calls.actions.endCall")}
              </Button>
            </div>

            <Settings minimalViews={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
