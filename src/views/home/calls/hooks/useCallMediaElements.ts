import { useEffect } from "react";

type SinkableMediaElement = HTMLMediaElement & {
  setSinkId?: (deviceId: string) => Promise<void>;
};

type UseCallMediaElementsOptions = {
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  selectedAudioOutputId: string;
};

export function useCallMediaElements({
  remoteVideoRef,
  localVideoRef,
  remoteStream,
  localStream,
  selectedAudioOutputId,
}: UseCallMediaElementsOptions) {
  useEffect(() => {
    const node = remoteVideoRef.current;
    if (!node) return;

    if (node.srcObject !== remoteStream) {
      node.srcObject = remoteStream;
    }
  });

  useEffect(() => {
    const node = localVideoRef.current;
    if (!node) return;

    if (node.srcObject !== localStream) {
      node.srcObject = localStream;
    }
  });

  useEffect(() => {
    const node = remoteVideoRef.current as SinkableMediaElement | null;
    if (!node?.setSinkId || !selectedAudioOutputId) return;

    void node.setSinkId(selectedAudioOutputId).catch(() => {
      return;
    });
  });
}
