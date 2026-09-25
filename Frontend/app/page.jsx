import Link from "next/link";
import Image from "next/image";
import { Instrument_Serif } from "next/font/google";
import Galaxy from "@/components/landing/Galaxy";
import Headline from "@/components/landing/Headline";
import { TokenSplit, MiniClusters, VectorMath } from "@/components/landing/LensVisuals";
import { Reveal, WordSearch } from "@/components/landing/Interactive";
import { ARTICLES as LEARN } from "@/components/learn/registry";
import s from "@/components/landing/landing.module.css";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"] });

const REPO = "https://github.com/Akage1234/WordCanvas3D";
const AUTHOR = "https://www.linkedin.com/in/ajay-kumar-0a024521a";

const Arrow = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const GitHubMark = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const LENSES = [
  { href: "/tokenizer", accent: "#f9ca24", step: "01 · Tokenizer", title: "Text into pieces", text: "Compare how GPT and other tokenizers cut the same sentence, and why emoji and rare words cost more.", cta: "Open Tokenizer", visual: <TokenSplit /> },
  { href: "/embedding", accent: "#4ecdc4", step: "02 · Embedding", title: "Words as a map", text: "Fly through up to 10,000 GloVe words. Clusters form on their own: numbers, places, feelings, verbs.", cta: "Open Embedding", visual: <MiniClusters /> },
  { href: "/vector-playground", accent: "#a55eea", step: "03 · Vector Playground", title: "Math with meaning", text: "Plot your own words as arrows and try the famous analogy: king − man + woman lands near queen.", cta: "Open Playground", visual: <VectorMath /> },
];

// A short reading path for the landing page; titles and reading times come from the Learn registry.
const FEATURED = ["how-llms-work", "why-tokens", "what-are-embeddings", "attention-and-transformers", "king-man-woman"];
const ARTICLES = FEATURED.map((slug) => LEARN.find((a) => a.slug === slug));

export default function Home() {
  return (
    <main className={s.page}>
      <div className={`${s.wrap} ${s.hero}`}>
        <div>
          <span className={s.eyebrow}><i /> Free &amp; open source · no sign-up</span>
          <Headline serifClass={serif.className} />
          <p className={s.pitch}>
            <strong>WordCanvas3D</strong> is a free playground for how AI understands text. Tokenize it, map it in 3D, and do math with meaning, right in your browser.
          </p>
          <div className={s.ctas}>
            <Link className={`${s.cta} ${s.ctaExplore}`} href="/embedding">
              <span className={s.orbit} aria-hidden="true"><i /><i /><i /></span>
              Explore embeddings
              <Arrow />
            </Link>
            <Link className={`${s.cta} ${s.ctaTokens}`} href="/tokenizer" aria-label="Tokenize text">
              <span className={s.t} style={{ "--tc": "#f9ca24" }}>Token</span>
              <span className={s.t} style={{ "--tc": "#fd79a8" }}>ize</span>
              <span className={s.t} style={{ "--tc": "#4ecdc4" }}>&nbsp;text</span>
            </Link>
          </div>
        </div>
        <Galaxy />
      </div>

      <section className={s.section}>
        <div className={s.wrap}>
          <Reveal className={s.reveal}>
            <span className={s.kicker}>Three tools, one idea</span>
            <h2 className={s.h2}>How a model sees language.</h2>
            <p className={s.sub}>Each tool shows one step of the journey. Start anywhere; they link into each other.</p>
          </Reveal>
          <div className={s.lenses}>
            {LENSES.map((lens) => (
              <Reveal as="link" key={lens.href} href={lens.href} className={`${s.lens} ${s.reveal}`} style={{ "--accent": lens.accent }}>
                <div className={s.lensViz}>{lens.visual}</div>
                <div className={s.lensBody}>
                  <span className={s.lensStep}>{lens.step}</span>
                  <h3 className={s.lensTitle}>{lens.title}</h3>
                  <p className={s.lensText}>{lens.text}</p>
                  <span className={s.go}>{lens.cta} <Arrow /></span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.learn}`}>
          <Reveal className={`${s.learnIntro} ${s.reveal}`}>
            <span className={s.kicker}>Learn</span>
            <h2 className={s.h2}>Understand what<br />you’re looking at.</h2>
            <p className={s.sub}>Beginner-friendly articles on how language models read text, from your first word to the next one they write.</p>
            <Link className={`${s.cta} ${s.ctaQuiet}`} href="/learn">Read the guides <Arrow /></Link>
          </Reveal>
          <Reveal as="ol" className={`${s.articles} ${s.reveal}`}>
            {ARTICLES.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.slug}`}>
                  <span className={s.tag} style={{ "--tc": a.color }}>{a.tag}</span>
                  <strong>{a.title}</strong>
                  <small>{a.minutes} min</small>
                  <Arrow />
                </Link>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <Reveal className={`${s.center} ${s.reveal}`}>
            <span className={s.kicker}>Works on any device</span>
            <h2 className={s.h2}>Your desk, your couch, your commute.</h2>
            <p className={s.sub}>Every tool is built for touch as well as mouse. Rotate, pinch and tap your way through language.</p>
          </Reveal>
          <Reveal className={s.devices} inClass={s.devicesIn}>
            <figure className={`${s.device} ${s.desktop}`}>
              <div className={s.screen}><Image src="/landing/desktop-embedding.webp" alt="The Embedding page on a desktop screen" width={1440} height={900} sizes="(max-width: 960px) 82vw, 820px" /></div>
              <div className={s.stand} />
            </figure>
            <figure className={`${s.device} ${s.tablet}`}>
              <div className={s.screen}><Image src="/landing/tablet-tokenizer.webp" alt="The Tokenizer page on a tablet" width={1180} height={820} sizes="(max-width: 960px) 36vw, 360px" /></div>
              <figcaption>Tokenizer</figcaption>
            </figure>
            <figure className={`${s.device} ${s.phone}`}>
              <div className={s.screen}><Image src="/landing/phone-vector.webp" alt="The Vector Playground on a phone" width={390} height={844} sizes="(max-width: 960px) 15vw, 150px" /></div>
              <figcaption>Vector Playground</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <Reveal className={`${s.oss} ${s.reveal}`}>
            <div>
              <span className={s.kicker}>Open source</span>
              <h2 className={s.h2}>Built in the open.</h2>
              <p className={s.sub}>Every line of WordCanvas3D is on GitHub. Read how it works, run it locally, open an issue, or send a pull request.</p>
              <div className={s.ossActions}>
                <a className={`${s.cta} ${s.ctaGh}`} href={REPO} target="_blank" rel="noopener noreferrer"><GitHubMark /> View on GitHub</a>
                <a className={`${s.cta} ${s.ctaQuiet}`} href={`${REPO}/stargazers`} target="_blank" rel="noopener noreferrer"><span className={s.star}>★</span> Star the repo</a>
              </div>
            </div>
            <div className={s.terminal} aria-label="Commands to run WordCanvas3D locally">
              <div className={s.termBar}><i /><i /><i /><span>Akage1234/WordCanvas3D</span></div>
              <pre>
                <span className={s.cmt}># run it on your machine</span>{"\n"}
                <span className={s.prompt}>$</span> git clone {REPO}{"\n"}
                <span className={s.prompt}>$</span> cd WordCanvas3D/Frontend{"\n"}
                <span className={s.prompt}>$</span> npm install{"\n"}
                <span className={s.prompt}>$</span> npm run dev{"\n"}
                <span className={s.ok}>✓ Ready on http://localhost:3000</span><span className={s.caret} />
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={s.final}>
        <Reveal className={`${s.wrap} ${s.reveal}`}>
          <span className={s.kicker}>Your turn</span>
          <h2 className={s.h2}>Pick a word.<br />See where it lives.</h2>
          <p className={s.sub}>Jump straight into the embedding space with any word.</p>
          <WordSearch buttonClass={`${s.cta} ${s.ctaExplore}`} />
        </Reveal>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <span>© 2026 WordCanvas3D</span>
          <span>Made with <span className={s.heart} role="img" aria-label="love">❤️</span> by <a className={s.author} href={AUTHOR} target="_blank" rel="noopener noreferrer">@Akage</a></span>
        </div>
      </footer>
    </main>
  );
}
