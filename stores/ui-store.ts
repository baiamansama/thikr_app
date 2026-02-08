import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  language: string;
  theme: "auto" | "light" | "dark";
}

interface UIActions {
  setLanguage: (language: string) => void;
  setTheme: (theme: "auto" | "light" | "dark") => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      language: "en",
      theme: "auto",
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "thikr-ui",
    }
  )
);
