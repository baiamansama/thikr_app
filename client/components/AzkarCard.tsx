"use client";

import React, { useCallback, useMemo, forwardRef, Ref, useState } from "react";

interface Translation {
  [language: string]: string;
}

interface IAzkarLine {
  lineNumber: number;
  arabic: string;
  translations: Translation;
  timestamp?: number;
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
    const [copied, setCopied] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);

    const isCompleted = counter >= azkar.count;
    const hasAudio = Boolean(audioSrc);

    const speedIconMapping: { [key: number]: string } = {
      1: "1x",
      1.5: "1.5x",
      2: "2x",
    };

    const iconClassNames = "w-8 h-8 text-[var(--card-text)]";
    const repeatIconClassNames = "w-6 h-6 text-[var(--card-text)]";
    const buttonClassNames = "p-2 flex items-center justify-center";

    const favoriteIcon = useMemo(() => {
      if (isFavorite) {
        return selectedCategory === "morning"
          ? "favorite"
          : selectedCategory === "evening"
          ? "favorite"
          : "bookmark";
      }
      return selectedCategory === "morning"
        ? "favorite_border"
        : selectedCategory === "evening"
        ? "favorite_border"
        : "bookmark_border";
    }, [isFavorite, selectedCategory]);

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
      if (counter < azkar.count) {
        const newCounter = counter + 1;
        updateCounter(azkar.id, newCounter);
        if (newCounter === azkar.count && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }, [counter, azkar, updateCounter]);

    const getButtonText = useCallback((): string => {
      if (isCompleted) {
        return `${uiTranslations.actions.completed[language] || "Completed"} (${
          azkar.count
        })`;
      }
      const tapText = uiTranslations.actions.tap[language] || "Tap";
      return `${tapText} (${counter}/${azkar.count})`;
    }, [isCompleted, uiTranslations, language, counter, azkar.count]);

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

    const getCardText = useCallback(() => {
      let text = azkar.lines
        .map((line) => {
          let lineText = line.arabic;
          if (
            showTranslation &&
            language !== "عربي" &&
            line.translations[language]
          ) {
            lineText += "\n" + line.translations[language];
          }
          return lineText;
        })
        .join("\n\n");

      if (virtue && virtueText.trim() !== "") {
        const label = virtuesLabel !== "" ? virtuesLabel : "Virtues";
        text += "\n\n" + label + ":\n" + virtueText;
      }
      text += "\n\nhttps://thikrapp.vercel.app/";
      return text;
    }, [azkar, showTranslation, language, virtue, virtueText, virtuesLabel]);

    const handleCopy = useCallback(() => {
      const cardText = getCardText();
      navigator.clipboard
        .writeText(cardText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => console.error("Failed to copy text: ", err));
    }, [getCardText]);

    const handleShare = useCallback(() => {
      const cardText = getCardText();
      if (navigator.share) {
        navigator
          .share({
            title: "Azkar",
            text: cardText,
          })
          .catch((err) => {
            if (err.name !== "AbortError") {
              console.error("Share failed:", err);
            }
          });
      } else {
        alert("Share is not supported in this browser.");
      }
    }, [getCardText]);

    const handleFavoriteClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(azkar.id);
      },
      [azkar.id, toggleFavorite]
    );

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
        className="card p-4 rounded shadow transition-colors border-2 mb-20 relative"
        style={{ borderColor: "var(--card-text)" }}
      >
        <div className="mb-4">
          {showTranslation && language !== "عربي" ? (
            azkar.lines.map((line, index) => (
              <div
                key={line.lineNumber}
                className={`p-2 rounded transition-colors ${
                  currentLineIndex === index ? "combined-text-highlight" : ""
                }`}
              >
                <p
                  className="text-2xl text-right quran-font leading-tight"
                  lang="ar"
                  dir="rtl"
                >
                  {line.arabic}
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
              lang="ar"
              dir="rtl"
            >
              {azkar.lines.map((line, index) => (
                <span
                  key={line.lineNumber}
                  className={`${
                    isCurrentlyPlaying && currentLineIndex === index
                      ? "combined-text-highlight"
                      : ""
                  }`}
                >
                  {line.arabic}
                  {index < azkar.lines.length - 1 && " "}
                  {/* Add space between lines */}
                </span>
              ))}
            </div>
          )}
        </div>

        {shouldRenderVirtues && (
          <div
            className={`mb-4 ${
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

        {selectedCategory !== "surahs" && (
          <div className="flex items-center justify-center">
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

        <div className="flex items-center justify-center mt-4 gap-4">
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

          <button
            onClick={handleCopy}
            aria-label="Copy"
            className={buttonClassNames}
          >
            {copied ? (
              <span className={`material-icons-round ${iconClassNames}`}>
                check
              </span>
            ) : (
              <span className={`material-icons-round ${iconClassNames}`}>
                content_copy
              </span>
            )}
          </button>

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
