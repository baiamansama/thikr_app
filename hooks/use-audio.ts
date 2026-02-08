"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAudioStore } from "@/stores/audio-store";

interface AudioLine {
  timestamp?: number;
}

export function useAudio(lines: AudioLine[] = []) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentlyPlayingId,
    isPlaying,
    playbackRate,
    isRepeat,
    setPlaying,
    setLineIndex,
  } = useAudioStore();

  // Sync playback rate and repeat
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isRepeat;
    }
  }, [playbackRate, isRepeat]);

  const play = useCallback(
    (id: string, audioSrc: string) => {
      // If it's a new audio source, create new Audio
      if (!audioRef.current || audioRef.current.src !== new URL(audioSrc, window.location.href).href) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.current.removeEventListener("ended", handleEnded);
        }

        audioRef.current = new Audio(audioSrc);
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.loop = isRepeat;
        audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.addEventListener("ended", handleEnded);
      }

      setPlaying(id, true);
      audioRef.current.play().catch(console.error);
    },
    [playbackRate, isRepeat, setPlaying]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying(currentlyPlayingId, false);
  }, [currentlyPlayingId, setPlaying]);

  const toggle = useCallback(
    (id: string, audioSrc: string) => {
      if (isPlaying && currentlyPlayingId === id) {
        pause();
      } else {
        play(id, audioSrc);
      }
    },
    [isPlaying, currentlyPlayingId, pause, play]
  );

  const skip = useCallback(
    (direction: "forward" | "backward") => {
      if (!audioRef.current || lines.length === 0) return;

      const timestamps = lines
        .map((l) => l.timestamp)
        .filter((t): t is number => t !== undefined)
        .sort((a, b) => a - b);

      const current = audioRef.current.currentTime;

      if (direction === "backward") {
        const target = [...timestamps].reverse().find((t) => t < current - 0.5);
        audioRef.current.currentTime = target ?? 0;
      } else {
        const target = timestamps.find((t) => t > current + 0.5);
        if (target !== undefined) {
          audioRef.current.currentTime = target;
        }
      }
    },
    [lines]
  );

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || lines.length === 0) return;
    const currentTime = audioRef.current.currentTime;

    const lineIndex = lines.findIndex((line, idx) => {
      const nextLine = lines[idx + 1];
      const lineEnd = nextLine?.timestamp ?? Infinity;
      return currentTime >= (line.timestamp || 0) && currentTime < lineEnd;
    });

    setLineIndex(lineIndex === -1 ? 0 : lineIndex);
  }, [lines, setLineIndex]);

  const handleEnded = useCallback(() => {
    if (!isRepeat) {
      setPlaying(null, false);
    }
  }, [isRepeat, setPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current = null;
      }
    };
  }, [handleTimeUpdate, handleEnded]);

  return {
    play,
    pause,
    toggle,
    skip,
    audioRef,
  };
}
