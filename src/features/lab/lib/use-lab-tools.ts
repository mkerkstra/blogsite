"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_RECORD_SECONDS = 30;

/** Toggle document fullscreen, tracking state. `f` is wired by the caller. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  return { isFullscreen, toggle };
}

function findLargestCanvas(): HTMLCanvasElement | null {
  const canvases = Array.from(document.querySelectorAll("canvas")) as HTMLCanvasElement[];
  if (!canvases.length) return null;
  return canvases.reduce((a, b) => (a.width * a.height >= b.width * b.height ? a : b));
}

function downloadFilename(): string {
  const slug =
    document.title
      .toLowerCase()
      .split(" · ")[0]
      ?.trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ?? "lab";
  return `${slug}-${Date.now()}.webm`;
}

/**
 * Capture the largest on-page canvas to a WebM download (vp9 when supported),
 * up to 30s. No keyboard shortcut — it's a deliberate button action, and `r` is
 * already the per-lab reset convention.
 */
export function useCanvasRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (tickRef.current !== null) {
      window.clearTimeout(tickRef.current);
      tickRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(() => {
    if (typeof MediaRecorder === "undefined") return;
    const canvas = findLargestCanvas();
    if (!canvas || typeof canvas.captureStream !== "function") return;

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(canvas.captureStream(60), {
      mimeType: mime,
      videoBitsPerSecond: 8_000_000,
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunksRef.current, { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename();
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
    setSeconds(0);

    const startedAt = performance.now();
    const tick = () => {
      const s = Math.floor((performance.now() - startedAt) / 1000);
      setSeconds(s);
      if (s >= MAX_RECORD_SECONDS) stop();
      else tickRef.current = window.setTimeout(tick, 250);
    };
    tick();
  }, [stop]);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  // Stop on unmount.
  useEffect(() => stop, [stop]);

  return { isRecording, seconds, toggle };
}
