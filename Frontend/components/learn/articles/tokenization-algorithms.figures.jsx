"use client";

import { useEffect, useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./tokenization-algorithms.module.css";

/* ---------- Toy BPE, computed live so every number shown is exact ---------- */

// Toy corpus from Sennrich et al. (2016): word, how many times it appears.
const CORPUS = [["low", 5], ["lower", 2], ["newest", 6], ["widest", 3]];
const N_MERGES = 10;

function countPairs(words) {
  const counts = new Map();
  for (const { syms, n } of words) {
    for (let i = 0; i < syms.length - 1; i++) {
      const key = `${syms[i]} ${syms[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + n);
    }
  }
  return counts;
}

// Merge every adjacent (a, b) into ab, left to right.
function mergeSyms(syms, a, b) {
  const out = [];
  for (let i = 0; i < syms.length; i++) {
    if (syms[i] === a && syms[i + 1] === b) { out.push(a + b); i++; } else out.push(syms[i]);
  }
  return out;
}

// One state per step: the words as currently split, the pair counts, and the pair chosen next.
// Ties go to the pair seen first (reading the corpus left to right), like most simple implementations.
function train() {
  let words = CORPUS.map(([w, n]) => ({ syms: [...w], n }));
  const states = [];
  for (let k = 0; k <= N_MERGES; k++) {
    const counts = [...countPairs(words)];
    const best = counts.reduce((m, c) => (c[1] > m[1] ? c : m), counts[0]);
    states.push({ words, counts: counts.sort((x, y) => y[1] - x[1]), best: k < N_MERGES ? best : null });
    if (k === N_MERGES) break;
    const [a, b] = best[0].split(" ");
    words = words.map((w) => ({ ...w, syms: mergeSyms(w.syms, a, b) }));
  }
  return states;
}

const STATES = train();
const MERGES = STATES.slice(0, -1).map((st) => st.best[0].split(" "));
const BASE = [...new Set(CORPUS.flatMap(([w]) => [...w]))];

const color = (i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length];

function usePlay(max, setStep) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep((k) => {
      if (k + 1 >= max) setPlaying(false);
      return Math.min(k + 1, max);
    }), 1400);
    return () => clearInterval(t);
  }, [playing, max, setStep]);
  return [playing, setPlaying];
}

export function BpeTrainer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = usePlay(N_MERGES, setStep);
  const st = STATES[step];
  const [a, b] = st.best ? st.best[0].split(" ") : [];
  const merges = MERGES.slice(0, step);
  const top = st.counts.slice(0, 5);
  const maxCount = top[0]?.[1] ?? 1;

  // Mark the symbols that are about to be merged.
  const marked = (syms) => {
    const hit = new Set();
    for (let i = 0; i < syms.length - 1; i++) {
      if (syms[i] === a && syms[i + 1] === b && !hit.has(i)) { hit.add(i); hit.add(i + 1); i++; }
    }
    return hit;
  };

  return (
    <div>
      <div className={s.controls}>
        <button type="button" className={s.btn} onClick={() => { setPlaying(false); setStep(0); }} disabled={step === 0}>Reset</button>
        <button type="button" className={s.btn} onClick={() => { setPlaying(false); setStep((k) => Math.max(0, k - 1)); }} disabled={step === 0}>Back</button>
        <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => { setPlaying(false); setStep((k) => Math.min(N_MERGES, k + 1)); }} disabled={step === N_MERGES}>Next merge</button>
        <button type="button" className={s.btn} onClick={() => setPlaying((p) => !p)} disabled={step === N_MERGES} aria-pressed={playing}>{playing ? "Pause" : "Play"}</button>
        <span className={s.stepNo} aria-live="polite">
          {step === 0 ? "Start: every word split into letters" : `After merge ${step} of ${N_MERGES}`}
        </span>
      </div>

      <div className={s.trainer}>
        <section aria-label="Corpus as currently split">
          <h3>Corpus</h3>
          <ul className={s.words}>
            {st.words.map(({ syms, n }) => {
              const hit = marked(syms);
              return (
                <li key={syms.join("")}>
                  <span className={s.syms}>
                    {syms.map((x, i) => <b key={i} className={hit.has(i) ? s.hit : undefined}>{x}</b>)}
                  </span>
                  <small>×{n}</small>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Most frequent neighbouring pairs">
          <h3>Pair counts</h3>
          <ol className={s.pairs}>
            {top.map(([key, n]) => (
              <li key={key} className={st.best && key === st.best[0] ? s.best : undefined}>
                <code>{key.replace(" ", " + ")}</code>
                <i style={{ "--w": `${(n / maxCount) * 100}%` }} />
                <span>{n}</span>
              </li>
            ))}
          </ol>
          <p className={s.next}>
            {st.best ? <>Next: merge <code>{a}</code> + <code>{b}</code> → <code>{a + b}</code></> : "Done: 10 merges learned."}
          </p>
        </section>

        <section aria-label="Merge list and vocabulary" className={s.vocabBox}>
          <h3>Merges learned, in order</h3>
          <ol className={s.mergeList}>
            {merges.length === 0 && <li className={s.empty}>none yet</li>}
            {merges.map(([x, y], i) => <li key={i}><code>{x} + {y} → {x + y}</code></li>)}
          </ol>
          <h3>Vocabulary · {BASE.length + merges.length}</h3>
          <div className={s.vocab}>
            {BASE.map((t) => <span key={t} className={s.base}>{t}</span>)}
            {merges.map(([x, y], i) => <span key={i} style={{ "--tc": color(i) }} className={s.learned}>{x + y}</span>)}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Tokenizing a new word with the learned merges ---------- */

function applyTrace(word) {
  let syms = [...word];
  const trace = [{ syms, merge: null }];
  for (const [a, b] of MERGES) {
    const next = mergeSyms(syms, a, b);
    if (next.length !== syms.length) trace.push({ syms: next, merge: a + b });
    syms = next;
  }
  return trace;
}

const NEW_WORDS = ["lowest", "newer", "renew", "wider", "rider"];

export function BpeApply() {
  const [word, setWord] = useState(NEW_WORDS[0]);
  const trace = applyTrace(word);
  const final = trace.at(-1).syms;
  return (
    <div>
      <div className={s.controls} role="group" aria-label="Word to tokenize">
        {NEW_WORDS.map((w) => (
          <button key={w} type="button" className={s.btn} aria-pressed={w === word} onClick={() => setWord(w)}>{w}</button>
        ))}
      </div>
      <ol key={word} className={s.trace} aria-label={`Merges applied to ${word}`}>
        {trace.map(({ syms, merge }, i) => (
          <li key={i} style={{ "--d": `${i * 0.25}s` }}>
            <span className={s.traceLabel}>{merge ? <>apply <code>{merge}</code></> : "letters"}</span>
            <span className={s.syms}>{syms.map((x, j) => <b key={j}>{x}</b>)}</span>
          </li>
        ))}
      </ol>
      <p className={s.next} aria-live="polite">
        Result: {final.length} token{final.length > 1 ? "s" : ""}: {final.map((t, i) => <code key={i}>{t}</code>)}
        {trace.length === 1 && " (none of the 10 merges apply, so it stays as letters)"}
      </p>
    </div>
  );
}
