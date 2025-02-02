"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import azkarsData from "./azkars.json";

interface Translation {
  [language: string]: string;
}

interface IMetadata {
  version: string;
  lastUpdated: string;
  supportedLanguages: string[];
}

interface IUIActions {
  tap: Translation;
  completed: Translation;
}

interface IUITranslations {
  actions: IUIActions;
  toggleTranslation: {
    show: Translation;
  };
}

interface ITheme {
  id: string;
  translations: Translation;
}

interface IAzkarLine {
  lineNumber: number;
  arabic: string;
  translations: Translation;
}

interface IVirtues {
  lines: IAzkarLine[];
}

export interface IAzkarEntry {
  id: string;
  count: number;
  lines: IAzkarLine[];
  virtues: IVirtues;
}

interface ICategory {
  id: string;
  translations: Translation;
  azkars: IAzkarEntry[];
}

interface IData {
  metadata: IMetadata;
  uiTranslations: IUITranslations;
  themes: ITheme[];
  categories: ICategory[];
}

export interface IThikrDB {
  selectedCategory: string;
  language: string;
  theme: string;
  counters: { [azkarId: string]: number };
  showTranslation: boolean;
}

interface IAzkarCardProps {
  azkar: IAzkarEntry;
  language: string;
  uiTranslations: IUITranslations;
  counter: number;
  updateCounter: (azkarId: string, newCount: number) => void;
  showTranslation: boolean;
}

const LOCAL_STORAGE_KEY = "thikr_db";
const INITIAL_LANGUAGE = "кыргыз";
const INITIAL_THEME = "auto";

interface IToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<IToggleSwitchProps> = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
        border 
        ${
          enabled
            ? "bg-[#ccd5ae] border-[#ccd5ae] dark:bg-[#ccd5ae] dark:border-[#ccd5ae]"
            : "bg-transparent border-gray-400 dark:border-gray-600"
        } 
        focus:outline-none focus:ring-2 focus:ring-offset-2`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform 
          ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
};

export default function HomePage() {
  const data: IData = azkarsData;
  const categories = useMemo(() => data.categories, [data]);
  const defaultCategory = categories.length > 0 ? categories[0].id : "";

  const initialDB: IThikrDB = {
    selectedCategory: defaultCategory,
    language: INITIAL_LANGUAGE,
    theme: INITIAL_THEME,
    counters: {},
    showTranslation: false,
  };

  const [hasMounted, setHasMounted] = useState(false);
  const [db, setDb] = useState<IThikrDB>(initialDB);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as IThikrDB;
        setDb(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (hasMounted && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
    }
  }, [db, hasMounted]);

  const { language, selectedCategory, theme, counters, showTranslation } = db;

  const handleLanguageClick = useCallback((lang: string) => {
    setDb((prev) => ({ ...prev, language: lang }));
  }, []);

  const handleThemeClick = useCallback((newTheme: string) => {
    setDb((prev) => ({ ...prev, theme: newTheme }));
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setDb((prev) => ({ ...prev, selectedCategory: categoryId }));
  }, []);

  const updateCounter = useCallback((azkarId: string, newCount: number) => {
    setDb((prev) => ({
      ...prev,
      counters: { ...prev.counters, [azkarId]: newCount },
    }));
  }, []);

  const toggleTranslation = useCallback(() => {
    setDb((prev) => ({ ...prev, showTranslation: !prev.showTranslation }));
  }, []);

  const selectedCategoryData = useMemo(() => {
    return categories.find((cat) => cat.id === selectedCategory);
  }, [categories, selectedCategory]);

  const supportedLanguages = useMemo(
    () => data.metadata.supportedLanguages,
    [data]
  );
  const uiTranslations = useMemo(() => data.uiTranslations, [data]);
  const themes = useMemo(() => data.themes, [data]);

  const getLanguageDisplay = (lang: string): string =>
    lang === "عربي" ? "عربي" : lang;

  const computedTheme = useMemo(() => {
    if (theme === "auto") {
      const hour = new Date().getHours();
      return hour >= 6 && hour < 18 ? "light" : "dark";
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light-theme", "dark-theme", "sepia-theme");
    root.classList.add(`${computedTheme}-theme`);
  }, [computedTheme]);

  if (!hasMounted || !selectedCategoryData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 transition-colors">
      <div className="flex flex-col gap-4">
        <div className="settings p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageClick(lang)}
                className={`flex justify-center items-center cursor-pointer px-3 py-1 rounded border transition-colors
                  ${
                    lang === language
                      ? "bg-[#ccd5ae] text-[var(--card-text)] border-[#ccd5ae] hover:bg-[#ccd5ae]/90"
                      : "bg-transparent border-current hover:opacity-80"
                  }`}
                aria-pressed={lang === language}
              >
                {getLanguageDisplay(lang)}
              </button>
            ))}
          </div>
        </div>
        <div className="settings p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {themes.map((item) => (
              <button
                key={item.id}
                onClick={() => handleThemeClick(item.id)}
                className={`flex justify-center items-center gap-2 px-3 py-1 rounded border transition-colors
                  ${
                    item.id === theme
                      ? "bg-[#ccd5ae] text-[var(--card-text)] border-[#ccd5ae] hover:bg-[#ccd5ae]/90"
                      : "bg-transparent border-current hover:opacity-80"
                  }`}
                aria-pressed={item.id === theme}
              >
                <span>{item.translations[language] || item.id}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="settings p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex justify-center items-center cursor-pointer px-4 py-2 rounded border transition-colors
                  ${
                    selectedCategory === category.id
                      ? "bg-[#ccd5ae] text-[var(--card-text)] border-[#ccd5ae] hover:bg-[#ccd5ae]/90"
                      : "bg-transparent border-current hover:opacity-80"
                  }`}
                aria-pressed={selectedCategory === category.id}
              >
                {category.translations[language] || category.id}
              </button>
            ))}
          </div>
        </div>
        {language !== "عربي" && (
          <div className="settings p-4 flex items-center gap-2 justify-center">
            <span className="flex justify-center items-center cursor-default px-3 py-1 transition-colors bg-transparent text-[var(--card-text)]">
              {uiTranslations.toggleTranslation.show[language]}
            </span>
            <ToggleSwitch
              enabled={showTranslation}
              onToggle={toggleTranslation}
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 mt-6">
        {selectedCategoryData.azkars.map((azkar) => (
          <AzkarCard
            key={azkar.id}
            azkar={azkar}
            language={language}
            uiTranslations={uiTranslations}
            counter={counters[azkar.id] || 0}
            updateCounter={updateCounter}
            showTranslation={showTranslation}
          />
        ))}
      </div>
    </div>
  );
}

function AzkarCard({
  azkar,
  language,
  uiTranslations,
  counter,
  updateCounter,
  showTranslation,
}: IAzkarCardProps) {
  const isCompleted = counter >= azkar.count;

  const handleIncrement = useCallback(() => {
    if (counter < azkar.count) {
      updateCounter(azkar.id, counter + 1);
    }
  }, [counter, azkar, updateCounter]);

  const getButtonText = useCallback((): string => {
    if (isCompleted) {
      // Append the max count on the right side when completed
      return `${uiTranslations.actions.completed[language] || "Completed"} (${
        azkar.count
      })`;
    }
    const tapText = uiTranslations.actions.tap[language] || "Tap";
    return `${tapText} (${counter}/${azkar.count})`;
  }, [isCompleted, uiTranslations, language, counter, azkar.count]);

  return (
    <div className="card p-4 bg-white dark:bg-gray-800 rounded shadow transition-colors">
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
            {language !== "عربي" && showTranslation && (
              <p className="mt-1 text-[var(--translation-text)]" dir="ltr">
                {line.translations[language] || ""}
              </p>
            )}
          </div>
        ))}
      </div>
      {azkar.virtues.lines.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Virtues:
          </p>
          {azkar.virtues.lines.map((line) => (
            <div key={line.lineNumber} className="mb-1">
              <p
                className="text-sm text-right content-arabic"
                lang="ar"
                dir="rtl"
              >
                {line.arabic}
              </p>
              {language !== "عربي" && (
                <p
                  className="text-sm mt-1 text-[var(--translation-text)]"
                  dir="ltr"
                >
                  {line.translations[language] || ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center">
        <button
          onClick={handleIncrement}
          disabled={isCompleted}
          className={`w-full py-4 text-lg font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isCompleted
              ? "bg-[#606c38] cursor-not-allowed"
              : "bg-[#ccd5ae] text-[var(--card-text)] hover:bg-[#ccd5ae]/90 active:bg-[#ccd5ae]/80"
          }`}
          aria-label={`Progress: ${counter} of ${azkar.count}`}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
