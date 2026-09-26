import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, TRACKS } from "@/components/learn/registry";
import s from "@/components/landing/landing.module.css";
import l from "@/components/learn/learn.module.css";
import { AUTHOR, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  const url = `/learn/${a.slug}`;
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: url },
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
  const { slug } = await params;
  const i = ARTICLES.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const a = ARTICLES[i];
  const prev = ARTICLES[i - 1];
  const next = ARTICLES[i + 1];

  const url = `${SITE_URL}/learn/${a.slug}`;
  const trackTitle = TRACKS.find((t) => t.id === a.track)?.title;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: a.title,
      description: a.summary,
      url,
      image: `${url}/opengraph-image`,
      inLanguage: "en",
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
        { "@type": "ListItem", position: 1, name: "Learn", item: `${SITE_URL}/learn` },
        { "@type": "ListItem", position: 2, name: trackTitle, item: `${SITE_URL}/learn#track-${a.track}` },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
  ];

  return (
    <main className={`${s.page} ${l.main}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <article className={l.article}>
        <Link href="/learn" className={l.back}>← Learn · {trackTitle}</Link>
        <div className={l.meta}>
          <span className={s.tag} style={{ "--tc": a.color }}>{a.tag}</span>
          <span>{a.minutes} min read</span>
        </div>
        <h1 className={l.h1}>{a.title}</h1>
        <p className={l.lede}>{a.summary}</p>
        <div className={l.body}>
          <a.Body />
        </div>

        {a.cta && <aside className={l.cta}>
          <span className={s.kicker}>Try it yourself</span>
          <h2>{a.cta.label}</h2>
          <p>{a.cta.text}</p>
          <Link className={`${s.cta} ${s.ctaExplore}`} href={a.cta.href}>{a.cta.label} <Arrow /></Link>
        </aside>}

        <nav className={l.pager} aria-label="More guides">
          {prev && (
            <Link href={`/learn/${prev.slug}`}>
              <small>← Previous</small>
              <strong>{prev.title}</strong>
            </Link>
          )}
          {next && (
            <Link href={`/learn/${next.slug}`} className={l.next}>
              <small>Next →</small>
              <strong>{next.title}</strong>
            </Link>
          )}
        </nav>
      </article>
    </main>
  );
}
