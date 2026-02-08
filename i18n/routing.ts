import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ky"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

