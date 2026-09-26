"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { hash } from "./random";
import styles from "./landing.module.css";

// Decorative split that looks tokenizer-like; the Tokenizer page uses real tokenizers.
function pieces(text) {
  const out = [];
  for (const m of text.matchAll(/\S+\s*/g)) {
    const word = m[0];
    const core = word.trim();
    if (core.length < 6) { out.push(word); continue; }
    const cut = Math.ceil(core.length / 2) - (hash(core) % 2);
    out.push(core.slice(0, cut), word.slice(cut));
  }
  return out;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function Headline({ serifClass }) {
  const PHRASES = useTranslations("Home").raw("headlines");
  const [phrase, setPhrase] = useState(0);
  const [shown, setShown] = useState(Infinity);
  const [chips, setChips] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    const run = async () => {
      const first = pieces(PHRASES[0][0]).length + pieces(PHRASES[0][1]).length;
      await sleep(3500);
      if (alive) setChips(true);
      await sleep(500);
      for (let i = first - 1; i >= 0 && alive; i--) { setShown(i); await sleep(45); }
      await sleep(350);
      for (let n = 1; alive; n++) {
        const [p, q] = PHRASES[n % PHRASES.length];
        const count = pieces(p).length + pieces(q).length;
        setShown(0); setChips(true); setPhrase(n % PHRASES.length);
        for (let i = 1; i <= count && alive; i++) { await sleep(130); setShown(i); }
        await sleep(700);
        if (alive) setChips(false);
        await sleep(3800);
        if (alive) setChips(true);
        await sleep(500);
        for (let i = count - 1; i >= 0 && alive; i--) { setShown(i); await sleep(45); }
        await sleep(350);
      }
    };
    run();
    return () => { alive = false; };
  }, [PHRASES]);

  const [plain, accent] = PHRASES[phrase];
  const plainPieces = pieces(plain);
  const accentPieces = pieces(accent);
  let index = 0;
  const token = (text) => {
    const i = index++;
    return (
      <span
        key={i}
        className={`${styles.tok} ${i >= shown ? styles.tokHidden : ""} ${chips ? styles.chip : ""}`}
        style={{ "--tc": CLUSTER_COLORS[(i * 3 + 1) % CLUSTER_COLORS.length] }}
      >
        {text}
      </span>
    );
  };

  return (
    <h1 className={styles.headline} aria-label={`${plain} ${accent}`}>
      <span aria-hidden="true">
        {plainPieces.map(token)}
        <br />
        <em className={`${styles.serif} ${serifClass}`}>{accentPieces.map(token)}</em>
      </span>
    </h1>
  );
}
