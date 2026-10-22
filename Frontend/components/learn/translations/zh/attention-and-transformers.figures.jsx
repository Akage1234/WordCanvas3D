"use client";

import { useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "@/components/learn/articles/attention-and-transformers.module.css";

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
        <div className={s.col} role="group" aria-label="选择一个词元">
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
        <ol className={s.col} aria-label={`“${TOKENS[sel]}”的注意力权重`}>
          {TOKENS.map((t, j) => (
            <li key={j} className={j > sel ? s.masked : undefined}>
              <span>{t}</span>
              <small>{j > sel ? "已遮蔽" : pct(w[j])}</small>
            </li>
          ))}
        </ol>
      </div>
      <p className={s.readout} aria-live="polite">
        “{TOKENS[sel]}”把 {pct(w[top])} 的注意力放在“{TOKENS[top]}”上。
        {sel < TOKENS.length - 1 && "它看不到后面的词元。"}
      </p>
    </div>
  );
}

// The same weights as a grid: row = the token doing the looking, column = the token looked at.
export function AttentionMatrix() {
  return (
    <div className={s.scrollBox}>
      <table className={s.matrix} aria-label="以网格表示的注意力权重。由于因果掩码，对角线以上的每个格子都是空的。">
        <thead>
          <tr><th scope="col"><span className={s.sr}>发出查看的词元</span></th>{TOKENS.map((t, j) => <th key={j} scope="col"><span>{t}</span></th>)}</tr>
        </thead>
        <tbody>
          {TOKENS.map((t, i) => (
            <tr key={i}>
              <th scope="row">{t}</th>
              {WEIGHTS[i].map((v, j) => (
                <td
                  key={j} className={j > i ? s.maskCell : undefined}
                  style={j > i ? undefined : { background: `color-mix(in srgb, ${INDIGO} ${Math.round(8 + v * 92)}%, #14161d)` }}
                  title={j > i ? "已遮蔽" : `${t} → ${TOKENS[j]}：${pct(v)}`}
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
  { title: "查询、键和值", text: `词元“it”有一个查询 ${vec(Q)}：表示它在找什么。它能看的每个词元（包括它自己）都有一个键，表示自己能提供什么，还有一个值，表示自己会交出什么。` },
  { title: "比较：点积", text: "把查询和每个键逐个数字相乘，再加起来。结果越大，说明这个键越符合查询要找的东西。" },
  { title: `缩放：除以 √${D}`, text: `把每个分数除以向量长度的平方根（这里是 √${D} ≈ ${f(Math.sqrt(D))}）。这样可以防止长向量的分数变得过大，否则下一步会变得过于极端。` },
  { title: "softmax：分数变成权重", text: "softmax 把分数变成总和为 1 的正权重。最大的分数分到大部分权重，但不是全部。" },
  { title: "混合：值的加权和", text: `把每个值乘以它的权重，再加起来。结果 ${vec(OUT)} 主要来自“animal”的值：这就是注意力添加给“it”的东西。` },
];

export function AttentionSteps() {
  const [step, setStep] = useState(0);
  const cell = (show, content) => (show ? content : <span className={s.pending}>·</span>);

  return (
    <div>
      <div className={s.scrollBox}>
        <table className={s.steps}>
          <thead>
            <tr><th>词元</th><th>键 / 值</th><th>{step >= 2 ? `q·k ÷ √${D}` : "q · k"}</th><th>权重</th></tr>
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
              <th scope="row">输出</th>
              <td colSpan={3}>{cell(step >= 4, `${STEP_TOKENS.map((tok, i) => `${f(SOFT[i])}×${vec(tok.v)}`).join(" + ")} = ${vec(OUT)}`)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={s.stepText} aria-live="polite">
        <strong>第 {step + 1} / {STEPS.length} 步：{STEPS[step].title}</strong>
        <p>{STEPS[step].text}</p>
      </div>
      <div className={s.buttons}>
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0}>← 上一步</button>
        <button type="button" onClick={() => setStep(step + 1)} disabled={step === STEPS.length - 1}>下一步 →</button>
        <button type="button" onClick={() => setStep(0)} disabled={step === 0}>重新开始</button>
      </div>
    </div>
  );
}
