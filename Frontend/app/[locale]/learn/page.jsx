import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Instrument_Serif } from "next/font/google";
import { ARTICLES, TRACKS } from "@/components/learn/registry";
import s from "@/components/landing/landing.module.css";
import l from "@/components/learn/learn.module.css";
import PipelineAnim from "@/components/learn/PipelineAnim";
import LearnArt from "@/components/learn/LearnArt";
import { SITE_URL, jsonLd } from "@/lib/site";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"] });

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Learn" });
  const title = t("metaTitle");
  const description = t("description");
  return {
    title,
    description,
    alternates: { canonical: "/learn" },
    openGraph: { title, description, url: "/learn" },
    twitter: { title, description },
  };
}

const schema = (name, description) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  url: `${SITE_URL}/learn`,
  description,
  hasPart: ARTICLES.map((a) => ({ "@type": "Article", headline: a.title, url: `${SITE_URL}/learn/${a.slug}` })),
});

// Keys into Learn.tools for the "Pairs with" line on guide cards.
const TOOL_KEYS = { "/tokenizer": "tokenizer", "/embedding": "embedding", "/vector-playground": "vectors" };

// Small line drawings, one per idea, drawn in the same stroke as the rest of the site.
const GLYPHS = {
  Tokens: <><rect x="2" y="8" width="6" height="8" rx="1.5" /><rect x="9.5" y="8" width="5" height="8" rx="1.5" /><rect x="16" y="8" width="6" height="8" rx="1.5" /></>,
  Embeddings: <><circle cx="6" cy="16" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="18" cy="7" r="1.4" /><circle cx="15.5" cy="9.5" r="1.4" /><circle cx="17" cy="17" r="1.4" /><path d="M3 21h18M3 21V3" opacity=".5" /></>,
  Transformers: <><circle cx="4" cy="17" r="1.6" /><circle cx="12" cy="17" r="1.6" /><circle cx="20" cy="17" r="1.6" /><path d="M4 15c1-7 15-7 16 0M12 15c1-4 7-4 8 0" /></>,
  Vectors: <><path d="M4 20 18 6M4 20l14 4M4 20V6" transform="scale(.92) translate(1 -3)" /><path d="M13.5 6.5h4v4" /></>,
};

function Glyph({ name, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {GLYPHS[name]}
    </svg>
  );
}

function Card({ a, featured, num }) {
  const t = useTranslations("Learn");
  const tool = a.track === "guides" && TOOL_KEYS[a.cta?.href];
  return (
    <li className={featured ? l.featured : undefined}>
      <Link href={`/learn/${a.slug}`} className={l.card} style={{ "--tc": a.color }}>
        <span className={l.meta}>
          {num && <span className={l.num}>{String(num).padStart(2, "0")}</span>}
          <span className={s.tag}>{t(`tags.${a.tag}`)}</span>
          <span>{t("minRead", { count: a.minutes })}</span>
        </span>
        <h2>{a.title}</h2>
        <p>{a.summary}</p>
        {featured && <PipelineAnim className={l.pipeArt} serif={serif.style.fontFamily} />}
        {tool && <span className={l.pairs}><Glyph name={a.tag} className={l.pairsIcon} />{t.rich("pairsWith", { tool: t(`tools.${tool}`), b: (chunks) => <b>{chunks}</b> })}</span>}
      </Link>
    </li>
  );
}

function Grid({ articles, numbered, className = l.grid }) {
  const t = useTranslations("Learn");
  const topics = [...new Set(articles.map((a) => a.topic).filter(Boolean))];
  return (
    <ol className={className}>
      {topics.length
        ? topics.flatMap((topic, i) => [
            <li key={topic} className={l.topic} aria-hidden="true"><Glyph name={topic} className={l.topicIcon} />{t("chapter", { number: i + 1, topic: t(`tags.${topic}`) })}</li>,
            ...articles.filter((a) => a.topic === topic).map((a) => <Card key={a.slug} a={a} num={numbered && articles.indexOf(a) + 1} />),
          ])
        : articles.map((a) => <Card key={a.slug} a={a} />)}
    </ol>
  );
}

export default async function LearnIndex({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Learn");
  const start = ARTICLES.find((a) => a.track === "start");
  const count = (id) => ARTICLES.filter((a) => a.track === id).length;
  const sections = TRACKS.filter((id) => id !== "start");

  return (
    <main className={`${s.page} ${l.main}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema(t("title"), t("description")))} />
      <div className={`${s.wrap} ${l.indexWrap}`}>
        <LearnArt className={l.headArt} />
        <header id="top" className={l.head}>
          <span className={s.kicker}>{t("title")}</span>
          <h1 className={l.h1}>{t("heading")}</h1>
          <p className={s.sub}>{t("sub")}</p>
          <nav className={l.jump} aria-label={t("sectionsLabel")}>
            <a href="#start" className={l.jumpMain}>{t("quickStart")} <i aria-hidden="true">↓</i></a>
            {sections.map((id) => (
              <a key={id} href={`#track-${id}`}>{t(`tracks.${id}.title`)} <small>{count(id)}</small><i aria-hidden="true">↓</i></a>
            ))}
          </nav>
        </header>

        <div id="start" className={l.prompt}>
          <p>{t.rich("startPrompt", { em: (chunks) => <em className={serif.className}>{chunks}</em> })}</p>
          <svg className={l.arrow} viewBox="0 0 92 70" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path pathLength="1" d="M4 22 C 30 4, 66 8, 62 30 C 59 45, 38 42, 43 28 C 48 16, 76 26, 76 62" />
            <path pathLength="1" d="M68 55 L76 63 L83 54" />
          </svg>
        </div>
        <ol className={l.grid}>
          <Card a={start} featured />
        </ol>

        {sections.map((id) => (
          <section key={id} id={`track-${id}`} className={`${l.track} ${id === "guides" ? l.guides : ""}`} aria-labelledby={`track-${id}-title`}>
            <div className={l.trackHead}>
              <h2 id={`track-${id}-title`}>{t(`tracks.${id}.title`)}</h2>
              <p>{t(`tracks.${id}.blurb`)}</p>
            </div>
            <Grid articles={ARTICLES.filter((a) => a.track === id)} numbered={id === "foundations"} className={id === "guides" ? l.guideGrid : l.grid} />
          </section>
        ))}
        <a href="#top" className={l.toTop}><i aria-hidden="true">↑</i>{t("backToTop")}</a>
      </div>
    </main>
  );
}
