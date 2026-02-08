import { create } from "zustand";

interface AudioState {
  currentlyPlayingId: string | null;
  lastPlayedId: string | null;
  currentLineIndex: number;
  isPlaying: boolean;
  playbackRate: number;
  isRepeat: boolean;
}

interface AudioActions {
  setPlaying: (id: string | null, isPlaying: boolean) => void;
  setLineIndex: (index: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleRepeat: () => void;
  cycleSpeed: () => void;
  reset: () => void;
}

export const useAudioStore = create<AudioState & AudioActions>((set, get) => ({
  currentlyPlayingId: null,
  lastPlayedId: null,
  currentLineIndex: -1,
  isPlaying: false,
  playbackRate: 1,
  isRepeat: false,

  setPlaying: (id, isPlaying) =>
    set({
      currentlyPlayingId: isPlaying ? id : null,
      lastPlayedId: id ?? get().lastPlayedId,
      isPlaying,
      currentLineIndex: isPlaying && id !== get().lastPlayedId ? 0 : get().currentLineIndex,
    }),

  setLineIndex: (index) => set({ currentLineIndex: index }),

  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),

  cycleSpeed: () =>
    set((s) => ({
      playbackRate: s.playbackRate === 1 ? 1.5 : s.playbackRate === 1.5 ? 2 : 1,
    })),

  reset: () =>
    set({
      currentlyPlayingId: null,
      lastPlayedId: null,
      currentLineIndex: -1,
      isPlaying: false,
    }),
}));
