import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MEDIA_CONSTRAINTS } from "./constants";
import type { Camera, SetStringArray, VideoRef } from "../types";

export const useMediaQuery = (query: string) => {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

const stopStream = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

// Some devices release a camera a moment after its tracks are stopped
const CAMERA_RETRY_DELAY = 500;

const isCameraBusy = (error: unknown): boolean => {
  return (error instanceof DOMException) && (error.name === "NotReadableError" || error.name === "AbortError");
}

const cameraErrorText = (error: unknown): string[] => {
  const name = (error instanceof DOMException) ? error.name : "";
  switch (name) {
    case "NotAllowedError": return ["Camera access was blocked", "Allow camera access in your browser settings"];
    case "NotFoundError":
    case "OverconstrainedError": return ["No camera found", "Connect a camera or select another device"];
    case "NotReadableError": return ["Camera is in use", "Close other apps using the camera"];
    default: return ["Unable to start the camera"];
  }
}

// Zooms out as far as the camera allows, to fit the whole board in frame
const zoomOut = (stream: MediaStream) => {
  const track = stream.getVideoTracks()[0];
  if (track === undefined || typeof track.getCapabilities !== "function") {
    return;
  }
  const capabilities = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number } };
  if (capabilities.zoom === undefined) {
    return;
  }
  const constraints: MediaTrackConstraints & { zoom: number } = { zoom: capabilities.zoom.min };
  track.applyConstraints(constraints).catch((error: unknown) => {
    console.warn("Cannot update camera zoom", error);
  });
}

const getConstraints =(deviceId: string | null): MediaStreamConstraints => {
  if (deviceId === null) {
    return MEDIA_CONSTRAINTS;
  }
  // A chosen device overrides the preference for the rear camera
  return {
    ...MEDIA_CONSTRAINTS,
    video: { ...MEDIA_CONSTRAINTS.video, facingMode: undefined, deviceId: { exact: deviceId } }
  };
}

// Owns the camera stream shown in videoRef, which runs only while enabled
export const useCamera = ({ enabled, videoRef, setText }: {
  enabled: boolean, videoRef: VideoRef, setText: SetStringArray
}): Camera => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  // Replaced, rather than mutated, whenever the camera should start again
  const [request, setRequest] = useState<{ deviceId: string | null }>({ deviceId: null });
  const streamingRef = useRef<boolean>(false);

  const refreshDevices = useCallback(() => {
    navigator.mediaDevices.enumerateDevices()
      .then((allDevices) => setDevices(allDevices.filter((device) => device.kind === "videoinput")))
      .catch((error: unknown) => console.error("Unable to enumerate media devices", error));
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (navigator.mediaDevices === undefined) {
      setText(["Camera unavailable", "The camera needs a secure (https) connection"]);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let retryTimeout: number | undefined;
    const start = (retries: number) => {
      navigator.mediaDevices.getUserMedia(getConstraints(request.deviceId))
        .then((newStream) => {
          if (cancelled) {
            stopStream(newStream);
            return;
          }
          stream = newStream;
          streamingRef.current = true;
          zoomOut(newStream);
          if (videoRef.current !== null) {
            videoRef.current.srcObject = newStream;
          }
          // Device labels are only available once access is granted
          refreshDevices();
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          if (retries > 0 && isCameraBusy(error)) {
            retryTimeout = window.setTimeout(() => start(retries - 1), CAMERA_RETRY_DELAY);
            return;
          }
          console.error("Unable to start the camera", error);
          setText(cameraErrorText(error));
        });
    }
    start(1);

    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => {
      cancelled = true;
      streamingRef.current = false;
      window.clearTimeout(retryTimeout);
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
      if (stream !== null) {
        stopStream(stream);
      }
    }
  }, [enabled, request, videoRef, setText, refreshDevices]);

  const selectDevice = useCallback((newDeviceId: string) => {
    // A working camera is left alone, but a failed one is tried again
    setRequest((current) => (current.deviceId === newDeviceId && streamingRef.current)
      ? current
      : { deviceId: newDeviceId });
  }, []);

  return { devices, deviceId: request.deviceId, selectDevice };
}
