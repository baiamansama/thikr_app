"use client";

import React, {
  useCallback,
  useMemo,
  forwardRef,
  Ref,
  useState,
  useRef,
  useEffect,
} from "react";
import { Card, CardContent } from "@/components/ui/card";

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
  onAudioStateChange?: (playing: boolean) => void;
  selectedCategory: string;
  isFavorite: boolean;
  toggleFavorite: (azkarId: string) => void;
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
      selectedCategory,
      isFavorite,
      toggleFavorite,
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const [copied, setCopied] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isRepeat, setIsRepeat] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isSkipping, setIsSkipping] = useState<"forward" | "backward" | null>(
      null
    );
    const [showFixedPlayer, setShowFixedPlayer] = useState(false);
    const [audioError, setAudioError] = useState(false);

    const isCompleted = counter >= azkar.count;
    const hasAudio = Boolean(audioSrc);

    const timestamps = useMemo(() => {
      return azkar.lines
        .map((line) => line.timestamp)
        .filter((ts): ts is number => ts !== undefined)
        .sort((a, b) => a - b);
    }, [azkar.lines]);

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

    const hasCompletedEffectTriggered = useRef(false);
    useEffect(() => {
      if (isCompleted && !hasCompletedEffectTriggered.current) {
        hasCompletedEffectTriggered.current = true;
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }, [isCompleted]);

    useEffect(() => {
      if (!hasAudio) return;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      const handleError = (e: Event) => {
        console.error("Audio error:", e);
        setAudioError(true);
        setIsPlaying(false);
        setShowFixedPlayer(false);
      };
      audio.addEventListener("error", handleError);
      return () => {
        audio.removeEventListener("error", handleError);
        audio.pause();
        audioRef.current = null;
      };
    }, [audioSrc, hasAudio]);

    useEffect(() => {
      const audioEl = audioRef.current;
      if (!audioEl || !hasAudio) return;
      const handleTimeUpdate = () => {
        setCurrentTime(audioEl.currentTime);
      };
      audioEl.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }, [hasAudio]);

    useEffect(() => {
      const audioEl = audioRef.current;
      if (!audioEl || !hasAudio) return;
      const handleEnded = () => {
        if (isRepeat) {
          audioEl.currentTime = 0;
          audioEl.play().catch((err) => {
            console.error("Audio replay error:", err);
            setAudioError(true);
          });
        } else {
          setIsPlaying(false);
        }
      };
      audioEl.addEventListener("ended", handleEnded);
      return () => {
        audioEl.removeEventListener("ended", handleEnded);
      };
    }, [isRepeat, hasAudio]);

    const handlePlayPause = useCallback(() => {
      if (!audioRef.current || !hasAudio || audioError) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((err) => {
          console.error("Audio play error:", err);
          setAudioError(true);
        });
        setIsPlaying(true);
        setShowFixedPlayer(true);
      }
    }, [isPlaying, hasAudio, audioError]);

    const handleHidePlayer = useCallback(() => {
      setShowFixedPlayer(false);
    }, []);

    const handleSpeedChange = useCallback(() => {
      let newRate = playbackRate;
      if (playbackRate === 1) newRate = 1.5;
      else if (playbackRate === 1.5) newRate = 2;
      else newRate = 1;
      setPlaybackRate(newRate);
      if (audioRef.current) {
        audioRef.current.playbackRate = newRate;
      }
    }, [playbackRate]);

    const handleRepeatToggle = useCallback(() => {
      setIsRepeat((prev) => !prev);
    }, []);

    const handleSkipBackward = useCallback(() => {
      if (!audioRef.current || timestamps.length === 0) return;
      setIsSkipping("backward");
      setTimeout(() => setIsSkipping(null), 200);
      const current = audioRef.current.currentTime;
      const previousTimestamp = [...timestamps]
        .reverse()
        .find((ts) => ts < current - 0.5);
      audioRef.current.currentTime =
        previousTimestamp !== undefined ? previousTimestamp : 0;
    }, [timestamps]);

    const handleSkipForward = useCallback(() => {
      if (!audioRef.current || timestamps.length === 0) return;
      setIsSkipping("forward");
      setTimeout(() => setIsSkipping(null), 200);
      const current = audioRef.current.currentTime;
      const nextTimestamp = timestamps.find((ts) => ts > current + 0.5);
      if (nextTimestamp !== undefined) {
        audioRef.current.currentTime = nextTimestamp;
      }
    }, [timestamps]);

    const handleIncrement = useCallback(() => {
      if (counter < azkar.count) {
        updateCounter(azkar.id, counter + 1);
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
        e.preventDefault(); // Ensure no default behavior causes scrolling
        e.stopPropagation(); // Prevent event bubbling
        toggleFavorite(azkar.id);
      },
      [azkar.id, toggleFavorite]
    );

    return (
      <>
        <div
          ref={ref}
          className="card p-4 rounded shadow transition-colors border-2 mb-20 relative"
          style={{ borderColor: "var(--card-text)" }}
        >
          <div className="mb-4">
            {azkar.lines.map((line) => {
              const isRead =
                audioSrc &&
                isPlaying &&
                line.timestamp !== undefined &&
                line.timestamp <= currentTime;
              return (
                <div key={line.lineNumber} className="mb-2">
                  <p
                    className={`text-xl font-bold text-right content-arabic ${
                      audioSrc && isPlaying
                        ? `transition-opacity duration-300 ${
                            isRead ? "opacity-100" : "opacity-40"
                          }`
                        : ""
                    }`}
                    lang="ar"
                    dir="rtl"
                  >
                    {line.arabic}
                  </p>
                  {language !== "عربي" &&
                    showTranslation &&
                    line.translations[language] && (
                      <p
                        className={`mt-1 text-[var(--translation-text)] ${
                          audioSrc && isPlaying
                            ? `transition-opacity duration-300 ${
                                isRead ? "opacity-100" : "opacity-40"
                              }`
                            : ""
                        }`}
                        dir="ltr"
                      >
                        {line.translations[language]}
                      </p>
                    )}
                </div>
              );
            })}
          </div>

          {shouldRenderVirtues && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {virtuesLabel}
              </p>
              <p
                className={
                  language === "عربي"
                    ? "text-sm text-right content-arabic"
                    : "text-sm mt-1 text-[var(--translation-text)]"
                }
                lang={language === "عربي" ? "ar" : undefined}
                dir={language === "عربي" ? "rtl" : "ltr"}
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
            <button
              onClick={() => setShowTranslation((prev) => !prev)}
              aria-label="Toggle Translation"
            >
              <span className={`material-icons-round ${iconClassNames}`}>
                translate
              </span>
            </button>

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

            {hasAudio && !audioError && (
              <button
                onClick={handlePlayPause}
                aria-label="Play/Pause"
                className={buttonClassNames}
              >
                {isPlaying ? (
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

            {/* Modified Favorite Button */}
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

          <audio ref={audioRef} src={audioSrc} />
        </div>

        {showFixedPlayer && hasAudio && !audioError && (
          <Card className="fixed bottom-5 left-4 right-4 z-50 rounded-xl shadow-xl bg-[#669bbc] dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 relative">
              <button
                onClick={handleHidePlayer}
                aria-label="Hide Player"
                className="absolute top-2 right-1"
              >
                <span className={`material-icons-round ${iconClassNames}`}>
                  remove
                </span>
              </button>

              <div className="flex justify-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRepeatToggle}
                    aria-label="Repeat"
                    className={buttonClassNames}
                  >
                    <span
                      className={`material-icons-round ${repeatIconClassNames} transition-opacity`}
                      style={
                        isRepeat
                          ? { filter: "brightness(1.2) contrast(1.2)" }
                          : undefined
                      }
                    >
                      {isRepeat ? "repeat_on" : "repeat"}
                    </span>
                  </button>
                  <button
                    onClick={handleSkipBackward}
                    aria-label="Skip Backward"
                    className={`${buttonClassNames} ${
                      isSkipping === "backward" ? "scale-90" : ""
                    }`}
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
                    {isPlaying ? (
                      <span
                        className={`material-icons-round ${iconClassNames}`}
                      >
                        pause
                      </span>
                    ) : (
                      <span
                        className={`material-icons-round ${iconClassNames}`}
                      >
                        play_arrow
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleSkipForward}
                    aria-label="Skip Forward"
                    className={`${buttonClassNames} ${
                      isSkipping === "forward" ? "scale-90" : ""
                    }`}
                  >
                    <span className={`material-icons-round ${iconClassNames}`}>
                      skip_next
                    </span>
                  </button>
                  <button
                    onClick={handleSpeedChange}
                    aria-label="Speed"
                    className={`${buttonClassNames} min-w-[48px]`}
                  >
                    <div className="speed-box">
                      {speedIconMapping[playbackRate]}{" "}
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }
);

AzkarCard.displayName = "AzkarCard";
export default AzkarCard;
