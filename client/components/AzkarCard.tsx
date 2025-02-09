"use client";
import React, { useCallback, useMemo, forwardRef, Ref, useState } from "react";

interface Translation {
  [language: string]: string;
}

interface IAzkarLine {
  lineNumber: number;
  arabic: string;
  translations: Translation;
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
  toggleTranslation: {
    show: Translation;
  };
  virtues: Translation;
  settings: Translation;
}

export interface IVirtues {
  azkar_id: string;
  arabic: string;
  english: string;
  кыргыз: string;
  русский: string;
  français?: string;
  español?: string;
}

export interface IAzkarCardProps {
  azkar: IAzkarEntry;
  language: string;
  uiTranslations: IUITranslations;
  counter: number;
  updateCounter: (azkarId: string, newCount: number) => void;
  showTranslation: boolean;
  virtue?: IVirtues;
}

const AzkarCard = forwardRef<HTMLDivElement, IAzkarCardProps>(
  (
    {
      azkar,
      language,
      uiTranslations,
      counter,
      updateCounter,
      showTranslation,
      virtue,
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const [copied, setCopied] = useState(false);
    const isCompleted = counter >= azkar.count;

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
      else if (language === "français") translation = virtue["français"] || "";
      else if (language === "español") translation = virtue["español"] || "";
      else if (language === "русский") translation = virtue["русский"] || "";
      return translation.trim() !== ""
        ? translation
        : virtue.arabic?.trim() || "";
    }, [virtue, language]);

    const shouldRenderVirtues = virtuesLabel !== "" && virtueText !== "";

    const getCardText = useCallback(() => {
      return azkar.lines
        .map((line) => {
          let text = line.arabic;
          if (
            showTranslation &&
            language !== "عربي" &&
            line.translations[language]
          ) {
            text += "\n" + line.translations[language];
          }
          return text;
        })
        .join("\n\n");
    }, [azkar, showTranslation, language]);

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

    return (
      <div ref={ref} className="card p-4 rounded shadow transition-colors">
        <div className="mb-4">
          {azkar.lines.map((line) => (
            <div key={line.lineNumber} className="mb-2">
              <p
                className="text-xl font-bold text-right content-arabic"
                lang="ar"
                dir="rtl"
              >
                {line.arabic}
              </p>
              {language !== "عربي" &&
                showTranslation &&
                line.translations[language] !== "" && (
                  <p className="mt-1 text-[var(--translation-text)]" dir="ltr">
                    {line.translations[language]}
                  </p>
                )}
            </div>
          ))}
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
        <div className="flex items-center justify-center">
          <button
            onClick={handleIncrement}
            disabled={isCompleted}
            className={`w-full py-4 text-lg font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isCompleted
                ? "bg-[#283618] cursor-not-allowed"
                : "bg-[#606c38] text-[var(--card-text)] hover:bg-[#606c38]/90 active:bg-[#606c38]/80"
            }`}
            aria-label={`Progress: ${counter} of ${azkar.count}`}
          >
            {getButtonText()}
          </button>
        </div>
        <div className="flex items-center justify-center mt-4 gap-4">
          <div className="relative">
            <button onClick={handleCopy} aria-label="Copy" className="p-2">
              {copied ? (
                <img
                  src="/copiedIcon.svg"
                  alt="Copied Icon"
                  className="w-6 h-6"
                />
              ) : (
                <img src="/copyIcon.svg" alt="Copy Icon" className="w-6 h-6" />
              )}
            </button>
          </div>
          <button onClick={handleShare} aria-label="Share" className="p-2">
            <img src="/shareIcon.svg" alt="Share Icon" className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }
);

AzkarCard.displayName = "AzkarCard";

export default AzkarCard;
