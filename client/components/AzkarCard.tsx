"use client";

import React, { useCallback, useMemo, forwardRef, Ref, useState } from "react";
import surah_namesData from "../public/data/surah_names.json";
import periodsData from "../public/data/periods.json";

interface Translation {
  [language: string]: string;
}

interface IAzkarLine {
  lineNumber: number;
  arabic: string;
  translations: Translation;
  timestamp?: number;
  transcription_cyrillic?: string;
  transcription_latin?: string;
}

export interface IAzkarEntry {
  id: string;
  count: number;
  lines: IAzkarLine[];
}

interface IUIActions {
  clean_history: Translation;
  tap: Translation;
  completed: Translation;
}

export interface IUITranslations {
  actions: IUIActions;
  virtues: Translation;
  settings: Translation;
}

export interface IVirtues {
  azkar_id: string;
  arabic: string;
  english: string;
  кыргыз: string;
  русский: string;
}

export interface IAzkarCardProps {
  azkar: IAzkarEntry;
  language: string;
  uiTranslations: IUITranslations;
  counter: number;
  updateCounter: (azkarId: string, newCount: number) => void;
  virtue?: IVirtues;
  audioSrc?: string;
  isCurrentlyPlaying?: boolean;
  currentLineIndex?: number;
  onAudioControl?: (control: {
    azkarId: string;
    isPlaying: boolean;
    audioSrc?: string;
  }) => void;
  playbackRate?: number;
  isRepeat?: boolean;
  onSpeedChange?: () => void;
  onRepeatToggle?: () => void;
  onSkip?: (direction: "forward" | "backward") => void;
  selectedCategory: string;
  isFavorite: boolean;
  toggleFavorite: (azkarId: string) => void;
  isPlayerDrawer?: boolean;
}

const AzkarCard = forwardRef<HTMLDivElement, IAzkarCardProps>(
  (
    {
      azkar,
      language,
      uiTranslations,
      counter,
      updateCounter,
      virtue,
      audioSrc,
      isCurrentlyPlaying = false,
      currentLineIndex = -1,
      onAudioControl,
      playbackRate = 1,
      isRepeat = false,
      onSpeedChange,
      onRepeatToggle,
      onSkip,
      selectedCategory,
      isFavorite,
      toggleFavorite,
      isPlayerDrawer = false,
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const [showTranslation, setShowTranslation] = useState(false);
    const [showTranscription, setShowTranscription] = useState(false);

    const isCompleted = counter >= azkar.count && selectedCategory !== "duas";
    const hasAudio = Boolean(audioSrc);
    const isRussianOrKyrgyz = language === "русский" || language === "кыргыз";
    const isEnglish = language === "english";

    const hasTranscription = azkar.lines.some(
      (line) =>
        (line.transcription_cyrillic &&
          line.transcription_cyrillic.trim() !== "") ||
        (line.transcription_latin && line.transcription_latin.trim() !== "")
    );

    const speedIconMapping: { [key: number]: string } = {
      1: "1x",
      1.5: "1.5x",
      2: "2x",
    };

    const iconClassNames = "w-8 h-8 text-[var(--card-text)]";
    const repeatIconClassNames = "w-6 h-6 text-[var(--card-text)]";
    const buttonClassNames = "p-2 flex items-center justify-center";

    const favoriteIcon = useMemo(() => {
      return isFavorite ? "favorite" : "favorite_border";
    }, [isFavorite]);

    const handlePlayPause = useCallback(() => {
      if (!audioSrc) return;
      onAudioControl?.({
        azkarId: azkar.id,
        isPlaying: !isCurrentlyPlaying,
        audioSrc,
      });
    }, [audioSrc, isCurrentlyPlaying, azkar.id, onAudioControl]);

    const handleSkipBackward = useCallback(
      () => onSkip?.("backward"),
      [onSkip]
    );
    const handleSkipForward = useCallback(() => onSkip?.("forward"), [onSkip]);

    const handleIncrement = useCallback(() => {
      if (selectedCategory === "duas") return;
      if (counter < azkar.count) {
        const newCounter = counter + 1;
        updateCounter(azkar.id, newCounter);
        if (newCounter === azkar.count && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }, [counter, azkar, updateCounter, selectedCategory]);

    const getButtonText = useCallback((): string => {
      if (selectedCategory === "duas") return "";
      if (isCompleted) {
        return `${uiTranslations.actions.completed[language] || "Completed"} (${
          azkar.count
        })`;
      }
      const tapText = uiTranslations.actions.tap[language] || "Tap";
      return `${tapText} (${counter}/${azkar.count})`;
    }, [
      isCompleted,
      uiTranslations,
      language,
      counter,
      azkar.count,
      selectedCategory,
    ]);

    const virtuesLabel = useMemo(() => {
      let label = uiTranslations.virtues[language] ?? "";
      if (label.trim() === "") {
        label = uiTranslations.virtues["عربي"] ?? "";
      }
      return label.trim();
    }, [uiTranslations, language]);

    const virtueText = useMemo(() => {
      if (!virtue) return "";
      if (language === "عربي") {
        return virtue.arabic?.trim() || "";
      }
      let translation = "";
      if (language === "english") translation = virtue.english || "";
      else if (language === "кыргыз") translation = virtue.кыргыз || "";
      else if (language === "русский") translation = virtue["русский"] || "";
      return translation.trim() !== ""
        ? translation
        : virtue.arabic?.trim() || "";
    }, [virtue, language]);

    const shouldRenderVirtues = virtuesLabel !== "" && virtueText !== "";

    const handleFavoriteClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(azkar.id);
      },
      [azkar.id, toggleFavorite]
    );

    const getTranscriptionText = useCallback(
      (line: IAzkarLine) => {
        if (isEnglish && line.transcription_latin) {
          return line.transcription_latin;
        }
        if (isRussianOrKyrgyz && line.transcription_cyrillic) {
          return line.transcription_cyrillic;
        }
        return line.arabic;
      },
      [isEnglish, isRussianOrKyrgyz]
    );

    const handleShare = useCallback(() => {
      if (!navigator.share) return;

      let shareText = azkar.lines.map((line) => line.arabic).join("\n\n");

      if (selectedCategory === "duas") {
        const period = periodsData.find((p) => p.text_id === azkar.id);
        if (period) {
          const periodTranslation =
            period[language as keyof typeof period] || period.arabic;
          shareText = `${periodTranslation}\n\n${shareText}`;
        }
      } else if (selectedCategory === "surahs") {
        const surah = surah_namesData.find((s) => s.surah_id === azkar.id);
        if (surah) {
          const surahName =
            surah[language as keyof typeof surah] || surah.arabic;
          shareText = `${surahName}\n\n${shareText}`;
        }
      }

      // Include transcription and translation only if not Arabic
      if (language !== "عربي") {
        if (hasTranscription) {
          const transcriptions = azkar.lines
            .map((line) => getTranscriptionText(line))
            .join("\n\n");
          shareText += `\n\n----\n${transcriptions}`;
        }

        const translations = azkar.lines
          .map((line) => line.translations[language])
          .filter(Boolean)
          .join("\n\n");
        if (translations) {
          shareText += `\n\n----\n${translations}`;
        }
      }

      // Include virtues if available
      if (shouldRenderVirtues) {
        shareText += `\n\n----\n${virtuesLabel}\n${virtueText}`;
      }

      // Add "Listen to it 🎧" in 4 languages and the deep link
      const deepLink = `https://azkar.link/?id=${encodeURIComponent(
        azkar.id
      )}&lang=${encodeURIComponent(language)}&category=${encodeURIComponent(
        selectedCategory
      )}`;
      const listenText = {
        عربي: "استمع إليه 🎧",
        english: "Listen to it 🎧",
        русский: "Слушать 🎧",
        кыргыз: "Угуңуз 🎧",
      };
      shareText += `\n\n----\n${
        listenText[language as keyof typeof listenText]
      }\n${deepLink}`;

      navigator
        .share({
          text: shareText,
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Share failed:", err);
          }
        });
    }, [
      azkar,
      selectedCategory,
      language,
      hasTranscription,
      getTranscriptionText,
      shouldRenderVirtues,
      virtuesLabel,
      virtueText,
    ]);

    if (isPlayerDrawer) {
      return (
        <div className="flex items-center justify-center gap-4 p-4">
          <button
            onClick={onRepeatToggle}
            aria-label="Repeat"
            className={buttonClassNames}
          >
            <span
              className={`material-icons-round ${repeatIconClassNames} ${
                isRepeat ? "text-green-500" : ""
              }`}
            >
              {isRepeat ? "repeat_on" : "repeat"}
            </span>
          </button>
          <button
            onClick={handleSkipBackward}
            aria-label="Skip Backward"
            className={buttonClassNames}
          >
            <span className={`material-icons-round ${iconClassNames}`}>
              skip_previous
            </span>
          </button>
          <button
            onClick={handlePlayPause}
            aria-label="Play/Pause"
            className={buttonClassNames}
          >
            {isCurrentlyPlaying ? (
              <span className={`material-icons-round ${iconClassNames}`}>
                pause
              </span>
            ) : (
              <span className={`material-icons-round ${iconClassNames}`}>
                play_arrow
              </span>
            )}
          </button>
          <button
            onClick={handleSkipForward}
            aria-label="Skip Forward"
            className={buttonClassNames}
          >
            <span className={`material-icons-round ${iconClassNames}`}>
              skip_next
            </span>
          </button>
          <button
            onClick={onSpeedChange}
            aria-label="Speed"
            className={`${buttonClassNames} min-w-[48px]`}
          >
            <div className="speed-box">{speedIconMapping[playbackRate]}</div>
          </button>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className="card py-4 px-0 rounded shadow transition-colors border-2 mb-20 relative w-full"
        style={{ borderColor: "var(--card-text)" }}
      >
        <div className="mb-4 px-4">
          {showTranslation && language !== "عربي" ? (
            azkar.lines.map((line, index) => (
              <div
                key={`${azkar.id}-${line.lineNumber}-${index}`}
                className={`p-2 rounded transition-colors ${
                  currentLineIndex === index ? "combined-text-highlight" : ""
                }`}
              >
                <p
                  className={`text-xl text-right quran-font leading-tight ${
                    showTranscription ? "text-[var(--translation-text)]" : ""
                  }`}
                  lang={showTranscription ? undefined : "ar"}
                  dir="rtl"
                >
                  {showTranscription ? getTranscriptionText(line) : line.arabic}
                </p>
                {line.translations[language] && (
                  <p
                    className="mt-1 text-[var(--translation-text)] text-base leading-tight"
                    dir="ltr"
                  >
                    {line.translations[language]}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div
              className="text-2xl quran-font leading-tight text-right"
              lang={showTranscription ? undefined : "ar"}
              dir="rtl"
            >
              {azkar.lines.map((line, index) => (
                <span
                  key={`${azkar.id}-${line.lineNumber}-${index}`}
                  className={`${
                    currentLineIndex === index ? "combined-text-highlight" : ""
                  } ${showTranscription ? "text-xl" : ""}`}
                >
                  {showTranscription ? getTranscriptionText(line) : line.arabic}
                  {showTranscription && index < azkar.lines.length - 1
                    ? ","
                    : ""}
                  {index < azkar.lines.length - 1 && " "}
                </span>
              ))}
            </div>
          )}
        </div>

        {shouldRenderVirtues && (
          <div
            className={`mb-4 px-4 ${
              language === "عربي" ? "text-right" : "text-left"
            }`}
            dir={language === "عربي" ? "rtl" : "ltr"}
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {virtuesLabel}
            </p>
            <p
              className={
                language === "عربي"
                  ? "text-base quran-font mt-2"
                  : "text-sm mt-1 text-[var(--translation-text)]"
              }
              lang={language === "عربي" ? "ar" : undefined}
            >
              {virtueText}
            </p>
          </div>
        )}

        {selectedCategory !== "surahs" && selectedCategory !== "duas" && (
          <div className="flex items-center justify-center px-4">
            <button
              onClick={handleIncrement}
              disabled={isCompleted}
              className={`w-full py-4 text-lg font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isCompleted
                  ? "bg-[#283618] cursor-not-allowed"
                  : "bg-[#606c38] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[#606c38]/90 active:bg-[#606c38]/80"
              }`}
              aria-label={`Progress: ${counter} of ${azkar.count}`}
            >
              {getButtonText()}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center mt-4 gap-4 px-4">
          {language !== "عربي" && (
            <button
              onClick={() => setShowTranslation((prev) => !prev)}
              aria-label="Toggle Translation"
            >
              <span className={`material-icons-round ${iconClassNames}`}>
                translate
              </span>
            </button>
          )}

          {(isRussianOrKyrgyz || isEnglish) && hasTranscription && (
            <button
              onClick={() => setShowTranscription((prev) => !prev)}
              aria-label="Toggle Transcription"
            >
              <span className={`material-icons-round ${iconClassNames}`}>
                {showTranscription
                  ? "closed_caption"
                  : "closed_caption_disabled"}
              </span>
            </button>
          )}

          {hasAudio && (
            <button
              onClick={handlePlayPause}
              aria-label="Play/Pause"
              className={buttonClassNames}
            >
              {isCurrentlyPlaying ? (
                <span className={`material-icons-round ${iconClassNames}`}>
                  pause
                </span>
              ) : (
                <span className={`material-icons-round ${iconClassNames}`}>
                  play_arrow
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleShare}
            aria-label="Share"
            className={buttonClassNames}
          >
            <span className={`material-icons-round ${iconClassNames}`}>
              share
            </span>
          </button>

          <button
            onClick={handleFavoriteClick}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            className={buttonClassNames}
          >
            <span
              className={`material-icons-round ${iconClassNames}`}
              style={{ color: isFavorite ? "#ef233c" : "inherit" }}
            >
              {favoriteIcon}
            </span>
          </button>
        </div>
      </div>
    );
  }
);

AzkarCard.displayName = "AzkarCard";
export default AzkarCard;
