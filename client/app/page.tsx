"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import azkarsData from "./azkars.json";
import AzkarCard from "./../components/AzkarCard";
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
  virtues: Translation;
  settings: Translation;
}

interface ITheme {
  id: string;
  translations: Translation;
}

interface AudioState {
  currentlyPlayingId: string | null;
  availableAudios: Set<string>;
}

interface IVirtues {
  azkar_id: string;
  arabic: string;
  english: string;
  кыргыз: string;
  русский: string;
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

interface ICategory {
  id: string;
  translations: Translation;
  azkars: {
    azkar_id: string;
    lineNumber: string;
    count?: string;
    arabic: string;
    english: string;
    кыргыз: string;
    русский: string;
    timestamp?: string;
  }[];
  virtues: IVirtues[];
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
  favorites: { [categoryId: string]: Set<string> };
}

const LOCAL_STORAGE_KEY = "thikr_db";
const INITIAL_DB: IThikrDB = {
  selectedCategory: "morning",
  language: "кыргыз",
  theme: "auto",
  counters: {},
  favorites: {},
};

export default function HomePage() {
  const data: IData = azkarsData;
  const categories = useMemo(() => data.categories, [data]);

  const [hasMounted, setHasMounted] = useState(false);
  const [db, setDb] = useState<IThikrDB>(INITIAL_DB);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clearHistoryClicked, setClearHistoryClicked] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>({
    currentlyPlayingId: null,
    availableAudios: new Set<string>(),
  });
  const isMounted = useRef(false);

  const drawerOpenRef = useRef(drawerOpen);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleAudioStateChange = useCallback((azkarId: string | null) => {
    setAudioState((prev) => ({
      ...prev,
      currentlyPlayingId: azkarId,
    }));
  }, []);

  useEffect(() => {
    drawerOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== "undefined") {
      const storedDB = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDB) {
        const parsedDB = JSON.parse(storedDB) as IThikrDB;
        const favorites = parsedDB.favorites || {};
        Object.keys(favorites).forEach((key) => {
          favorites[key] = new Set(favorites[key]);
        });
        setDb({ ...parsedDB, favorites });
      }
    }
  }, []);

  useEffect(() => {
    if (hasMounted && typeof window !== "undefined") {
      const storableDb = {
        ...db,
        favorites: Object.fromEntries(
          Object.entries(db.favorites).map(([key, value]) => [
            key,
            Array.from(value),
          ])
        ),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storableDb));
    }
  }, [db, hasMounted]);

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

  const toggleFavorite = useCallback((azkarId: string) => {
    setDb((prev) => {
      const categoryFavorites =
        prev.favorites[prev.selectedCategory] || new Set<string>();
      const newFavorites = new Set(categoryFavorites);
      if (newFavorites.has(azkarId)) {
        newFavorites.delete(azkarId);
      } else {
        newFavorites.add(azkarId);
      }
      return {
        ...prev,
        favorites: {
          ...prev.favorites,
          [prev.selectedCategory]: newFavorites,
        },
      };
    });
  }, []);

  const { language, selectedCategory, theme, counters, favorites } = db;

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

  const selectedCategoryData = useMemo(() => {
    return categories.find((cat) => cat.id === selectedCategory);
  }, [categories, selectedCategory]);

  const groupedAzkars = useMemo(() => {
    if (!selectedCategoryData) return [];
    const groups = new Map<string, IAzkarEntry>();

    selectedCategoryData.azkars.forEach((raw) => {
      const id = raw.azkar_id;
      if (!groups.has(id)) {
        groups.set(id, { id, count: Number(raw.count), lines: [] });
      }
      const entry = groups.get(id);
      if (entry) {
        entry.lines.push({
          lineNumber: Number(raw.lineNumber),
          arabic: raw.arabic,
          translations: {
            english: raw.english || "",
            кыргыз: raw.кыргыз || "",
            русский: raw.русский || "",
          },
          timestamp: raw.timestamp ? Number(raw.timestamp) : undefined,
        });
      }
    });

    for (const entry of groups.values()) {
      entry.lines.sort((a, b) => a.lineNumber - b.lineNumber);
    }

    // No sorting by favorites
    return Array.from(groups.values());
  }, [selectedCategoryData]);

  useEffect(() => {
    isMounted.current = true;

    const checkAudioAvailability = async (azkarId: string) => {
      try {
        const response = await fetch(`/audio/${azkarId}.m4a`, {
          method: "HEAD",
        });
        if (response.ok && isMounted.current) {
          setAudioState((prev) => ({
            ...prev,
            availableAudios: new Set([...prev.availableAudios, azkarId]),
          }));
        }
      } catch (error) {
        console.error(`Audio file check failed for ${azkarId}:`, error);
      }
    };

    groupedAzkars.forEach((azkar) => {
      checkAudioAvailability(azkar.id);
    });

    return () => {
      isMounted.current = false;
    };
  }, [groupedAzkars]);

  useEffect(() => {
    setAudioState((prev) => ({
      ...prev,
      currentlyPlayingId: null,
    }));
  }, [selectedCategory]);

  if (!hasMounted || !selectedCategoryData) return null;

  return (
    <>
      <div className="container mx-auto px-4 py-6 transition-colors">
        <div style={{ paddingBottom: "120px" }}>
          <header className="mb-8 text-center py-4">
            <h1 className="text-4xl font-extrabold text-[var(--card-text)]">
              {selectedCategoryData.translations[language] ||
                selectedCategoryData.id}
            </h1>
          </header>
          <section className="grid grid-cols-1 gap-6 mt-6">
            {groupedAzkars.map((azkar, index) => {
              const virtue = selectedCategoryData.virtues.find(
                (v) => v.azkar_id === azkar.id
              );
              const hasAudio = audioState.availableAudios.has(azkar.id);
              const isPlaying = audioState.currentlyPlayingId === azkar.id;
              const isFavorite = (favorites[selectedCategory] || new Set()).has(
                azkar.id
              );
              return (
                <div
                  key={azkar.id}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  className="relative z-10"
                >
                  <AzkarCard
                    azkar={azkar}
                    language={language}
                    uiTranslations={data.uiTranslations}
                    counter={counters[azkar.id] || 0}
                    updateCounter={updateCounter}
                    virtue={virtue}
                    audioSrc={hasAudio ? `/audio/${azkar.id}.m4a` : undefined}
                    isCurrentlyPlaying={isPlaying}
                    onAudioStateChange={(playing) =>
                      handleAudioStateChange(playing ? azkar.id : null)
                    }
                    selectedCategory={selectedCategory}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                  />
                </div>
              );
            })}
          </section>
        </div>
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 p-2 shadow-inner z-20  ${
          computedTheme === "light"
            ? "bg-[#ffffff]"
            : computedTheme === "dark"
            ? "bg-[#0a0a0a]"
            : "bg-[#f4ecd8]"
        }`}
      >
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap px-2">
          {groupedAzkars.map((azkar, index) => {
            const currentCount = counters[azkar.id] || 0;
            const progress = Math.min(currentCount / azkar.count, 1);
            const isFavorite = (favorites[selectedCategory] || new Set()).has(
              azkar.id
            );

            return (
              <button
                key={azkar.id}
                onClick={() =>
                  cardRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="relative w-10 h-10 flex-shrink-0 border border-[var(--card-text)] rounded-full flex items-center justify-center text-sm font-bold overflow-hidden transition-all duration-200"
              >
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-200 ${
                    isFavorite ? "bg-[#ef233c]" : "bg-[#606c38]"
                  }`}
                  style={{ width: `${progress * 100}%` }}
                />
                <span
                  className={`relative z-10 ${
                    isFavorite
                      ? "material-icons-round text-xl"
                      : "text-[var(--card-text)]"
                  }`}
                >
                  {isFavorite
                    ? progress === 1
                      ? "favorite"
                      : "favorite_border"
                    : index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Drawer onOpenChange={(open) => setDrawerOpen(open)}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="fixed top-4 right-4 p-2 z-50 bg-transparent border-[var(--card-border)] text-[var(--card-text)]"
          >
            <span className="material-icons-round text-2xl">settings</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-full p-4 h-auto bg-[var(--card-bg)] text-[var(--card-text)]">
          <DrawerHeader>
            <div className="flex justify-center">
              <DrawerTitle className="text-center">
                {data.uiTranslations.settings[language] || "Settings"}
              </DrawerTitle>
              <Description />
            </div>
          </DrawerHeader>

          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {data.metadata.supportedLanguages.map((lang) => (
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
                    {lang === "عربي" ? "عربي" : lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {data.themes.map((item) => (
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

            {(selectedCategory === "morning" ||
              selectedCategory === "evening") && (
              <div className="p-4 flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newCounters = { ...db.counters };
                    groupedAzkars.forEach((azkar) => {
                      newCounters[azkar.id] = 0;
                    });
                    setDb((prev) => ({ ...prev, counters: newCounters }));
                    setClearHistoryClicked(true);
                    setTimeout(() => setClearHistoryClicked(false), 200);
                  }}
                  className={`transition-colors px-3 py-1 rounded border ${
                    clearHistoryClicked
                      ? "bg-[#606c38] text-white border-[#606c38] hover:bg-[#606c38]/90"
                      : "bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
                  }`}
                >
                  {data.uiTranslations.actions.clean_history[language] ||
                    "🗑️ Clear History"}
                </Button>
              </div>
            )}
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
