import { defineRouting } from "next-intl/routing";

// English URLs stay unprefixed; the others live under /zh, /ja, /es. A locale whose messages/<locale>.json
// is missing (or incomplete) falls back to English strings, see request.js.
export const routing = defineRouting({
  locales: ["en", "zh", "ja", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
