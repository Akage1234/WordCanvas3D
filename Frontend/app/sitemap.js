import { ARTICLES } from "@/components/learn/registry";
import { SITE_URL } from "@/lib/site";

export default function sitemap() {
  const pages = [
    ["", 1, "weekly"],
    ["/learn", 0.9, "weekly"],
    ["/tokenizer", 0.8, "monthly"],
    ["/embedding", 0.8, "monthly"],
    ["/vector-playground", 0.8, "monthly"],
  ].map(([path, priority, changeFrequency]) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority }));
  const articles = ARTICLES.map((a) => ({
    url: `${SITE_URL}/learn/${a.slug}`,
    changeFrequency: "monthly",
    priority: a.track === "start" ? 0.8 : a.track === "foundations" ? 0.7 : 0.6,
  }));
  return [...pages, ...articles];
}
