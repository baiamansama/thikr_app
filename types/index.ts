export interface Translation {
  [language: string]: string;
}

export interface LocalizedText {
  en?: string;
  ar?: string;
  ky?: string;
  ru?: string;
}

// Legacy types from old monolith (used by azkar display)
export interface IAzkarLine {
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

export interface IUIActions {
  clean_history: Translation;
  tap: Translation;
  completed: Translation;
}

export interface IUITranslations {
  actions: IUIActions;
  virtues: Translation;
  settings: Translation;
}

export interface IVirtues {
  azkar_id: string;
  arabic: string;
  english: string;
  кыргыз: string;
  русский: string;
}

export interface ICategory {
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

export interface IPeriod {
  text_id: string;
  русский: string;
  english: string;
  кыргыз: string;
  arabic: string;
}

export interface CourseWithDetails {
  id: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  category: string | null;
  language: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  estimatedDuration: number | null;
  createdAt: Date;
  teacher: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  lessons: { id: string }[];
  likes: { id: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "student" | "teacher" | "admin";
  isTeacherApproved: boolean | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
}
