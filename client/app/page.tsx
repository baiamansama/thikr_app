"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import azkarsData from "./azkars.json";

interface Translation {
  [language: string]: string;
}

interface AzkarContent {
  arabic: string;
  translations: Translation;
}

interface Virtues {
  arabic: string;
  translations: Translation;
}

export interface IAzkar {
  id: string;
  count: number;
  content: AzkarContent;
  virtues: Virtues;
}

interface CategoryTranslations {
  [language: string]: string;
}

interface Category {
  id: string;
  translations: CategoryTranslations;
  azkars: IAzkar[];
}

interface UIActions {
  [key: string]: Translation;
}

interface IData {
  metadata: {
    version: string;
    lastUpdated: string;
    supportedLanguages: string[];
  };
  localization: {
    ui: {
      actions: UIActions;
    };
  };
  categories: {
    [key: string]: Category;
  };
}

export interface IThikrDB {
  selectedCategory: string;
  language: string;
  counters: {
    [azkarId: string]: number;
  };
}

interface IAzkarCardProps {
  azkar: IAzkar;
  language: string;
  uiTranslations: UIActions;
  counter: number;
  updateCounter: (azkarId: string, newCount: number) => void;
}

const LOCAL_STORAGE_KEY = "thikr_db";

const INITIAL_LANGUAGE = "кыргыз";

export default function HomePage() {
  const data: IData = azkarsData;
  const categories = useMemo(() => Object.values(data.categories), [data]);
  const defaultCategory = categories.length > 0 ? categories[0].id : "";

  const initialDB: IThikrDB = {
    selectedCategory: defaultCategory,
    language: INITIAL_LANGUAGE,
    counters: {},
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

  const { language, selectedCategory, counters } = db;

  const handleLanguageClick = useCallback((lang: string) => {
    setDb((prev) => ({ ...prev, language: lang }));
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

  const selectedCategoryData = useMemo(
    () => data.categories[selectedCategory],
    [data, selectedCategory]
  );
  const languages = useMemo(() => data.metadata.supportedLanguages, [data]);
  const uiTranslations = useMemo(() => data.localization.ui.actions, [data]);

  const getLanguageDisplay = (lang: string): string =>
    lang === "عربي" ? "عربي" : lang;

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-4 mb-4">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageClick(lang)}
            className={`cursor-pointer px-3 py-1 rounded border transition-colors 
              ${
                lang === language
                  ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            aria-pressed={lang === language}
          >
            {getLanguageDisplay(lang)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded transition-colors 
              ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              }`}
            aria-pressed={selectedCategory === category.id}
          >
            {category.translations[language] || category.id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedCategoryData.azkars.map((azkar) => (
          <AzkarCard
            key={azkar.id}
            azkar={azkar}
            language={language}
            uiTranslations={uiTranslations}
            counter={counters[azkar.id] || 0}
            updateCounter={updateCounter}
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
}: IAzkarCardProps) {
  const isCompleted = counter >= azkar.count;

  const handleIncrement = useCallback(() => {
    if (counter < azkar.count) {
      updateCounter(azkar.id, counter + 1);
    }
  }, [counter, azkar, updateCounter]);

  const getButtonText = useCallback((): string => {
    if (isCompleted) {
      return uiTranslations.completed?.[language] || "Completed";
    }
    const tapText = uiTranslations.tap?.[language] || "Tap";
    return `${tapText} (${counter}/${azkar.count})`;
  }, [isCompleted, uiTranslations, language, counter, azkar.count]);

  const getContent = useCallback((): string => {
    return language === "عربي"
      ? azkar.content.arabic
      : azkar.content.translations[language];
  }, [azkar.content, language]);

  const getVirtues = useCallback((): string => {
    return language === "عربي"
      ? azkar.virtues.arabic
      : azkar.virtues.translations[language];
  }, [azkar.virtues, language]);

  return (
    <div
      className={`${
        isCompleted ? "bg-green-100" : "bg-white"
      } shadow rounded p-4 transition-colors`}
      role="article"
      aria-label={`Azkar card - ${getContent()}`}
    >
      <div className="mb-2">
        <p className="text-xl font-bold text-right" lang="ar" dir="rtl">
          {azkar.content.arabic}
        </p>
        {language !== "عربي" && (
          <p className="mt-2" dir="ltr">
            {getContent()}
          </p>
        )}
      </div>
      <div className="mb-4" dir={language === "عربي" ? "rtl" : "ltr"}>
        <p className="text-sm text-gray-600">{getVirtues()}</p>
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={handleIncrement}
          disabled={isCompleted}
          className={`w-full py-4 text-lg font-bold rounded transition-colors 
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              isCompleted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
            }`}
          aria-label={`Progress: ${counter} of ${azkar.count}`}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
