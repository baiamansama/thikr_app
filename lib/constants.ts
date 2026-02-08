export const CATEGORIES = [
  "morning",
  "evening",
  "duas",
  "surahs",
] as const;

export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ar", label: "Arabic", nativeLabel: "عربي" },
  { code: "ky", label: "Kyrgyz", nativeLabel: "кыргыз" },
  { code: "ru", label: "Russian", nativeLabel: "русский" },
] as const;

export const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export const COURSE_CATEGORIES = [
  { value: "azkar", label: "Azkar & Dhikr" },
  { value: "duas", label: "Duas & Supplications" },
  { value: "quran", label: "Quran" },
  { value: "seerah", label: "Seerah" },
  { value: "fiqh", label: "Fiqh" },
  { value: "aqeedah", label: "Aqeedah" },
  { value: "other", label: "Other" },
] as const;
