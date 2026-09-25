import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, TRACKS } from "@/components/learn/registry";
import s from "@/components/landing/landing.module.css";
import l from "@/components/learn/learn.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return a ? { title: `${a.title} · WordCanvas3D`, description: a.summary } : {};
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

  return (
    <main className={`${s.page} ${l.main}`}>
      <article className={l.article}>
        <Link href="/learn" className={l.back}>← Learn · {TRACKS.find((t) => t.id === a.track)?.title}</Link>
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
