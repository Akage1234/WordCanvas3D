import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Instrument_Serif } from "next/font/google";
import Galaxy from "@/components/landing/Galaxy";
import Headline from "@/components/landing/Headline";
import { TokenSplit, MiniClusters, VectorMath } from "@/components/landing/LensVisuals";
import { Reveal, ShareBar } from "@/components/landing/Interactive";
import { ARTICLES as LEARN } from "@/components/learn/catalog";
import s from "@/components/landing/landing.module.css";
import { AUTHOR as SITE_AUTHOR, REPO_URL, SITE_NAME, SITE_URL, jsonLd, localeAlternates, localePath } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { alternates: localeAlternates("/", locale), openGraph: { url: localePath("/", locale) } };
}

const schema = (description, locale) => [
  { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, description, inLanguage: locale },
  {
    "@context": "https://schema.org", "@type": "WebApplication", name: SITE_NAME, url: SITE_URL, description,
    applicationCategory: "EducationalApplication", operatingSystem: "Any (runs in the browser)", isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: { "@type": "Person", ...SITE_AUTHOR }, codeRepository: REPO_URL,
  },
];

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

// Copy for each lens lives in messages under Home.lenses.<id>.
const LENSES = [
  { id: "tokenizer", href: "/tokenizer", accent: "#f9ca24", visual: <TokenSplit /> },
  { id: "embedding", href: "/embedding", accent: "#4ecdc4", visual: <MiniClusters /> },
  { id: "vectors", href: "/vector-playground", accent: "#a55eea", visual: <VectorMath /> },
];
const CHIP_COLORS = ["#f9ca24", "#fd79a8", "#4ecdc4"];

// A short reading path for the landing page; titles and reading times come from the Learn registry.
const FEATURED = ["how-llms-work", "why-tokens", "what-are-embeddings", "attention-and-transformers", "king-man-woman"];
const ARTICLES = FEATURED.map((slug) => LEARN.find((a) => a.slug === slug));

export default async function Home({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tm = await getTranslations("Metadata");
  const tl = await getTranslations("Learn");
  return (
    <main className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema(tm("description"), locale))} />
      <div className={`${s.wrap} ${s.hero}`}>
        <div>
          <span className={s.eyebrow}><i /> {t("eyebrow")}</span>
          <Headline serifClass={serif.className} />
          <p className={s.pitch}>
            {t.rich("pitch", { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <div className={s.ctas}>
            <Link className={`${s.cta} ${s.ctaExplore}`} href="/embedding">
              <span className={s.orbit} aria-hidden="true"><i /><i /><i /></span>
              {t("exploreCta")}
              <Arrow />
            </Link>
            <Link className={`${s.cta} ${s.ctaTokens}`} href="/tokenizer" aria-label={t("tokenizeCta")}>
              {t.raw("tokenizeChips").map((chip, i) => <span key={i} className={s.t} style={{ "--tc": CHIP_COLORS[i % CHIP_COLORS.length] }}>{chip}</span>)}
            </Link>
          </div>
        </div>
        <Galaxy />
      </div>

      <section className={s.section}>
        <div className={s.wrap}>
          <Reveal className={s.reveal}>
            <span className={s.kicker}>{t("tools.kicker")}</span>
            <h2 className={s.h2}>{t("tools.title")}</h2>
            <p className={s.sub}>{t("tools.sub")}</p>
          </Reveal>
          <div className={s.lenses}>
            {LENSES.map((lens) => (
              <Reveal as="link" key={lens.href} href={lens.href} className={`${s.lens} ${s.reveal}`} style={{ "--accent": lens.accent }}>
                <div className={s.lensViz}>{lens.visual}</div>
                <div className={s.lensBody}>
                  <span className={s.lensStep}>{t(`lenses.${lens.id}.step`)}</span>
                  <h3 className={s.lensTitle}>{t(`lenses.${lens.id}.title`)}</h3>
                  <p className={s.lensText}>{t(`lenses.${lens.id}.text`)}</p>
                  <span className={s.go}>{t(`lenses.${lens.id}.cta`)} <Arrow /></span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.learn}`}>
          <Reveal className={`${s.learnIntro} ${s.reveal}`}>
            <span className={s.kicker}>{t("learn.kicker")}</span>
            <h2 className={s.h2}>{t.rich("learn.title", { br: () => <br /> })}</h2>
            <p className={s.sub}>{t("learn.sub")}</p>
            <Link className={`${s.cta} ${s.ctaQuiet}`} href="/learn">{t("learn.cta")} <Arrow /></Link>
          </Reveal>
          <Reveal as="ol" className={`${s.articles} ${s.reveal}`}>
            {ARTICLES.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.slug}`}>
                  <span className={s.tag} style={{ "--tc": a.color }}>{tl(`tags.${a.tag}`)}</span>
                  <strong>{a.title}</strong>
                  <small>{t("learn.minutes", { count: a.minutes })}</small>
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
            <span className={s.kicker}>{t("devices.kicker")}</span>
            <h2 className={s.h2}>{t("devices.title")}</h2>
            <p className={s.sub}>{t("devices.sub")}</p>
          </Reveal>
          <Reveal className={s.devices} inClass={s.devicesIn}>
            <figure className={`${s.device} ${s.desktop}`}>
              <div className={s.screen}><Image src="/landing/desktop-embedding.webp" alt={t("devices.desktopAlt")} width={1440} height={900} sizes="(max-width: 960px) 82vw, 820px" /></div>
              <div className={s.stand} />
            </figure>
            <figure className={`${s.device} ${s.tablet}`}>
              <div className={s.screen}><Image src="/landing/tablet-tokenizer.webp" alt={t("devices.tabletAlt")} width={1180} height={820} sizes="(max-width: 960px) 36vw, 360px" /></div>
              <figcaption>{t("devices.tabletCaption")}</figcaption>
            </figure>
            <figure className={`${s.device} ${s.phone}`}>
              <div className={s.screen}><Image src="/landing/phone-vector.webp" alt={t("devices.phoneAlt")} width={390} height={844} sizes="(max-width: 960px) 15vw, 150px" /></div>
              <figcaption>{t("devices.phoneCaption")}</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <Reveal className={`${s.oss} ${s.reveal}`}>
            <div>
              <span className={s.kicker}>{t("oss.kicker")}</span>
              <h2 className={s.h2}>{t("oss.title")}</h2>
              <p className={s.sub}>{t("oss.sub")}</p>
              <div className={s.ossActions}>
                <a className={`${s.cta} ${s.ctaGh}`} href={REPO} target="_blank" rel="noopener noreferrer"><GitHubMark /> {t("oss.github")}</a>
                <a className={`${s.cta} ${s.ctaQuiet}`} href={`${REPO}/stargazers`} target="_blank" rel="noopener noreferrer"><span className={s.star}>★</span> {t("oss.star")}</a>
              </div>
            </div>
            <div className={s.terminal} aria-label={t("oss.terminalLabel")}>
              <div className={s.termBar}><i /><i /><i /><span>Akage1234/WordCanvas3D</span></div>
              <pre>
                <span className={s.cmt}>{t("oss.terminalComment")}</span>{"\n"}
                <span className={s.prompt}>$</span> git clone {REPO}{"\n"}
                <span className={s.prompt}>$</span> cd WordCanvas3D/Frontend{"\n"}
                <span className={s.prompt}>$</span> npm install{"\n"}
                <span className={s.prompt}>$</span> npm run dev{"\n"}
                <span className={s.ok}>{t("oss.ready")}</span><span className={s.caret} />
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={s.final}>
        <Reveal className={`${s.wrap} ${s.reveal}`}>
          <span className={`${s.enjoy} ${serif.className}`}>{t("final.enjoy")}</span>
          <h2 className={s.h2}>{t.rich("final.title", { em: (chunks) => <em className={`${s.serif} ${serif.className}`}>{chunks}</em> })}</h2>
          <p className={s.sub}>{t("final.sub")}</p>
          <ShareBar buttonClass={`${s.cta} ${s.ctaExplore} ${s.shareBtn}`} />
        </Reveal>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <span>{t("footer.copyright")}</span>
          <span>{t.rich("footer.madeWith", {
            heart: () => <span className={s.heart} role="img" aria-label={t("footer.love")}>❤️</span>,
            author: (chunks) => <a className={s.author} href={AUTHOR} target="_blank" rel="noopener noreferrer">{chunks}</a>,
          })}</span>
        </div>
      </footer>
    </main>
  );
}
