"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const MAX_RECORD_SECONDS = 30;

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

export function LabActions() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (tickRef.current !== null) {
      window.clearTimeout(tickRef.current);
      tickRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (typeof MediaRecorder === "undefined") return;
    const canvas = findLargestCanvas();
    if (!canvas || typeof canvas.captureStream !== "function") return;

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 8_000_000,
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename();
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
    setRecordSeconds(0);

    const startedAt = performance.now();
    const tick = () => {
      const s = Math.floor((performance.now() - startedAt) / 1000);
      setRecordSeconds(s);
      if (s >= MAX_RECORD_SECONDS) {
        stopRecording();
      } else {
        tickRef.current = window.setTimeout(tick, 250);
      }
    };
    tick();
  }, [stopRecording]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (isRecording) stopRecording();
        else startRecording();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRecording, startRecording, stopRecording, toggleFullscreen]);

  // Stop recording on unmount.
  useEffect(() => stopRecording, [stopRecording]);

  return (
    <div className="pointer-events-none fixed right-5 top-[60px] z-10 flex select-none flex-col items-end gap-1.5 md:right-8">
      <button
        type="button"
        onClick={toggleFullscreen}
        className={cn(
          "pointer-events-auto cursor-pointer font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30 transition-colors hover:text-accent",
        )}
      >
        {isFullscreen ? "exit fullscreen" : "fullscreen"}
        <span className="ml-1.5 text-[8px] text-foreground/20">f</span>
      </button>
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "pointer-events-auto flex cursor-pointer items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors",
          isRecording ? "text-accent" : "text-foreground/30 hover:text-accent",
        )}
        aria-pressed={isRecording}
      >
        {isRecording && (
          <span className="widget-pulse inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        )}
        {isRecording ? `rec ${recordSeconds}s · stop` : "record webm"}
        {!isRecording && <span className="ml-1.5 text-[8px] text-foreground/20">r</span>}
      </button>
    </div>
  );
}
