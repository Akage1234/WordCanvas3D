import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import s from "@/components/landing/landing.module.css";

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// "404" drawn the way the Tokenizer shows tokens: coloured chips, each with an ID, the last one unknown.
const CHIPS = [["4", "#f9ca24", 19], ["0", "#4ecdc4", 15], ["4", "#fd79a8", "<unk>"]];

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className={`${s.page} flex min-h-[70vh] items-center`}>
      <title>{`${t("title")} · WordCanvas3D`}</title>
      <div className={`${s.wrap} ${s.center} py-16`}>
        <div className="mb-8 flex justify-center gap-2 font-mono" aria-hidden="true">
          {CHIPS.map(([text, color, id], i) => (
            <span key={i} className="flex flex-col items-center gap-2">
              <b className="rounded-xl px-4 py-1 text-6xl font-semibold text-white sm:text-7xl" style={{ background: `${color}40`, boxShadow: `inset 0 -3px 0 ${color}` }}>{text}</b>
              <small className="text-xs text-neutral-500">{id}</small>
            </span>
          ))}
        </div>
        <span className={s.kicker}>{t("kicker")}</span>
        <h1 className={s.h2}>{t("heading")}</h1>
        <p className={s.sub}>{t("sub")}</p>
        <div className={`${s.ctas} justify-center`}>
          <Link className={`${s.cta} ${s.ctaExplore}`} href="/">{t("home")} <Arrow /></Link>
          <Link className={`${s.cta} ${s.ctaQuiet}`} href="/learn">{t("learn")}</Link>
        </div>
      </div>
    </main>
  );
}
