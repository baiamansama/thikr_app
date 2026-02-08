"use client";

import { cn } from "@/lib/utils";

interface AzkarLineProps {
  arabic: string;
  translation?: string;
  transcriptionLatin?: string;
  transcriptionCyrillic?: string;
  isHighlighted: boolean;
  showTranslation: boolean;
  showTranscription: boolean;
  language: string;
}

export function AzkarLine({
  arabic,
  translation,
  transcriptionLatin,
  transcriptionCyrillic,
  isHighlighted,
  showTranslation,
  showTranscription,
  language,
}: AzkarLineProps) {
  const isRussianOrKyrgyz = language === "русский" || language === "кыргыз" || language === "ru" || language === "ky";
  const isEnglish = language === "english" || language === "en";

  const transcription = isEnglish
    ? transcriptionLatin
    : isRussianOrKyrgyz
    ? transcriptionCyrillic
    : null;

  const displayText = showTranscription && transcription
    ? transcription
    : arabic;

  return (
    <div
      className={cn(
        "rounded-md p-2 transition-colors",
        isHighlighted && "combined-text-highlight"
      )}
    >
      <p
        className={cn(
          "text-right leading-relaxed",
          showTranscription && transcription
            ? "text-xl text-[var(--card-text)]"
            : "text-2xl quran-font"
        )}
        lang={showTranscription && transcription ? undefined : "ar"}
        dir="rtl"
      >
        {displayText}
      </p>
      {showTranslation && translation && language !== "عربي" && language !== "ar" && (
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed" dir="ltr">
          {translation}
        </p>
      )}
    </div>
  );
}
