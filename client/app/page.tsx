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

/* =====================
   Interfaces & Types
===================== */

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
  français?: string;
  español?: string;
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
    count: string;
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
}

/* =====================
   Constants
===================== */

const LOCAL_STORAGE_KEY = "thikr_db";
const INITIAL_DB: IThikrDB = {
  selectedCategory: "morning",
  language: "кыргыз",
  theme: "auto",
  counters: {},
};

/* =====================
   Main Component
===================== */

export default function HomePage() {
  const data: IData = azkarsData;
  const categories = useMemo(() => data.categories, [data]);

  // Local state variables
  const [hasMounted, setHasMounted] = useState(false);
  const [db, setDb] = useState<IThikrDB>(INITIAL_DB);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clearHistoryClicked, setClearHistoryClicked] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>({
    currentlyPlayingId: null,
    availableAudios: new Set<string>(),
  });
  const isMounted = useRef(false);

  // Keep track of the current drawer state in a ref
  const drawerOpenRef = useRef(drawerOpen);

  const handleAudioStateChange = useCallback((azkarId: string | null) => {
    setAudioState((prev) => ({
      ...prev,
      currentlyPlayingId: azkarId,
    }));
  }, []);

  useEffect(() => {
    drawerOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  /* =====================
     Side Effects
  ====================== */

  // Update the selected category based on the current time (morning vs evening)
  useEffect(() => {
    const updateCategoryBasedOnTime = () => {
      const currentHour = new Date().getHours();
      const newCategory =
        currentHour >= 4 && currentHour < 16 ? "morning" : "evening";
      setDb((prevDb) =>
        prevDb.selectedCategory !== newCategory
          ? { ...prevDb, selectedCategory: newCategory }
          : prevDb
      );
    };

    updateCategoryBasedOnTime();
    const intervalId = setInterval(updateCategoryBasedOnTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== "undefined") {
      const storedDB = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDB) {
        const parsedDB = JSON.parse(storedDB) as IThikrDB;
        setDb(parsedDB);
      }
    }
  }, []);

  // Persist db changes to localStorage (only after mount)
  useEffect(() => {
    if (hasMounted && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
    }
  }, [db, hasMounted]);

  /* =====================
     Event Handlers
  ====================== */

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

  /* =====================
     Derived / Computed Values
  ====================== */

  const { language, selectedCategory, theme, counters } = db;

  // Auto-detect theme based on time if "auto" is selected
  const computedTheme = useMemo(() => {
    if (theme === "auto") {
      const hour = new Date().getHours();
      return hour >= 6 && hour < 18 ? "light" : "dark";
    }
    return theme;
  }, [theme]);

  // Update the root element class for theming
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light-theme", "dark-theme", "sepia-theme");
    root.classList.add(`${computedTheme}-theme`);
  }, [computedTheme]);

  // Find the selected category data from the categories list
  const selectedCategoryData = useMemo(() => {
    return categories.find((cat) => cat.id === selectedCategory);
  }, [categories, selectedCategory]);

  // Group raw azkars data into entries by azkar_id with sorted lines
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
            français: "",
            español: "",
          },
          timestamp: raw.timestamp ? Number(raw.timestamp) : undefined,
        });
      }
    });

    // Ensure each entry's lines are in order
    for (const entry of groups.values()) {
      entry.lines.sort((a, b) => a.lineNumber - b.lineNumber);
    }
    return Array.from(groups.values());
  }, [selectedCategoryData]);

  // Check which audio files are available
  useEffect(() => {
    isMounted.current = true;

    const checkAudioAvailability = async (azkarId: string) => {
      try {
        const response = await fetch(`/audio/${azkarId}.mp3`, {
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

    // Check audio availability for all azkars
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

  // Do not render until we are mounted and have valid category data
  if (!hasMounted || !selectedCategoryData) return null;

  /* =====================
     Render JSX
  ====================== */

  return (
    <>
      <div className="container mx-auto px-4 py-6 transition-colors">
        {/* Page Header */}
        <header className="mb-8 text-center py-4">
          <h1 className="text-4xl font-extrabold text-[var(--card-text)]">
            {selectedCategoryData.translations[language] ||
              selectedCategoryData.id}
          </h1>
        </header>

        {/* Azkar Cards */}
        <section className="grid grid-cols-1 gap-4 mt-6">
          {groupedAzkars.map((azkar) => {
            const virtue = selectedCategoryData.virtues.find(
              (v) => v.azkar_id === azkar.id
            );
            const hasAudio = audioState.availableAudios.has(azkar.id);
            const isPlaying = audioState.currentlyPlayingId === azkar.id;
            return (
              <AzkarCard
                key={azkar.id}
                azkar={azkar}
                language={language}
                uiTranslations={data.uiTranslations}
                counter={counters[azkar.id] || 0}
                updateCounter={updateCounter}
                virtue={virtue}
                audioSrc={hasAudio ? `/audio/${azkar.id}.mp3` : undefined}
                isCurrentlyPlaying={isPlaying}
                onAudioStateChange={(playing) =>
                  handleAudioStateChange(playing ? azkar.id : null)
                }
              />
            );
          })}
        </section>
      </div>

      {/* Settings Drawer */}
      <Drawer onOpenChange={(open) => setDrawerOpen(open)}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="fixed bottom-4 right-4 p-2 z-50 bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--card-text)]"
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
            {/* Language Selector */}
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

            {/* Theme Selector */}
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

            {/* Category Selector */}
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

            {/* Clear History Button */}
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
          </div>

          {/* Hidden close button for accessibility */}
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
