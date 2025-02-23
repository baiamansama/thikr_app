"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import azkarsData from "./azkars.json";
import surah_namesData from "./surah_names.json";
import periodsData from "./periods.json";
import AzkarCard from "./../components/AzkarCard";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  lastPlayedId: string | null;
  availableAudios: Set<string>;
  currentLineIndex: number;
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
  transcription_cyrillic?: string;
  transcription_latin?: string;
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
    transcription_cyrillic?: string;
    transcription_latin?: string;
  }[];
  virtues: IVirtues[];
}

interface IPeriod {
  text_id: string;
  русский: string;
  english: string;
  кыргыз: string;
  arabic: string;
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
  const surahs = surah_namesData;
  const periods: IPeriod[] = periodsData;
  const categories = useMemo(() => data.categories, [data]);

  const [hasMounted, setHasMounted] = useState(false);
  const [db, setDb] = useState<IThikrDB>(INITIAL_DB);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clearHistoryClicked, setClearHistoryClicked] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>({
    currentlyPlayingId: null,
    lastPlayedId: null,
    availableAudios: new Set<string>(),
    currentLineIndex: -1,
  });
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const isMounted = useRef(false);
  const drawerOpenRef = useRef(drawerOpen);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioAzkarIdRef = useRef<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRepeat, setIsRepeat] = useState(false);
  const [skipFeedback, setSkipFeedback] = useState<
    "forward" | "backward" | null
  >(null);
  const timeUpdateListener = useRef<(() => void) | null>(null);
  const endedListener = useRef<(() => void) | null>(null);

  const handleSpeedChange = useCallback(() => {
    const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  }, [playbackRate]);

  const handleRepeatToggle = useCallback(() => {
    setIsRepeat((prev) => {
      const newRepeat = !prev;
      if (audioRef.current) audioRef.current.loop = newRepeat;
      return newRepeat;
    });
  }, []);

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
      } else {
        setDrawerOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    drawerOpenRef.current = drawerOpen;
  }, [drawerOpen]);

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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (timeUpdateListener.current) {
          audioRef.current.removeEventListener(
            "timeupdate",
            timeUpdateListener.current
          );
        }
        if (endedListener.current) {
          audioRef.current.removeEventListener("ended", endedListener.current);
        }
        audioRef.current = null;
      }
    };
  }, []);

  const handleLanguageClick = useCallback((lang: string) => {
    setDb((prev) => ({ ...prev, language: lang }));
  }, []);

  const handleThemeClick = useCallback((newTheme: string) => {
    setDb((prev) => ({ ...prev, theme: newTheme }));
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setDb((prev) => ({ ...prev, selectedCategory: categoryId }));
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioState((prev) => ({
        ...prev,
        currentlyPlayingId: null,
        currentLineIndex: -1,
      }));
      setIsAudioPlaying(false);
    }
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
        groups.set(id, {
          id,
          count: selectedCategory === "duas" ? 1 : Number(raw.count) || 1,
          lines: [],
        });
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
          transcription_cyrillic: raw.transcription_cyrillic || "",
          transcription_latin: raw.transcription_latin || "",
        });
      }
    });

    for (const entry of groups.values()) {
      entry.lines.sort((a, b) => a.lineNumber - b.lineNumber);
    }

    return Array.from(groups.values());
  }, [selectedCategoryData, selectedCategory]);

  const handleAudioControl = useCallback(
    (control: { azkarId: string; isPlaying: boolean; audioSrc?: string }) => {
      if (!control.audioSrc) return;

      let preservedTime = 0;
      const preservedLineIndex = audioState.currentLineIndex;

      if (audioRef.current) {
        preservedTime = audioRef.current.currentTime;
        if (timeUpdateListener.current) {
          audioRef.current.removeEventListener(
            "timeupdate",
            timeUpdateListener.current
          );
        }
        if (endedListener.current) {
          audioRef.current.removeEventListener("ended", endedListener.current);
        }
      }

      const isNewAudio =
        !audioRef.current || audioAzkarIdRef.current !== control.azkarId;

      const timeUpdateHandler = () => {
        if (!audioRef.current) return;
        const currentTime = audioRef.current.currentTime;
        const azkar = groupedAzkars.find((a) => a.id === control.azkarId);
        if (azkar?.lines) {
          let lineIndex = azkar.lines.findIndex((line, idx) => {
            const nextLine = azkar.lines[idx + 1];
            const lineEnd = nextLine?.timestamp ?? Infinity;
            return (
              currentTime >= (line.timestamp || 0) && currentTime < lineEnd
            );
          });
          lineIndex = lineIndex === -1 ? 0 : lineIndex;
          setAudioState((prev) => ({
            ...prev,
            currentLineIndex: lineIndex,
          }));
        }
      };

      if (isNewAudio) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(control.audioSrc);
        audioAzkarIdRef.current = control.azkarId;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.loop = isRepeat;

        const endedHandler = () => {
          if (!isRepeat) {
            setAudioState((prev) => ({
              ...prev,
              currentlyPlayingId: null,
            }));
            setIsAudioPlaying(false);
          }
        };

        timeUpdateListener.current = timeUpdateHandler;
        endedListener.current = endedHandler;

        audioRef.current.addEventListener("timeupdate", timeUpdateHandler);
        audioRef.current.addEventListener("ended", endedHandler);
      } else {
        if (audioRef.current && timeUpdateListener.current) {
          audioRef.current.addEventListener(
            "timeupdate",
            timeUpdateListener.current
          );
        }
      }

      setAudioState((prev) => ({
        ...prev,
        currentlyPlayingId: control.isPlaying ? control.azkarId : null,
        lastPlayedId: control.azkarId,
        currentLineIndex:
          isNewAudio && control.isPlaying ? 0 : preservedLineIndex,
      }));
      setIsAudioPlaying(control.isPlaying);

      if (control.isPlaying) {
        if (!isNewAudio && preservedTime > 0 && audioRef.current) {
          audioRef.current.currentTime = preservedTime;
        }
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((err) => console.error("Audio play error:", err));
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          timeUpdateHandler();
        }
      }
    },
    [groupedAzkars, playbackRate, isRepeat, audioState.currentLineIndex]
  );

  const handleSkip = useCallback(
    (direction: "forward" | "backward") => {
      if (!audioRef.current || !groupedAzkars.length) return;
      const azkar = groupedAzkars.find(
        (a) => a.id === audioState.currentlyPlayingId
      );
      if (!azkar) return;
      const timestamps = azkar.lines
        .map((line) => line.timestamp)
        .filter((ts): ts is number => ts !== undefined)
        .sort((a, b) => a - b);
      const current = audioRef.current.currentTime;
      let newTime: number | undefined;
      if (direction === "backward") {
        newTime =
          [...timestamps].reverse().find((ts) => ts < current - 0.5) || 0;
      } else {
        newTime =
          timestamps.find((ts) => ts > current + 0.5) ||
          timestamps[timestamps.length - 1];
      }
      if (newTime !== undefined) {
        audioRef.current.currentTime = newTime;
        setSkipFeedback(direction);
        setTimeout(() => setSkipFeedback(null), 1000);
      }
    },
    [audioState.currentlyPlayingId, groupedAzkars]
  );

  useEffect(() => {
    isMounted.current = true;

    const checkAudioAvailability = async (azkarId: string) => {
      try {
        const fileExtension = selectedCategory === "surahs" ? "mp3" : "m4a";
        const response = await fetch(`/audio/${azkarId}.${fileExtension}`, {
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
  }, [groupedAzkars, selectedCategory]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioState((prev) => ({
      ...prev,
      currentlyPlayingId: null,
      currentLineIndex: -1,
    }));
    setIsAudioPlaying(false);
  }, [selectedCategory]);

  if (!hasMounted || !selectedCategoryData) return null;

  return (
    <>
      <div className="container mx-auto px-0 py-6 transition-colors">
        <div style={{ paddingBottom: "120px" }}>
          <header className="mb-8 text-center py-4 relative">
            <h1 className="text-4xl font-extrabold text-[var(--card-text)]">
              {selectedCategoryData.translations[language] ||
                selectedCategoryData.id}
            </h1>
            {(selectedCategory === "morning" ||
              selectedCategory === "evening") && (
              <Button
                variant="outline"
                onClick={() => {
                  const newCounters = { ...db.counters };
                  groupedAzkars.forEach((azkar) => {
                    newCounters[azkar.id] = 0;
                  });
                  setDb((prev) => ({
                    ...prev,
                    counters: newCounters,
                  }));
                  setClearHistoryClicked(true);
                  setTimeout(() => setClearHistoryClicked(false), 200);
                }}
                className={`mt-5 transition-colors px-3 py-1 rounded border ${
                  clearHistoryClicked
                    ? "bg-[#606c38] text-white border-[#606c38] hover:bg-[#606c38]/90"
                    : "bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
                }`}
              >
                {data.uiTranslations.actions.clean_history[language] ||
                  "🗑️ Clear History"}
              </Button>
            )}
          </header>
          <section className="grid grid-cols-1 gap-6 mt-6">
            {groupedAzkars.map((azkar, index) => {
              const virtue = selectedCategoryData.virtues.find(
                (v) => v.azkar_id === azkar.id
              );
              const hasAudio = audioState.availableAudios.has(azkar.id);
              const isFavorite = (favorites[selectedCategory] || new Set()).has(
                azkar.id
              );
              const audioSrc = hasAudio
                ? `/audio/${azkar.id}.${
                    selectedCategory === "surahs" ? "mp3" : "m4a"
                  }`
                : undefined;

              const surah_names =
                selectedCategory === "surahs"
                  ? surahs.find((s) => s.surah_id === azkar.id)
                  : null;
              const period_info =
                selectedCategory === "duas" && periods[index]
                  ? periods[index]
                  : null;

              return (
                <div
                  key={azkar.id}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  className="relative z-10 w-full mx-0"
                >
                  {surah_names && selectedCategory === "surahs" && (
                    <h2
                      className="text-2xl font-semibold text-[var(--card-text)] mb-2 px-4 border-b-2 border-[var(--card-border)] pb-2"
                      style={{
                        fontFamily:
                          language === "عربي"
                            ? "'Scheherazade', serif"
                            : "inherit",
                        direction: language === "عربي" ? "rtl" : "ltr",
                        textAlign: language === "عربي" ? "right" : "left",
                      }}
                    >
                      {surah_names[language as keyof typeof surah_names] ||
                        surah_names.arabic}
                    </h2>
                  )}
                  {period_info && selectedCategory === "duas" && (
                    <h2
                      className="text-xl font-medium text-[var(--card-text)] mb-2 px-4 border-b-2 border-[var(--card-border)] pb-2 bg-[var(--card-bg)]/80 rounded-t-md"
                      style={{
                        fontFamily:
                          language === "عربي"
                            ? "'Scheherazade', serif"
                            : "inherit",
                        direction: language === "عربي" ? "rtl" : "ltr",
                        textAlign: language === "عربي" ? "right" : "left",
                      }}
                    >
                      {period_info[language as keyof typeof period_info] ||
                        period_info.arabic}
                    </h2>
                  )}
                  <AzkarCard
                    azkar={azkar}
                    language={language}
                    uiTranslations={data.uiTranslations}
                    counter={
                      selectedCategory === "duas" ? 0 : counters[azkar.id] || 0
                    }
                    updateCounter={updateCounter}
                    virtue={virtue}
                    audioSrc={audioSrc}
                    isCurrentlyPlaying={
                      audioState.currentlyPlayingId === azkar.id
                    }
                    currentLineIndex={
                      audioState.lastPlayedId === azkar.id
                        ? audioState.currentLineIndex
                        : -1
                    }
                    onAudioControl={handleAudioControl}
                    playbackRate={playbackRate}
                    isRepeat={isRepeat}
                    onSpeedChange={handleSpeedChange}
                    onRepeatToggle={handleRepeatToggle}
                    onSkip={handleSkip}
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

      <div className="fixed bottom-14 left-0 right-0 flex justify-end px-4 gap-2 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`p-2 bg-transparent border-[var(--card-border)] text-[var(--card-text)] relative overflow-hidden ${
                isAudioPlaying && audioState.currentlyPlayingId
                  ? "animate-pulse bg-[#606c38]/50 shadow-lg shadow-[#606c38]/30"
                  : ""
              }`}
              disabled={!audioState.lastPlayedId}
            >
              <span className="material-icons-round text-2xl">radio</span>
            </Button>
          </PopoverTrigger>
          {audioState.lastPlayedId && (
            <PopoverContent
              className="w-64 bg-[var(--card-bg)]/80 backdrop-blur-md border-[var(--card-border)]/50 text-[var(--card-text)] rounded-xl shadow-lg p-3"
              align="end"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    className={`p-1 rounded-full transition-colors relative ${
                      skipFeedback === "backward"
                        ? "bg-[#606c38] text-white hover:bg-[#606c38]/90 active:bg-[#606c38]/90 focus:bg-[#606c38]/90"
                        : "bg-transparent text-[var(--card-text)] hover:bg-[var(--card-bg)]/70 active:bg-[var(--card-bg)]/70 focus:bg-[var(--card-bg)]/70"
                    }`}
                    onClick={() => handleSkip("backward")}
                  >
                    <span className="material-icons-round text-lg text-[var(--card-text)]">
                      skip_previous
                    </span>
                  </Button>

                  <Button
                    size="sm"
                    className={`p-2 rounded-full transition-colors ${
                      isAudioPlaying
                        ? "bg-[#606c38] text-white hover:bg-[#606c38]/90 active:bg-[#606c38]/90 focus:bg-[#606c38]/90"
                        : "bg-transparent text-[var(--card-text)] hover:bg-[var(--card-bg)]/70 active:bg-[var(--card-bg)]/70 focus:bg-[var(--card-bg)]/70"
                    }`}
                    onClick={() =>
                      handleAudioControl({
                        azkarId: audioState.lastPlayedId!,
                        isPlaying: !isAudioPlaying,
                        audioSrc: `/audio/${audioState.lastPlayedId}.${
                          selectedCategory === "surahs" ? "mp3" : "m4a"
                        }`,
                      })
                    }
                  >
                    <span className="material-icons-round text-xl text-[var(--card-text)]">
                      {isAudioPlaying ? "pause" : "play_arrow"}
                    </span>
                  </Button>

                  <Button
                    size="sm"
                    className={`p-1 rounded-full transition-colors relative ${
                      skipFeedback === "forward"
                        ? "bg-[#606c38] text-white hover:bg-[#606c38]/90 active:bg-[#606c38]/90 focus:bg-[#606c38]/90"
                        : "bg-transparent text-[var(--card-text)] hover:bg-[var(---card-bg)]/70 active:bg-[var(--card-bg)]/70 focus:bg-[var(--card-bg)]/70"
                    }`}
                    onClick={() => handleSkip("forward")}
                  >
                    <span className="material-icons-round text-lg text-[var(--card-text)]">
                      skip_next
                    </span>
                  </Button>
                </div>

                <div className="flex justify-between text-xs">
                  <Button
                    size="sm"
                    className={`p-1 rounded-full transition-colors text-[var(--card-text)] ${
                      playbackRate !== 1
                        ? "bg-[#606c38] text-white hover:bg-[#606c38]/90 active:bg-[#606c38]/90 focus:bg-[#606c38]/90"
                        : "bg-transparent hover:bg-[var(--card-bg)]/70 active:bg-[var(--card-bg)]/70 focus:bg-[var(--card-bg)]/70"
                    }`}
                    onClick={handleSpeedChange}
                  >
                    {playbackRate}x
                  </Button>
                  <Button
                    size="sm"
                    className={`p-1 rounded-full transition-colors text-[var(--card-text)] ${
                      isRepeat
                        ? "bg-[#606c38] text-white hover:bg-[#606c38]/90 active:bg-[#606c38]/90 focus:bg-[#606c38]/90"
                        : "bg-transparent hover:bg-[var(--card-bg)]/70 active:bg-[var(--card-bg)]/70 focus:bg-[var(--card-bg)]/70"
                    }`}
                    onClick={handleRepeatToggle}
                  >
                    <span className="material-icons-round text-lg text-[var(--card-text)]">
                      repeat
                    </span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="p-2 bg-transparent border-[var(--card-border)] text-[var(--card-text)]"
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
                <DrawerDescription className="sr-only">
                  Settings options for language, theme, and categories
                </DrawerDescription>
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
            </div>

            <DrawerClose asChild>
              <VisuallyHidden>
                <Button autoFocus />
              </VisuallyHidden>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 p-2 shadow-inner z-20 ${
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
            const progress =
              selectedCategory === "duas"
                ? 0
                : Math.min(currentCount / azkar.count, 1);
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
                      ? "material-icons-round text-[var(--card-text)] text-xl"
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
    </>
  );
}
