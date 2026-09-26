import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { ARTICLES, TRACKS } from "@/components/learn/registry";
import s from "@/components/landing/landing.module.css";
import l from "@/components/learn/learn.module.css";
import PipelineAnim from "@/components/learn/PipelineAnim";
import LearnArt from "@/components/learn/LearnArt";
import { SITE_URL, jsonLd } from "@/lib/site";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"] });

const DESCRIPTION = "Beginner-friendly articles on how language models read text: tokens, embeddings, attention and transformers, plus quick guides to each WordCanvas3D tool.";

export const metadata = {
  title: "Learn: how language models read text",
  description: DESCRIPTION,
  alternates: { canonical: "/learn" },
  openGraph: { title: "Learn: how language models read text", description: DESCRIPTION, url: "/learn" },
  twitter: { title: "Learn: how language models read text", description: DESCRIPTION },
};

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Learn",
  url: `${SITE_URL}/learn`,
  description: DESCRIPTION,
  hasPart: ARTICLES.map((a) => ({ "@type": "Article", headline: a.title, url: `${SITE_URL}/learn/${a.slug}` })),
};

const TOOL_NAMES = { "/tokenizer": "Tokenizer", "/embedding": "Embedding explorer", "/vector-playground": "Vector Playground" };

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
  const tool = a.track === "guides" && TOOL_NAMES[a.cta?.href];
  return (
    <li className={featured ? l.featured : undefined}>
      <Link href={`/learn/${a.slug}`} className={l.card} style={{ "--tc": a.color }}>
        <span className={l.meta}>
          {num && <span className={l.num}>{String(num).padStart(2, "0")}</span>}
          <span className={s.tag}>{a.tag}</span>
          <span>{a.minutes} min read</span>
        </span>
        <h2>{a.title}</h2>
        <p>{a.summary}</p>
        {featured && <PipelineAnim className={l.pipeArt} serif={serif.style.fontFamily} />}
        {tool && <span className={l.pairs}><Glyph name={a.tag} className={l.pairsIcon} />Pairs with: <b>{tool}</b></span>}
      </Link>
    </li>
  );
}

function Grid({ articles, numbered, className = l.grid }) {
  const topics = [...new Set(articles.map((a) => a.topic).filter(Boolean))];
  return (
    <ol className={className}>
      {topics.length
        ? topics.flatMap((topic, i) => [
            <li key={topic} className={l.topic} aria-hidden="true"><Glyph name={topic} className={l.topicIcon} />Chapter {i + 1} · {topic}</li>,
            ...articles.filter((a) => a.topic === topic).map((a) => <Card key={a.slug} a={a} num={numbered && articles.indexOf(a) + 1} />),
          ])
        : articles.map((a) => <Card key={a.slug} a={a} />)}
    </ol>
  );
}

export default function LearnIndex() {
  const start = ARTICLES.find((a) => a.track === "start");
  const count = (id) => ARTICLES.filter((a) => a.track === id).length;
  const sections = TRACKS.filter((t) => t.id !== "start");

  return (
    <main className={`${s.page} ${l.main}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(SCHEMA)} />
      <div className={`${s.wrap} ${l.indexWrap}`}>
        <LearnArt className={l.headArt} />
        <header id="top" className={l.head}>
          <span className={s.kicker}>Learn</span>
          <h1 className={l.h1}>Understand what you’re looking at.</h1>
          <p className={s.sub}>How language models read text, from the very first step to the next word they write.</p>
          <nav className={l.jump} aria-label="Sections on this page">
            <a href="#start" className={l.jumpMain}>Quick Start <i aria-hidden="true">↓</i></a>
            {sections.map((t) => (
              <a key={t.id} href={`#track-${t.id}`}>{t.title} <small>{count(t.id)}</small><i aria-hidden="true">↓</i></a>
            ))}
          </nav>
        </header>

        <div id="start" className={l.prompt}>
          <p>Don’t know where to start? <em className={serif.className}>Start here</em></p>
          <svg className={l.arrow} viewBox="0 0 92 70" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path pathLength="1" d="M4 22 C 30 4, 66 8, 62 30 C 59 45, 38 42, 43 28 C 48 16, 76 26, 76 62" />
            <path pathLength="1" d="M68 55 L76 63 L83 54" />
          </svg>
        </div>
        <ol className={l.grid}>
          <Card a={start} featured />
        </ol>

        {sections.map((track) => (
          <section key={track.id} id={`track-${track.id}`} className={`${l.track} ${track.id === "guides" ? l.guides : ""}`} aria-labelledby={`track-${track.id}-title`}>
            <div className={l.trackHead}>
              <h2 id={`track-${track.id}-title`}>{track.title}</h2>
              <p>{track.blurb}</p>
            </div>
            <Grid articles={ARTICLES.filter((a) => a.track === track.id)} numbered={track.id === "foundations"} className={track.id === "guides" ? l.guideGrid : l.grid} />
          </section>
        ))}
        <a href="#top" className={l.toTop}><i aria-hidden="true">↑</i>Back to top</a>
      </div>
    </main>
  );
}
