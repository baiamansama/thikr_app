"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import azkarsData from "./azkars.json";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Description } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Translation {
  [language: string]: string;
}

interface IMetadata {
  version: string;
  lastUpdated: string;
  supportedLanguages: string[];
}

interface IUIActions {
  clean_history: Translation;
  tap: Translation;
  completed: Translation;
}

interface IUITranslations {
  actions: IUIActions;
  toggleTranslation: {
    show: Translation;
  };
  virtues: Translation;
  settings: Translation;
}

interface ITheme {
  id: string;
  translations: Translation;
}

interface IVirtues {
  id?: number;
  arabic?: string;
  translations?: Translation;
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

interface IToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<IToggleSwitchProps> = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        enabled
          ? "bg-[#606c38] border-[#606c38]"
          : "bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

const LOCAL_STORAGE_KEY = "thikr_db";
const INITIAL_LANGUAGE = "кыргыз";
const INITIAL_THEME = "auto";

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

  const clearHistory = useCallback(() => {
    if (!selectedCategoryData) return;
    const newCounters = { ...db.counters };
    selectedCategoryData.azkars.forEach((azkar) => {
      newCounters[azkar.id] = 0;
    });
    setDb((prev) => ({ ...prev, counters: newCounters }));
  }, [db.counters, selectedCategoryData]);

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
    <>
      <div className="container mx-auto px-4 py-6 transition-colors">
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

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="fixed bottom-4 right-4 p-2">
            ⚙️
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-full p-4 h-auto bg-[var(--card-bg)] text-[var(--card-text)]">
          <DrawerHeader>
            <div className="flex justify-center">
              <DrawerTitle className="text-center">
                {uiTranslations.settings[language] || "Settings"}
              </DrawerTitle>
              <Description />
            </div>
          </DrawerHeader>
          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageClick(lang)}
                    className={`flex justify-center items-center px-3 py-1 rounded border transition-colors ${
                      lang === language
                        ? "bg-[#606c38] text-white border-[#606c38] hover:bg-[#606c38]/90"
                        : "bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
                    }`}
                    aria-pressed={lang === language}
                  >
                    {getLanguageDisplay(lang)}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {themes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleThemeClick(item.id)}
                    className={`flex justify-center items-center gap-2 px-3 py-1 rounded border transition-colors ${
                      item.id === theme
                        ? "bg-[#606c38] text-white border-[#606c38] hover:bg-[#606c38]/90"
                        : "bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
                    }`}
                    aria-pressed={item.id === theme}
                  >
                    <span>{item.translations[language] || item.id}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`flex justify-center items-center px-4 py-2 rounded border transition-colors ${
                      selectedCategory === category.id
                        ? "bg-[#606c38] text-white border-[#606c38] hover:bg-[#606c38]/90"
                        : "bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
                    }`}
                    aria-pressed={selectedCategory === category.id}
                  >
                    {category.translations[language] || category.id}
                  </button>
                ))}
              </div>
            </div>
            {language !== "عربي" && (
              <div className="p-4 flex items-center gap-2 justify-center">
                <span className="flex justify-center items-center cursor-default px-3 py-1 transition-colors bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)]">
                  {uiTranslations.toggleTranslation.show[language]}
                </span>
                <ToggleSwitch
                  enabled={showTranslation}
                  onToggle={toggleTranslation}
                />
              </div>
            )}
            <div className="p-4 flex items-center justify-center">
              <Button variant="outline" onClick={clearHistory}>
                {uiTranslations.actions.clean_history[language] ||
                  "🗑️ Clear History"}
              </Button>
            </div>
          </div>
          <DrawerClose asChild>
            <VisuallyHidden>
              <Button autoFocus />
            </VisuallyHidden>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </>
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
    if (!azkar.virtues || Object.keys(azkar.virtues).length === 0) return "";
    if (language === "عربي") {
      return azkar.virtues.arabic?.trim() || "";
    }
    const translation = azkar.virtues.translations?.[language] || "";
    return translation.trim() !== ""
      ? translation
      : azkar.virtues.arabic?.trim() || "";
  }, [azkar.virtues, language]);

  const shouldRenderVirtues = virtuesLabel !== "" && virtueText !== "";

  return (
    <div className="card p-4 rounded shadow transition-colors">
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
    </div>
  );
}
