import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ARTICLES } from "@/components/learn/registry";
import { ogArticle, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Learn article";

// Image routes don't inherit the layout's locale params, so list every locale × slug here.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => ARTICLES.map((a) => ({ locale, slug: a.slug })));
}

export default async function Image({ params }) {
  const { locale, slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  const t = await getTranslations({ locale, namespace: "Learn" });
  return ogArticle(a, t(`tracks.${a.track}.title`));
}
