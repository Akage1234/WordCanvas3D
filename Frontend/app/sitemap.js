import { ARTICLES } from "@/components/learn/registry";
import { routing } from "@/i18n/routing";
import { SITE_URL, localePath } from "@/lib/site";

export default function sitemap() {
  const pages = [
    ["/", 1, "weekly"],
    ["/learn", 0.9, "weekly"],
    ["/tokenizer", 0.8, "monthly"],
    ["/embedding", 0.8, "monthly"],
    ["/vector-playground", 0.8, "monthly"],
    ...ARTICLES.map((a) => [`/learn/${a.slug}`, a.track === "start" ? 0.8 : a.track === "foundations" ? 0.7 : 0.6, "monthly"]),
  ];
  const abs = (path, locale) => `${SITE_URL}${localePath(path, locale)}`.replace(/\/$/, "");
  return pages.flatMap(([path, priority, changeFrequency]) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, abs(path, l)]));
    return routing.locales.map((locale) => ({
      url: abs(path, locale),
      changeFrequency,
      // Translated pages rank a little below the English originals.
      priority: locale === routing.defaultLocale ? priority : Math.round(priority * 0.8 * 10) / 10,
      alternates: { languages },
    }));
  });
}
