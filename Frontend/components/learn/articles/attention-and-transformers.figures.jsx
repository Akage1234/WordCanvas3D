"use client";

import { useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./attention-and-transformers.module.css";

const INDIGO = CLUSTER_COLORS[4];

/* ---------- Illustrative attention weights for one sentence ---------- */

const TOKENS = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "too", "tired"];

// Hand-written, illustrative weights (not from a real model). Causal: row i only uses tokens 0..i.
const RAW = [
  { 0: 1 },
  { 0: 0.45, 1: 0.55 },
  { 0: 0.15, 1: 0.5, 2: 0.35 },
  { 0: 0.05, 1: 0.3, 2: 0.35, 3: 0.3 },
  { 0: 0.15, 3: 0.45, 4: 0.4 },
  { 1: 0.05, 3: 0.45, 4: 0.2, 5: 0.3 },
  { 1: 0.1, 2: 0.2, 3: 0.25, 5: 0.1, 6: 0.35 },
  { 0: 0.06, 1: 0.62, 5: 0.14, 6: 0.06, 7: 0.12 },
  { 1: 0.2, 7: 0.5, 8: 0.3 },
  { 7: 0.25, 8: 0.35, 9: 0.4 },
  { 1: 0.35, 7: 0.35, 9: 0.15, 10: 0.15 },
];
const WEIGHTS = RAW.map((row) => {
  const sum = Object.values(row).reduce((a, b) => a + b, 0);
  return TOKENS.map((_, j) => (row[j] ?? 0) / sum);
});

const y = (i) => `${((i + 0.5) / TOKENS.length) * 100}%`;
const pct = (w) => `${Math.round(w * 100)}%`;

export function AttentionLines() {
  const [sel, setSel] = useState(7);
  const w = WEIGHTS[sel];
  const top = w.indexOf(Math.max(...w));

  return (
    <div>
      <div className={s.lines}>
        <div className={s.col} role="group" aria-label="Choose a token">
          {TOKENS.map((t, i) => (
            <button
              key={i} type="button" className={s.tok} aria-pressed={i === sel}
              onMouseEnter={() => setSel(i)} onFocus={() => setSel(i)} onClick={() => setSel(i)}
            >{t}</button>
          ))}
        </div>
        <div className={s.linkCol} aria-hidden="true">
          <svg>
            {w.map((v, j) => v > 0 && (
              <line
                key={j} x1="0" y1={y(sel)} x2="100%" y2={y(j)}
                stroke={INDIGO} strokeOpacity={0.25 + v * 0.75} strokeWidth={1 + v * 9} strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
        <ol className={s.col} aria-label={`Attention weights of “${TOKENS[sel]}”`}>
          {TOKENS.map((t, j) => (
            <li key={j} className={j > sel ? s.masked : undefined}>
              <span>{t}</span>
              <small>{j > sel ? "hidden" : pct(w[j])}</small>
            </li>
          ))}
        </ol>
      </div>
      <p className={s.readout} aria-live="polite">
        “{TOKENS[sel]}” puts {pct(w[top])} of its attention on “{TOKENS[top]}”.
        {sel < TOKENS.length - 1 && " Later tokens are hidden from it."}
      </p>
    </div>
  );
}

// The same weights as a grid: row = the token doing the looking, column = the token looked at.
export function AttentionMatrix() {
  return (
    <div className={s.scrollBox}>
      <table className={s.matrix} aria-label="Attention weights as a grid. Every cell above the diagonal is empty because of the causal mask.">
        <thead>
          <tr><th scope="col"><span className={s.sr}>looking token</span></th>{TOKENS.map((t, j) => <th key={j} scope="col"><span>{t}</span></th>)}</tr>
        </thead>
        <tbody>
          {TOKENS.map((t, i) => (
            <tr key={i}>
              <th scope="row">{t}</th>
              {WEIGHTS[i].map((v, j) => (
                <td
                  key={j} className={j > i ? s.maskCell : undefined}
                  style={j > i ? undefined : { background: `color-mix(in srgb, ${INDIGO} ${Math.round(8 + v * 92)}%, #14161d)` }}
                  title={j > i ? "masked" : `${t} → ${TOKENS[j]}: ${pct(v)}`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- One attention computation, step by step ---------- */

const Q = [1, 1.5]; // query of "it"
const STEP_TOKENS = [
  { t: "the", k: [0.1, -0.3], v: [0.1, 0.1] },
  { t: "animal", k: [1.2, 0.9], v: [0.9, 0.2] },
  { t: "it", k: [0.6, 0.4], v: [0.3, 0.6] },
];
const D = Q.length;
const SCORES = STEP_TOKENS.map(({ k }) => k[0] * Q[0] + k[1] * Q[1]);
const SCALED = SCORES.map((x) => x / Math.sqrt(D));
const EXP = SCALED.map((x) => Math.exp(x - Math.max(...SCALED)));
const SOFT = EXP.map((e) => e / EXP.reduce((a, b) => a + b, 0));
const OUT = [0, 1].map((d) => STEP_TOKENS.reduce((acc, tok, i) => acc + SOFT[i] * tok.v[d], 0));

const f = (x) => x.toFixed(2);
const vec = (v) => `[${v.map(f).join(", ")}]`;

const STEPS = [
  { title: "Queries, keys and values", text: `The token “it” has a query ${vec(Q)}: what it is looking for. Every token it may look at (including itself) has a key, what it offers, and a value, what it will hand over.` },
  { title: "Compare: dot products", text: "Multiply the query with each key, number by number, and add up. A big result means the key matches what the query is looking for." },
  { title: `Scale: divide by √${D}`, text: `Divide each score by the square root of the vector length (here √${D} ≈ ${f(Math.sqrt(D))}). This keeps scores from growing huge in long vectors, which would make the next step too extreme.` },
  { title: "Softmax: scores become weights", text: "Softmax turns the scores into positive weights that add up to 1. The largest score gets most of the weight, but not all of it." },
  { title: "Blend: weighted sum of values", text: `Multiply each value by its weight and add them up. The result, ${vec(OUT)}, is mostly “animal”’s value: this is what attention adds to “it”.` },
];

export function AttentionSteps() {
  const [step, setStep] = useState(0);
  const cell = (show, content) => (show ? content : <span className={s.pending}>·</span>);

  return (
    <div>
      <div className={s.scrollBox}>
        <table className={s.steps}>
          <thead>
            <tr><th>token</th><th>key / value</th><th>{step >= 2 ? `q·k ÷ √${D}` : "q · k"}</th><th>weight</th></tr>
          </thead>
          <tbody>
            {STEP_TOKENS.map((tok, i) => (
              <tr key={tok.t}>
                <th scope="row">{tok.t}</th>
                <td><span className={s.kv}><i>k</i>{vec(tok.k)}</span><span className={s.kv}><i>v</i>{vec(tok.v)}</span></td>
                <td>{cell(step >= 1, f(step >= 2 ? SCALED[i] : SCORES[i]))}</td>
                <td>
                  {cell(step >= 3, (
                    <span className={s.wbar}><i style={{ width: `${SOFT[i] * 60}px` }} />{f(SOFT[i])}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">output</th>
              <td colSpan={3}>{cell(step >= 4, `${STEP_TOKENS.map((tok, i) => `${f(SOFT[i])}×${vec(tok.v)}`).join(" + ")} = ${vec(OUT)}`)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={s.stepText} aria-live="polite">
        <strong>Step {step + 1} of {STEPS.length}: {STEPS[step].title}</strong>
        <p>{STEPS[step].text}</p>
      </div>
      <div className={s.buttons}>
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0}>← Back</button>
        <button type="button" onClick={() => setStep(step + 1)} disabled={step === STEPS.length - 1}>Next →</button>
        <button type="button" onClick={() => setStep(0)} disabled={step === 0}>Restart</button>
      </div>
    </div>
  );
}
