import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getArticles } from "@/components/learn/registry";
import { ARTICLES, articlesFor } from "@/components/learn/catalog";
import { Faq, FurtherReading } from "@/components/learn/kit";
import ArticleToc from "@/components/learn/ArticleToc";
import ShareButton from "@/components/learn/ShareButton";
import s from "@/components/landing/landing.module.css";
import l from "@/components/learn/learn.module.css";
import { AUTHOR, SITE_NAME, SITE_URL, jsonLd, localeAlternates, localePath } from "@/lib/site";

export const dynamicParams = false;

// Runs per locale: the [locale] layout supplies the locale params.
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const a = articlesFor(locale).find((x) => x.slug === slug);
  if (!a) return {};
  const path = `/learn/${a.slug}`;
  const url = localePath(path, locale);
  return {
    title: a.title,
    description: a.summary,
    alternates: localeAlternates(path, locale),
    openGraph: { type: "article", title: a.title, description: a.summary, url, authors: [AUTHOR.url], section: a.tag },
    twitter: { title: a.title, description: a.summary },
  };
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function Article({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Learn");
  const articles = getArticles(locale);
  const i = articles.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const a = articles[i];
  const prev = articles[i - 1];
  const next = articles[i + 1];

  const url = `${SITE_URL}${localePath(`/learn/${a.slug}`, locale)}`;
  const trackTitle = t(`tracks.${a.track}.title`);
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: a.title,
      description: a.summary,
      url,
      image: `${SITE_URL}/${locale}/learn/${a.slug}/opengraph-image`, // the path Next generates for og:image
      inLanguage: a.translated ? locale : "en", // untranslated bodies fall back to English
      timeRequired: `PT${a.minutes}M`,
      articleSection: a.tag,
      isAccessibleForFree: true,
      author: { "@type": "Person", ...AUTHOR },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("title"), item: `${SITE_URL}${localePath("/learn", locale)}` },
        { "@type": "ListItem", position: 2, name: trackTitle, item: `${SITE_URL}${localePath("/learn", locale)}#track-${a.track}` },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
    a.faq.length > 0 && {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faq.map(({ q, a: answer }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
  ].filter(Boolean);

  return (
    <main className={`${s.page} ${l.main}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <div className={l.articleWrap}>
        <ArticleToc label={t("onThisPage")} target={`.${l.body}`} />
        <article className={l.article}>
          <Link href="/learn" className={l.back}>{t("back", { track: trackTitle })}</Link>
          <div className={l.meta}>
            <span className={s.tag} style={{ "--tc": a.color }}>{t(`tags.${a.tag}`)}</span>
            <span>{t("minRead", { count: a.minutes })}</span>
            <ShareButton title={a.title} label={t("share")} copied={t("linkCopied")} />
          </div>
          <h1 className={l.h1}>{a.title}</h1>
          <p className={l.lede}>{a.summary}</p>
          {!a.translated && <p className={l.langNote} lang={locale}>{t("englishOnly")}</p>}
          <div className={l.body}>
            <a.Body />
            <Faq title={t("faqTitle")} items={a.faq} />
            <FurtherReading title={t("furtherReading")} links={a.reading} />
          </div>

          {a.cta && <aside className={l.cta}>
            <span className={s.kicker}>{t("tryIt")}</span>
            <h2>{a.cta.label}</h2>
            <p>{a.cta.text}</p>
            <Link className={`${s.cta} ${s.ctaExplore}`} href={a.cta.href}>{a.cta.label} <Arrow /></Link>
          </aside>}

          <nav className={l.pager} aria-label={t("pagerLabel")}>
            {prev && (
              <Link href={`/learn/${prev.slug}`}>
                <small>{t("previous")}</small>
                <strong>{prev.title}</strong>
              </Link>
            )}
            {next && (
              <Link href={`/learn/${next.slug}`} className={l.next}>
                <small>{t("next")}</small>
                <strong>{next.title}</strong>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </main>
  );
}
