"use client";

import { useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./next-token-prediction.module.css";

const PURPLE = CLUSTER_COLORS[5];

// Illustrative logits for the next word after "The cat sat on the" (made up, sorted high to low).
const CANDIDATES = [
  ["mat", 5.2], ["floor", 4.4], ["couch", 3.9], ["bed", 3.6], ["sofa", 3.3], ["chair", 2.9],
  ["rug", 2.7], ["windowsill", 2.4], ["table", 2.1], ["roof", 1.6], ["edge", 1.2], ["keyboard", 0.9],
];
const N = CANDIDATES.length;
const DEFAULTS = { t: 1, k: N, p: 1 };

// Temperature, then top-k, then top-p, then renormalise (the order Hugging Face's generate() applies them).
// Assumes logits are sorted from high to low, as CANDIDATES is.
export function distribution(logits, t, k, p) {
  const scaled = t === 0 ? logits.map((_, i) => (i === 0 ? 0 : -Infinity)) : logits.map((x) => x / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((x) => Math.exp(x - max));
  const total = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / total);

  const keep = probs.map((_, i) => i < k);
  const kTotal = probs.reduce((a, q, i) => a + (keep[i] ? q : 0), 0);
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    if (!keep[i]) continue;
    if (p < 1 && cum >= p) keep[i] = false; // smallest set whose total reaches p
    cum += probs[i] / kTotal;
  }
  const keptTotal = probs.reduce((a, q, i) => a + (keep[i] ? q : 0), 0);
  return probs.map((q, i) => ({ before: q, kept: keep[i], after: keep[i] ? q / keptTotal : 0 }));
}

// Pick an index at random, in proportion to each kept row's probability.
function draw(rows) {
  let r = Math.random();
  const i = rows.findIndex((row) => row.kept && (r -= row.after) < 0);
  return i >= 0 ? i : rows.findLastIndex((row) => row.kept); // floating-point leftovers
}

const pct = (x) => (x === 1 ? "100%" : x < 0.001 ? "<0.1%" : `${(x * 100).toFixed(1)}%`);

export function SamplingPlayground() {
  const [{ t, k, p }, setOpts] = useState(DEFAULTS);
  const [draws, setDraws] = useState([]);
  const set = (key) => (e) => { setOpts((o) => ({ ...o, [key]: Number(e.target.value) })); setDraws([]); };
  const rows = distribution(CANDIDATES.map(([, l]) => l), t, k, p);
  const keptCount = rows.filter((r) => r.kept).length;

  const sample = () => setDraws((d) => [...d, CANDIDATES[draw(rows)][0]].slice(-12));
  const last = draws.at(-1);

  return (
    <div>
      <p className={s.prompt}>The cat sat on the <span className={s.blank}>{last ?? "___"}</span></p>
      <ol className={s.dist} aria-label={`Next-word probabilities, ${keptCount} of ${N} words allowed`}>
        {CANDIDATES.map(([word, logit], i) => {
          const r = rows[i];
          return (
            <li key={word} className={r.kept ? (word === last ? s.drawn : undefined) : s.cut}>
              <span className={s.word}>{word}</span>
              <span className={s.logit} aria-label={`logit ${logit}`}>{logit.toFixed(1)}</span>
              <span className={s.track}>
                <i style={{ width: `${(r.kept ? r.after : r.before) * 100}%`, "--c": PURPLE }} />
              </span>
              <span className={s.prob}>{r.kept ? pct(r.after) : "cut"}</span>
            </li>
          );
        })}
      </ol>

      <div className={s.controls}>
        <label>
          <span>Temperature <b>{t === 0 ? "0 (greedy)" : t.toFixed(2)}</b></span>
          <input type="range" min="0" max="2" step="0.05" value={t} onChange={set("t")} />
        </label>
        <label>
          <span>Top-k <b>{k === N ? "off" : k}</b></span>
          <input type="range" min="1" max={N} step="1" value={k} onChange={set("k")} />
        </label>
        <label>
          <span>Top-p <b>{p === 1 ? "off" : p.toFixed(2)}</b></span>
          <input type="range" min="0.05" max="1" step="0.05" value={p} onChange={set("p")} />
        </label>
      </div>

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={sample}>Sample a word</button>
        <button type="button" onClick={() => { setOpts(DEFAULTS); setDraws([]); }}>Reset</button>
      </div>
      <p className={s.draws} aria-live="polite">
        {draws.length ? <>Draws so far: {draws.join(", ")}</> : "Press “Sample a word” a few times and watch the answers vary."}
      </p>
    </div>
  );
}
