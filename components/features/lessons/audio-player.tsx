"use client";

import { useAudioStore } from "@/stores/audio-store";
import { Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  contentId: string;
  onToggle: (id: string, audioSrc: string) => void;
  onSkip: (direction: "forward" | "backward") => void;
}

export function AudioPlayer({
  audioUrl,
  contentId,
  onToggle,
  onSkip,
}: AudioPlayerProps) {
  const {
    currentlyPlayingId,
    isPlaying,
    playbackRate,
    isRepeat,
    cycleSpeed,
    toggleRepeat,
  } = useAudioStore();

  const isThisPlaying = isPlaying && currentlyPlayingId === contentId;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSkip("backward")}
        className="rounded-lg p-2 text-beige-400 hover:bg-cream-200 transition-colors"
      >
        <SkipBack className="h-4 w-4" />
      </button>

      <button
        onClick={() => onToggle(contentId, audioUrl)}
        className={cn(
          "rounded-full p-2.5 transition-colors",
          isThisPlaying
            ? "bg-green-500 text-white"
            : "bg-cream-200 text-brown-600 hover:bg-cream-200/80"
        )}
      >
        {isThisPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </button>

      <button
        onClick={() => onSkip("forward")}
        className="rounded-lg p-2 text-beige-400 hover:bg-cream-200 transition-colors"
      >
        <SkipForward className="h-4 w-4" />
      </button>

      <button
        onClick={cycleSpeed}
        className={cn(
          "rounded-lg px-2 py-1 text-xs font-bold transition-colors",
          playbackRate !== 1
            ? "bg-green-500/10 text-green-600"
            : "text-beige-400 hover:bg-cream-200"
        )}
      >
        {playbackRate}x
      </button>

      <button
        onClick={toggleRepeat}
        className={cn(
          "rounded-lg p-2 transition-colors",
          isRepeat
            ? "bg-green-500/10 text-green-600"
            : "text-beige-400 hover:bg-cream-200"
        )}
      >
        <Repeat className="h-4 w-4" />
      </button>
    </div>
  );
}
