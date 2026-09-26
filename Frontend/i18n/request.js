import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const en = (await import("../messages/en.json")).default;
  if (locale === routing.defaultLocale) return { locale, messages: en };
  // Any key a translation doesn't have yet shows the English text instead of breaking the page.
  const own = await import(`../messages/${locale}.json`).then((m) => m.default, () => ({}));
  return { locale, messages: merge(en, own) };
});

function merge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" ? merge(base[k], v) : v;
  }
  return out;
}
