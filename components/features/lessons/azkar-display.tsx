"use client";

import { useState } from "react";
import { AzkarLine } from "./azkar-line";
import { AzkarCounter } from "./azkar-counter";
import { AudioPlayer } from "./audio-player";
import { Languages, Captions, CaptionsOff } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";
import { useAudio } from "@/hooks/use-audio";
import { resolveAudioUrl } from "@/lib/assets";

interface ContentLine {
  id: string;
  order: number;
  arabic: string | null;
  translations: Record<string, string> | null;
  transcriptionLatin: string | null;
  transcriptionCyrillic: string | null;
  audioUrl: string | null;
  timestamp: number | null;
  repeatCount: number | null;
}

interface AzkarDisplayProps {
  contentLines: ContentLine[];
  audioUrl?: string;
  language?: string;
  repeatCount?: number;
  showCounter?: boolean;
}

export function AzkarDisplay({
  contentLines,
  audioUrl,
  language = "en",
  repeatCount = 1,
  showCounter = true,
}: AzkarDisplayProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const { currentLineIndex } = useAudioStore();

  const audioLines = contentLines.map((line) => ({
    timestamp: line.timestamp ?? undefined,
  }));

  const { toggle, skip } = useAudio(audioLines);

  const isArabic = language === "عربي" || language === "ar";
  const hasTranscription = contentLines.some(
    (l) => l.transcriptionLatin || l.transcriptionCyrillic
  );

  const resolvedAudioUrl = resolveAudioUrl(audioUrl);

  return (
    <div className="rounded-xl border border-cream-200 bg-cream-100 p-4 md:p-6">
      {/* Arabic text / lines */}
      <div className="space-y-1">
        {showTranslation && !isArabic ? (
          contentLines.map((line, index) => (
            <AzkarLine
              key={line.id}
              arabic={line.arabic || ""}
              translation={line.translations?.[language]}
              transcriptionLatin={line.transcriptionLatin || undefined}
              transcriptionCyrillic={line.transcriptionCyrillic || undefined}
              isHighlighted={currentLineIndex === index}
              showTranslation={showTranslation}
              showTranscription={showTranscription}
              language={language}
            />
          ))
        ) : (
          <div
            className={`text-2xl quran-font leading-relaxed text-right ${showTranscription ? "text-xl" : ""}`}
            lang={showTranscription ? undefined : "ar"}
            dir="rtl"
          >
            {contentLines.map((line, index) => {
              const isRussianOrKyrgyz = ["русский", "кыргыз", "ru", "ky"].includes(language);
              const isEnglish = ["english", "en"].includes(language);
              const transcription = isEnglish
                ? line.transcriptionLatin
                : isRussianOrKyrgyz
                ? line.transcriptionCyrillic
                : null;

              return (
                <span
                  key={line.id}
                  className={currentLineIndex === index ? "combined-text-highlight" : ""}
                >
                  {showTranscription && transcription
                    ? transcription
                    : line.arabic}
                  {index < contentLines.length - 1 && " "}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-4">
        {!isArabic && (
          <button
            onClick={() => setShowTranslation((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-beige-400 hover:bg-cream-200 transition-colors"
          >
            <Languages className="h-5 w-5" />
          </button>
        )}

        {hasTranscription && !isArabic && (
          <button
            onClick={() => setShowTranscription((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-beige-400 hover:bg-cream-200 transition-colors"
          >
            {showTranscription ? (
              <Captions className="h-5 w-5" />
            ) : (
              <CaptionsOff className="h-5 w-5" />
            )}
          </button>
        )}

        {resolvedAudioUrl && (
          <AudioPlayer
            audioUrl={resolvedAudioUrl}
            contentId={contentLines[0]?.id || "unknown"}
            onToggle={toggle}
            onSkip={skip}
          />
        )}
      </div>

      {/* Counter */}
      {showCounter && repeatCount > 1 && (
        <div className="mt-4">
          <AzkarCounter targetCount={repeatCount} />
        </div>
      )}
    </div>
  );
}
