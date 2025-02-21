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
    lastPlayedId: null,
    availableAudios: new Set<string>(),
    currentLineIndex: -1,
  });
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const isMounted = useRef(false);
  const drawerOpenRef = useRef(drawerOpen);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRepeat, setIsRepeat] = useState(false);

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

    return Array.from(groups.values());
  }, [selectedCategoryData]);

  const handleAudioControl = useCallback(
    (control: { azkarId: string; isPlaying: boolean; audioSrc?: string }) => {
      if (!control.audioSrc) return;

      let preservedTime = 0;
      if (audioRef.current) {
        preservedTime = audioRef.current.currentTime;
      }

      const isNewAudio = audioState.currentlyPlayingId !== control.azkarId;

      if (!audioRef.current || audioRef.current.src !== control.audioSrc) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(control.audioSrc);
        audioRef.current.playbackRate = playbackRate;
        // Reset repeat when switching to a new audio
        audioRef.current.loop = isNewAudio ? false : isRepeat;
        if (isNewAudio) setIsRepeat(false);

        audioRef.current.addEventListener("timeupdate", () => {
          const currentTime = audioRef.current!.currentTime;
          const azkar = groupedAzkars.find((a) => a.id === control.azkarId);
          if (azkar && azkar.lines.length > 0) {
            let lineIndex = 0;
            if (
              azkar.lines[0].timestamp === undefined ||
              currentTime < azkar.lines[0].timestamp
            ) {
              lineIndex = 0;
            } else {
              lineIndex = azkar.lines.findIndex(
                (line, idx) =>
                  line.timestamp !== undefined &&
                  currentTime >= line.timestamp &&
                  (idx === azkar.lines.length - 1 ||
                    (azkar.lines[idx + 1].timestamp !== undefined &&
                      currentTime <
                        (azkar.lines[idx + 1]?.timestamp ?? Infinity)))
              );
            }
            setAudioState((prev) => ({
              ...prev,
              currentLineIndex: lineIndex >= 0 ? lineIndex : 0,
            }));
          }
        });

        audioRef.current.addEventListener("ended", () => {
          if (!isRepeat) {
            setAudioState((prev) => ({
              ...prev,
              currentlyPlayingId: null,
              currentLineIndex: prev.currentLineIndex,
            }));
            setIsAudioPlaying(false);
          }
        });
      }

      setAudioState((prev) => {
        return {
          ...prev,
          currentlyPlayingId: control.isPlaying ? control.azkarId : null,
          lastPlayedId: control.azkarId,
          currentLineIndex:
            isNewAudio && control.isPlaying ? 0 : prev.currentLineIndex,
        };
      });

      setIsAudioPlaying(control.isPlaying);

      if (control.isPlaying) {
        if (audioRef.current.src === control.audioSrc && preservedTime > 0) {
          audioRef.current.currentTime = preservedTime;
        }
        audioRef.current
          .play()
          .catch((err) => console.error("Audio play error:", err));
      } else {
        audioRef.current.pause();
      }
    },
    [groupedAzkars, playbackRate, isRepeat]
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioState((prev) => ({
      ...prev,
      currentlyPlayingId: null,
    }));
    setIsAudioPlaying(false);
  }, [selectedCategory]);

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
      if (newTime !== undefined) audioRef.current.currentTime = newTime;
    },
    [audioState.currentlyPlayingId, groupedAzkars]
  );

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
      <div className="container mx-auto px-4 py-6 transition-colors">
        <div style={{ paddingBottom: "120px" }}>
          <header className="mb-8 text-center py-4 relative">
            <h1 className="text-4xl font-extrabold text-[var(--card-text)]">
              {selectedCategoryData.translations[language] ||
                selectedCategoryData.id}
            </h1>
            <div className="fixed top-4 right-4 flex gap-2 z-50">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`p-2 bg-transparent border-[var(--card-border)] text-[var(--card-text)] relative overflow-hidden ${
                      isAudioPlaying && audioState.currentlyPlayingId
                        ? "animate-pulse"
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
                          variant="ghost"
                          size="sm"
                          className={`p-1 rounded-full transition-colors ${
                            audioState.currentlyPlayingId
                              ? "bg-[#606c38] text-white hover:bg-[#606c38]/90"
                              : "bg-[var(--card-bg)]/50 text-[var(--card-text)] hover:bg-[var(--card-bg)]/70"
                          }`}
                          onClick={() => handleSkip("backward")}
                        >
                          <span className="material-icons-round text-lg">
                            skip_previous
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-2 rounded-full transition-colors ${
                            isAudioPlaying
                              ? "bg-[#606c38] text-white hover:bg-[#606c38]/90"
                              : "bg-[var(--card-bg)]/50 text-[var(--card-text)] hover:bg-[var(--card-bg)]/70"
                          }`}
                          onClick={() =>
                            handleAudioControl({
                              azkarId: audioState.lastPlayedId!,
                              isPlaying: !isAudioPlaying,
                              audioSrc: `/audio/${audioState.lastPlayedId}.m4a`,
                            })
                          }
                        >
                          <span className="material-icons-round text-xl">
                            {isAudioPlaying ? "pause" : "play_arrow"}
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-1 rounded-full transition-colors ${
                            audioState.currentlyPlayingId
                              ? "bg-[#606c38] text-white hover:bg-[#606c38]/90"
                              : "bg-[var(--card-bg)]/50 text-[var(--card-text)] hover:bg-[var(--card-bg)]/70"
                          }`}
                          onClick={() => handleSkip("forward")}
                        >
                          <span className="material-icons-round text-lg">
                            skip_next
                          </span>
                        </Button>
                      </div>

                      <div className="flex justify-between text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-1 rounded-full transition-colors ${
                            playbackRate !== 1
                              ? "bg-[#606c38] text-white hover:bg-[#606c38]/90"
                              : "bg-[var(--card-bg)]/50 text-[var(--card-text)] hover:bg-[var(--card-bg)]/70"
                          }`}
                          onClick={handleSpeedChange}
                        >
                          {playbackRate}x
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-1 rounded-full transition-colors ${
                            isRepeat
                              ? "bg-[#606c38] text-white hover:bg-[#606c38]/90"
                              : "bg-[var(--card-bg)]/50 text-[var(--card-text)] hover:bg-[var(--card-bg)]/70"
                          }`}
                          onClick={handleRepeatToggle}
                        >
                          <span className="material-icons-round text-lg">
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
                    <span className="material-icons-round text-2xl">
                      settings
                    </span>
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
                            <span>
                              {item.translations[language] || item.id}
                            </span>
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
                            setDb((prev) => ({
                              ...prev,
                              counters: newCounters,
                            }));
                            setClearHistoryClicked(true);
                            setTimeout(
                              () => setClearHistoryClicked(false),
                              200
                            );
                          }}
                          className={`transition-colors px-3 py-1 rounded border ${
                            clearHistoryClicked
                              ? "bg-[#606c38] text-white border-[#606c38] hover:bg-[#606c38]/90"
                              : "bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80"
                          }`}
                        >
                          {data.uiTranslations.actions.clean_history[
                            language
                          ] || "🗑️ Clear History"}
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
            </div>
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
                    isCurrentlyPlaying={
                      audioState.currentlyPlayingId! === azkar.id
                    }
                    currentLineIndex={
                      audioState.currentlyPlayingId === azkar.id
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
