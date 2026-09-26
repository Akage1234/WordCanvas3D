import { defineRouting } from "next-intl/routing";

// Add a locale here (e.g. "zh") once its messages/<locale>.json exists. English URLs stay unprefixed.
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
