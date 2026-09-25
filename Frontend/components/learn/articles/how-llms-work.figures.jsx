"use client";

import { useEffect, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./how-llms-work.module.css";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"] });

// A short film of one forward pass. Token IDs are real (o200k_base); the vectors, attention weights,
// layer count and probabilities are illustrative and match the numbers used in the article text.
const START = 4; // the timeline below is in film seconds; the first 4 are skipped
const END = 83;

const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lin = (t, a, b) => clamp((t - a) / (b - a));
const at = (t, a, b) => ease(lin(t, a, b));
const mix = (a, b, k) => a + (b - a) * k;
const inOut = (t, a, b, c, d) => at(t, a, b) * (1 - at(t, c, d));
const draw = (k) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k, opacity: k > 0 ? 1 : 0 });
const hash = (a, b, c = 0) => { const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };

const CYAN = "#5ad0f5", PINK = "#f472b6", YELLOW = "#f5c451", DIM = "#7d889b";
const CW = 10.8; // one monospace character at 18px

const TOKENS = [
  { w: "The", id: 976, off: 0, c: CLUSTER_COLORS[0] },
  { w: "·cat", id: 9059, off: 3, c: CLUSTER_COLORS[1] },
  { w: "·sat", id: 10139, off: 7, c: CLUSTER_COLORS[2] },
  { w: "·on", id: 402, off: 11, c: CLUSTER_COLORS[3] },
  { w: "·the", id: 290, off: 14, c: CLUSTER_COLORS[4] },
];
const TX = [150, 260, 370, 480, 590];
const X0 = 480 - (18 * CW) / 2;
const CELLS = 10;
const COL_Y = 196;
const ROW_H = 13;
const LAYERS = 32;
const CANDS = [["·mat", 0.38], ["·floor", 0.17], ["·bed", 0.08], ["·couch", 0.06], ["·rug", 0.04]];
const TOPK = [0.6, 0.27, 0.13];
const LOGIT_TOP = { 4: 0, 12: 1, 19: 2, 26: 3, 31: 4 };

const CHAPTERS = [
  [4, "The prompt"], [8, "1 · Tokenize"], [13, "2 · Embed"], [21, "3 · Transformer layers"],
  [42, "4 · Unembed"], [49, "5 · Softmax"], [55, "6 · Sample"], [62, "The whole loop"],
];
const LINES = [
  [4, 8, "Start with a prompt."],
  [8, 13, "A tokenizer cuts it into pieces, and each piece has an ID."],
  [13, 17.8, "Each ID picks out one row of a huge table: that token’s embedding."],
  [17.8, 21, "A position signal is mixed in, so word order isn’t lost."],
  [21, 27, "The vectors now enter the transformer: layer after layer of weights, each one a dial set during training."],
  [27, 35.5, "Every vector passes through every layer. The dials stay put; the vectors change."],
  [35.5, 42, "From here on, think of all of it as one box: the transformer."],
  [42, 49, "Only the last vector is used. One more matrix turns it into a score for every token."],
  [49, 55, "Softmax turns those scores into probabilities."],
  [55, 62, "Keep the top few, and draw one at random, weighted by probability."],
  [62, 72, "Zoom out: text goes in, one token comes out, and that token goes back in."],
  [72, END, "Again and again, one token per pass. That’s how a whole answer gets written."],
];

// Layer progress: 0 = embedding + position, rising to LAYERS as the vectors pass through the stack.
function layerAt(t) {
  return t < 27 ? 0 : lin(t, 27, 34) * LAYERS;
}
function value(i, j, t) {
  const L = layerAt(t);
  const base = (L0) => (L0 === 0 ? hash(TOKENS[i].id, j) + 0.3 * Math.sin(i * 1.3 + j) * at(t, 18.6, 20) : hash(i * 7 + j, L0, 3));
  const f = Math.floor(L);
  return Math.max(-1, Math.min(1, mix(base(f), base(f + 1), L - f)));
}
const cellColor = (v) => (v > 0 ? CYAN : PINK);

function Chip({ x, y = 124, label, k, color = CYAN, glow }) {
  const w = label.length * CW + 20;
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 8})`} filter={glow}>
      <rect x={x - w / 2} y={y} width={w} height="30" rx="6" fill={color} fillOpacity=".28" />
      <rect x={x - w / 2 + 3} y={y + 28} width={w - 6} height="2" rx="1" fill={color} />
    </g>
  );
}

// The transformer as a stack of layers full of dials (weights), after 3Blue1Brown. The vectors pass
// through every layer, then the whole stack folds into one black box and slides out of the way.
const SLABS = 8;
const FRONT = { x: 380, y: 266, w: 336, h: 196 };
const BOX = { x: 24, y: 206, w: 176, h: 118 };
const DIAL_COLS = 11, DIAL_ROWS = 6;

function Dial({ cx, cy, r, angle, needle = CYAN, width = 1.2 }) {
  const a0 = (135 * Math.PI) / 180, a1 = (405 * Math.PI) / 180;
  const pt = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  const [sx, sy] = pt(a0, r), [ex, ey] = pt(a1, r);
  const [nx, ny] = pt(((angle - 90) * Math.PI) / 180, r * 0.8);
  return (
    <g>
      <path d={`M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${ey}`} stroke="#e7edf6" strokeWidth={width} strokeLinecap="round" />
      <path d={`M${cx} ${cy}L${nx} ${ny}`} stroke={needle} strokeWidth={width * 1.8} strokeLinecap="round" />
    </g>
  );
}

function Stack({ t, glow }) {
  const show = at(t, 21.6, 23.2) * (1 - at(t, 49.5, 50.3));
  if (!show) return null;
  const merge = at(t, 35.6, 37.4);
  const move = at(t, 38, 40.4);
  const dials = at(t, 23, 26.5) * (1 - at(t, 35.4, 36.4));
  const zoom = inOut(t, 24.2, 25.2, 30.4, 31.2);
  const pass = lin(t, 27, 34);
  const passing = t > 26.8 && t < 34.4;
  const front = {
    x: mix(FRONT.x, BOX.x, move), y: mix(FRONT.y, BOX.y, move),
    w: mix(FRONT.w, BOX.w, move), h: mix(FRONT.h, BOX.h, move),
  };
  const slab = (n) => {
    const back = (SLABS - 1 - n) * (1 - merge);
    return { x: front.x - back * 13, y: front.y - back * 11 };
  };
  const dialAt = (r, c) => [FRONT.x + 26 + c * 28.5, FRONT.y + 26 + r * 29];
  const hi = passing ? Math.min(SLABS - 1, Math.floor(pass * SLABS)) : -1;
  const pulse = (pass * 3) % 1;
  return (
    <g opacity={show}>
      {passing && (
        <g>
          <path d={`M270 ${FRONT.y + 60}H${FRONT.x - 100}`} stroke={CYAN} strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="3 5" strokeDashoffset={-t * 30} />
          <circle cx={mix(270, FRONT.x - 100, pulse)} cy={FRONT.y + 60} r="3" fill={CYAN} filter={glow} opacity={1 - pulse} />
        </g>
      )}
      {Array.from({ length: SLABS }, (_, n) => {
        const { x, y } = slab(n);
        const on = n === hi;
        const last = n === SLABS - 1;
        const k = at(t, 21.6 + n * 0.08, 22.6 + n * 0.08);
        return (
          <g key={n} opacity={k}>
            <path d={`M${x} ${y}l10 -9h${front.w}l-10 9z`} fill={on ? "#2a4a5c" : "#262c37"} stroke="#ffffff1f" strokeWidth=".8" />
            <path d={`M${x + front.w} ${y}l10 -9v${front.h}l-10 9z`} fill={on ? "#1d3a4a" : "#1b2029"} stroke="#ffffff1f" strokeWidth=".8" />
            <rect x={x} y={y} width={front.w} height={front.h} fill={last && merge > 0.5 ? "#07080b" : on ? "#1e3542" : "#151a22"}
              stroke={on ? CYAN : "#ffffff26"} strokeOpacity={on ? 0.8 : 1} filter={on ? glow : undefined} />
          </g>
        );
      })}
      {dials > 0 && Array.from({ length: DIAL_ROWS }, (_, r) => Array.from({ length: DIAL_COLS }, (_, c) => {
        const [cx, cy] = dialAt(r, c);
        const spin = at(t, 23.2 + (r + c) * 0.08, 24.6 + (r + c) * 0.08);
        return <g key={`${r}-${c}`} opacity={dials}><Dial cx={cx} cy={cy} r={9} angle={mix(-135, hash(r, c, 9) * 135, spin)} /></g>;
      }))}
      {zoom > 0 && (() => {
        const [cx, cy] = dialAt(0, DIAL_COLS - 1);
        return (
          <g opacity={zoom}>
            <rect x={cx - 13} y={cy - 13} width="26" height="26" stroke={CYAN} strokeWidth="1.5" />
            <path d={`M${cx - 13} ${cy - 13}L766 190M${cx + 13} ${cy - 13}L906 190`} stroke="#ffffffb0" {...draw(zoom)} />
            <rect x="770" y="70" width="140" height="120" fill="#07080b" stroke={CYAN} strokeWidth="1.8" />
            <Dial cx={836} cy={134} r={40} angle={hash(0, DIAL_COLS - 1, 9) * 135} width={2.6} />
            {Array.from({ length: 9 }, (_, n) => {
              const a = ((135 + n * 33.75) * Math.PI) / 180;
              return <path key={n} d={`M${836 + 44 * Math.cos(a)} ${134 + 44 * Math.sin(a)}L${836 + 50 * Math.cos(a)} ${134 + 50 * Math.sin(a)}`} stroke="#e7edf6" strokeWidth="1.6" />;
            })}
            <text x="836" y="60" textAnchor="middle" className={s.fSmall}>one weight</text>
          </g>
        );
      })()}
      {passing && <text x={FRONT.x + FRONT.w / 2} y={FRONT.y + FRONT.h + 34} textAnchor="middle" className={s.fSmall}>layer {Math.max(1, Math.ceil(pass * LAYERS))} / {LAYERS}</text>}
      <text x={FRONT.x + FRONT.w / 2} y={FRONT.y + FRONT.h + 34} textAnchor="middle" className={s.fSmall} style={{ fill: DIM }} opacity={at(t, 22.4, 23) * (1 - at(t, 26.6, 27))}>{LAYERS} layers · billions of dials</text>
      <text x={front.x + front.w / 2} y={front.y + front.h / 2 + 8} textAnchor="middle" className={s.fChapter} style={{ fontSize: mix(34, 24, move) }} opacity={at(t, 36.6, 37.6)}>Transformer</text>
    </g>
  );
}

// The closing diagram: text → tokenizer → transformer → probabilities → chosen token → back into the text.
const LOOP_WORDS = [
  { w: " mat", cands: [["·mat", 0.6], ["·floor", 0.27], ["·bed", 0.13]] },
  { w: ".", cands: [[".", 0.62], [",", 0.24], ["·and", 0.14]] },
  { w: " It", cands: [["·It", 0.48], ["·The", 0.33], ["·She", 0.19]] },
  { w: " purred", cands: [["·purred", 0.41], ["·slept", 0.36], ["·was", 0.23]] },
];
const RUNS = [[64.8, 5.2], [70, 4], [74, 3.4], [77.4, 3.4]];
const PROMPT = "The cat sat on the";

function wrap(text, width) {
  const lines = [""];
  for (const word of text.split(/(?= )/)) {
    if ((lines[lines.length - 1] + word).length > width) lines.push(word.trimStart());
    else lines[lines.length - 1] += word;
  }
  return lines;
}

function Loop({ t, glow }) {
  const k = at(t, 62.4, 63.6);
  if (!k) return null;
  const Y = 290;
  const run = RUNS.findLastIndex(([s0]) => t >= s0);
  const u = run >= 0 ? lin(t, RUNS[run][0], RUNS[run][0] + RUNS[run][1]) : 0;
  const done = RUNS.filter(([s0, d]) => t >= s0 + d * 0.96).length;
  const text = PROMPT + LOOP_WORDS.slice(0, done).map((x) => x.w).join("");
  const cur = LOOP_WORDS[Math.max(0, run)];
  const flow = lin(u, 0, 0.36);
  const px = mix(214, 752, flow);
  const moving = run >= 0 && u > 0 && u < 0.36;
  const inside = (a, b) => moving && px > a && px < b;
  const bars = run >= 0 ? at(u, 0.36, 0.56) : 0;
  const chosen = run >= 0 ? at(u, 0.56, 0.64) : 0;
  const fly = run >= 0 ? at(u, 0.66, 0.95) : 0;
  const ret = [[812, Y + 22], [812, 450], [119, 450], [119, Y + 54]];
  const bez = (q) => [0, 1].map((d) => (1 - q) ** 3 * ret[0][d] + 3 * (1 - q) ** 2 * q * ret[1][d] + 3 * (1 - q) * q * q * ret[2][d] + q ** 3 * ret[3][d]);
  const [fx, fy] = bez(fly);
  const step = (n) => at(t, 62.6 + n * 0.25, 63.4 + n * 0.25);
  const arrow = (x1, x2, n) => (
    <g opacity={step(n)}>
      <path d={`M${x1 + 4} ${Y}H${x2 - 6}`} stroke="#ffffff66" strokeWidth="1.3" {...draw(step(n))} />
      <path d={`M${x2 - 11} ${Y - 5}l5 5l-5 5`} stroke="#ffffff66" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
  const tok = inside(252, 350), tr = inside(392, 532);
  return (
    <g opacity={k}>
      <g opacity={step(0)}>
        <text x="28" y={Y - 62} className={s.fSmall} style={{ fill: DIM }}>text</text>
        <rect x="24" y={Y - 50} width="190" height="104" rx="10" stroke="#ffffff30" fill="#ffffff06" />
        {wrap(text, 19).map((line, i) => <text key={i} x="38" y={Y - 20 + i * 22} className={s.fMono} style={{ fontSize: 15 }}>{line}</text>)}
      </g>
      {arrow(214, 252, 1)}
      <g opacity={step(2)} filter={tok ? glow : undefined}>
        <rect x="252" y={Y - 30} width="98" height="60" rx="10" stroke={tok ? CYAN : "#ffffff38"} fill="#ffffff06" />
        {[0, 1, 2].map((n) => <rect key={n} x={268 + n * 23} y={Y - 14} width="19" height="12" rx="3" fill={TOKENS[n].c} fillOpacity=".45" />)}
        <text x="301" y={Y + 18} textAnchor="middle" className={s.fSmall}>tokenizer</text>
      </g>
      {arrow(350, 392, 3)}
      <g opacity={step(4)} filter={tr ? glow : undefined}>
        <rect x="392" y={Y - 50} width="140" height="100" rx="10" fill="#07080b" stroke={tr ? CYAN : "#ffffff30"} />
        <text x="462" y={Y + 7} textAnchor="middle" className={s.fChapter} style={{ fontSize: 22 }}>Transformer</text>
      </g>
      {arrow(532, 572, 5)}
      <g opacity={step(6)}>
        <text x="576" y={Y - 62} className={s.fSmall} style={{ fill: DIM }}>probabilities</text>
        {cur.cands.map(([w, p], i) => (
          <g key={i}>
            <text x="640" y={Y - 21 + i * 24} textAnchor="end" className={s.fSmall} style={{ fill: i === 0 && chosen > 0 ? "#fff" : undefined }}>{w}</text>
            <rect x="648" y={Y - 31 + i * 24} width={p * 105 * (run >= 0 ? bars : 0.4)} height="12" rx="3" fill={i === 0 ? CYAN : "#ffffff"} opacity={i === 0 ? 0.85 : 0.25} />
          </g>
        ))}
      </g>
      {arrow(718, 756, 7)}
      <g opacity={step(8)}>
        <text x="760" y={Y - 62} className={s.fSmall} style={{ fill: DIM }}>next token</text>
        <rect x="760" y={Y - 22} width="104" height="44" rx="8" stroke="#ffffff30" strokeDasharray="3 4" />
        {chosen > 0 && fly < 0.05 && (
          <g>
            <Chip x={812} y={Y - 15} label={cur.cands[0][0]} k={chosen} glow={glow} />
            <text x="812" y={Y + 6} textAnchor="middle" className={s.fMono} style={{ fontSize: 15 }} opacity={chosen}>{cur.cands[0][0]}</text>
          </g>
        )}
      </g>
      <g opacity={step(9)}>
        <path d={`M${ret[0].join(" ")}C${ret[1].join(" ")} ${ret[2].join(" ")} ${ret[3].join(" ")}`} stroke={CYAN} strokeOpacity=".45" strokeWidth="1.3" strokeDasharray="4 5" />
        <path d={`M114 ${Y + 61}l5 -7l5 7`} stroke={CYAN} strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round" />
        <text x="466" y="474" textAnchor="middle" className={s.fMath} style={{ fontSize: 16 }}>append, and run again</text>
      </g>
      {moving && <circle cx={px} cy={Y} r="4" fill={CYAN} filter={glow} />}
      {fly > 0.02 && fly < 0.99 && <text x={fx} y={fy + 5} textAnchor="middle" className={s.fMono} style={{ fontSize: 15, fill: "#fff" }} filter={glow}>{cur.cands[0][0]}</text>}
    </g>
  );
}

function Frame({ t }) {
  const glow = "url(#hlw-glow)";
  const typed = Math.floor(lin(t, 4.2, 6.4) * 18);
  const split = at(t, 8.2, 9.2);
  const tableK = inOut(t, 12.8, 13.6, 20, 21);
  const squeeze = at(t, 21, 22.6);

  // chapter heading
  const ch = [...CHAPTERS].reverse().find(([s0]) => t >= s0);
  const chK = ch ? clamp((t - ch[0]) / 0.5) : 0;

  return (
    <g>
      {ch && (
        <g opacity={chK}>
          <text x="40" y="58" className={s.fChapter}>{ch[1]}</text>
          <path d="M40 70h120" stroke={CYAN} strokeOpacity=".6" {...draw(chK)} />
        </g>
      )}

      {/* embedding table */}
      <g opacity={tableK}>
        <rect x="30" y="200" width="80" height="290" rx="4" stroke="#ffffff30" fill="#ffffff05" />
        {Array.from({ length: 36 }, (_, r) => <path key={r} d={`M34 ${206 + r * 7.9}h72`} stroke="#ffffff14" />)}
        <text x="70" y="508" textAnchor="middle" className={s.fSmall}>embedding table</text>
        <text x="70" y="522" textAnchor="middle" className={s.fSmall} style={{ fill: DIM }}>~200,000 rows</text>
      </g>

      {/* tokens: typed, then split into chips with IDs */}
      {TOKENS.map((tok, i) => {
        const chars = Math.max(0, typed - tok.off);
        const shown = tok.w.slice(0, chars);
        const k = at(t, 8.2 + i * 0.07, 9.2 + i * 0.07);
        const x = mix(X0 + tok.off * CW, TX[i] - (tok.w.length * CW) / 2, k);
        const box = at(t, 8.8 + i * 0.07, 9.8 + i * 0.07);
        const idK = at(t, 9.6 + i * 0.06, 10.8 + i * 0.06);
        const lead = tok.w[0] === "·";
        return (
          <g key={i} opacity={1 - at(t, 61.6, 62.4)}>
            <Chip x={TX[i]} label={tok.w} k={box} color={tok.c} />
            <text x={x} y="145" className={s.fMono}>
              {lead && <tspan style={{ fillOpacity: split * 0.5 }}>{shown.slice(0, 1)}</tspan>}
              {lead ? shown.slice(1) : shown}
            </text>
            <text x={TX[i]} y="172" textAnchor="middle" className={s.fSmall} style={{ fill: DIM }} opacity={idK}>{Math.round(tok.id * idK)}</text>
          </g>
        );
      })}
      <rect x={X0 + typed * CW + 2} y="126" width="2" height="24" fill={CYAN} opacity={t > 4 && t < 7.6 && Math.floor(t * 2.2) % 2 === 0 ? 0.9 : 0} />

      {/* ID → table row lookups, then each row flies out and stands up as a column */}
      {TOKENS.map((tok, i) => {
        const rowY = 206 + (tok.id / 200000) * 276;
        const line = inOut(t, 13.8 + i * 0.45, 14.4 + i * 0.45, 15.6 + i * 0.45, 16.2 + i * 0.45);
        const fly = at(t, 14.4 + i * 0.45, 15.5 + i * 0.45);
        const packed = mix(TX[i], 80 + i * 44, squeeze);
        const colX = i === 4 && t > 40 ? 250 : packed;
        const scaleLast = i === 4 && t > 40 ? 1.25 : mix(1, 0.8, squeeze);
        const colOp = i === 4 ? (1 - inOut(t, 38.4, 39.4, 40.6, 41.6)) * (1 - at(t, 52, 53)) : 1 - at(t, 38.4, 39.4);
        return (
          <g key={i}>
            {line > 0 && (
              <g>
                <path d={`M${TX[i]} 178C${TX[i]} 260 150 ${rowY} 110 ${rowY}`} stroke={CYAN} strokeOpacity=".55" strokeWidth="1.2" {...draw(line)} />
                <rect x="30" y={rowY - 3} width="80" height="6" fill={CYAN} opacity={line * 0.5} filter={glow} />
              </g>
            )}
            {fly > 0 && colOp > 0 && Array.from({ length: CELLS }, (_, j) => {
              const v = value(i, j, t);
              const flat = { x: 34 + j * 7.4, y: rowY - 2.5, w: 6.4, h: 5 };
              const col = { x: colX - 17 * scaleLast, y: COL_Y + j * ROW_H * scaleLast, w: 34 * scaleLast, h: 11 * scaleLast };
              const k = at(t, 14.4 + i * 0.45 + j * 0.03, 15.5 + i * 0.45 + j * 0.03);
              return <rect key={j} x={mix(flat.x, col.x, k)} y={mix(flat.y, col.y, k)} width={mix(flat.w, col.w, k)} height={mix(flat.h, col.h, k)} rx="2"
                fill={cellColor(v)} opacity={(0.2 + 0.8 * Math.abs(v)) * colOp} />;
            })}
          </g>
        );
      })}

      {/* position waves */}
      {TOKENS.map((_, i) => {
        const k = inOut(t, 17.9 + i * 0.1, 18.6 + i * 0.1, 19.3 + i * 0.1, 20 + i * 0.1);
        if (!k) return null;
        const drop = at(t, 19.1 + i * 0.1, 20 + i * 0.1) * 26;
        const d = Array.from({ length: 13 }, (_, n) => `${n ? "L" : "M"}${TX[i] - 18 + n * 3} ${181 + drop + 5 * Math.sin(n * 0.8 + i * 1.3)}`).join("");
        return <path key={i} d={d} stroke={YELLOW} strokeWidth="1.4" {...draw(k)} style={{ opacity: k }} />;
      })}
      <text x="610" y="186" className={s.fMath} opacity={inOut(t, 18, 18.6, 20, 20.6)}>+ position</text>

      <Stack t={t} glow={glow} />

      {/* final vector × unembedding matrix → logits */}
      {(() => {
        const label = inOut(t, 44, 44.6, 49.5, 50.3);
        const mat = inOut(t, 44.4, 45.4, 49.5, 50.5);
        const logits = at(t, 45.8, 47.2);
        const toProb = at(t, 49.6, 51);
        const settle = at(t, 51, 52.6);
        const topOnly = at(t, 55.4, 56);
        const renorm = at(t, 56.2, 57.4);
        const probsOut = at(t, 62, 62.8);
        return (
          <g>
            <g opacity={label}>
              <text x="250" y="186" textAnchor="middle" className={s.fSmall}>last vector</text>
              <text x="310" y="276" className={s.fMath}>×</text>
            </g>
            <g opacity={mat}>
              <rect x="336" y="196" width="250" height="136" rx="5" stroke="#ffffff38" fill="#ffffff06" />
              {Array.from({ length: 40 }, (_, n) => <path key={n} d={`M${344 + n * 6} 202v124`} stroke="#ffffff10" {...draw(at(t, 44.6 + n * 0.01, 45.4 + n * 0.01))} />)}
              <text x="461" y="352" textAnchor="middle" className={s.fSmall}>unembedding matrix · one column per token</text>
              <text x="610" y="276" className={s.fMath}>=</text>
            </g>
            {logits > 0 && Array.from({ length: 36 }, (_, n) => {
              const top = LOGIT_TOP[n];
              const logitLen = top !== undefined ? 150 - top * 10 : 30 + 70 * Math.abs(hash(n, 5));
              const probLen = top !== undefined ? CANDS[top][1] * 300 : 1.5;
              const len = mix(logitLen, probLen, toProb) * at(t, 45.8 + n * 0.02, 46.8 + n * 0.02);
              const y0 = 196 + n * 8;
              const y = top !== undefined ? mix(y0, 214 + top * 34, settle) : y0;
              const h = top !== undefined ? mix(5, 16, settle) : 5;
              const x = mix(650, 710, settle);
              const scale = mix(1, 1.6, settle);
              const kept = top === undefined || top < 3 ? 1 : 1 - 0.75 * topOnly;
              const op = (top === undefined ? 1 - settle : 1) * (1 - probsOut) * kept;
              const p = top !== undefined ? (top < 3 ? mix(CANDS[top][1], TOPK[top], renorm) : CANDS[top][1]) : 0;
              return (
                <g key={n} opacity={op}>
                  <rect x={x} y={y} width={len * scale} height={h} rx="2" fill={top === 0 ? CYAN : top !== undefined ? "#ffffffb0" : "#ffffff40"} />
                  {top !== undefined && settle > 0 && (
                    <g opacity={settle}>
                      <text x={x - 10} y={y + 12} textAnchor="end" className={s.fMono} style={{ fontSize: 14 }}>{CANDS[top][0]}</text>
                      <text x={x + len * scale + 8} y={y + 12} className={s.fSmall}>{Math.round(p * 100)}%</text>
                    </g>
                  )}
                </g>
              );
            })}
            <text x="650" y="506" className={s.fSmall} opacity={inOut(t, 46.6, 47.2, 50.8, 51.4)} style={{ fill: DIM }}>logits · one score for each of ~200,000 tokens</text>
            <text x="710" y="400" className={s.fSmall} opacity={at(t, 52.4, 53) * (1 - topOnly)} style={{ fill: DIM }}>everything else · 27%</text>
            <g opacity={at(t, 55.4, 56) * (1 - probsOut)}>
              <path d={`M646 ${206}h-8V${298}h8`} stroke={CYAN} strokeWidth="1.3" {...draw(at(t, 55.4, 56.2))} />
              <text x="628" y="258" textAnchor="end" className={s.fMath}>top-k, k = 3</text>
            </g>
          </g>
        );
      })()}

      {/* sampling: a weighted strip and a needle that settles on one token */}
      {(() => {
        const k = inOut(t, 57.4, 58.2, 62.6, 63.4);
        if (!k) return null;
        const x0 = 160, W = 640;
        const segs = TOPK.map((p, i) => [x0 + TOPK.slice(0, i).reduce((a, q) => a + q, 0) * W, p * W, i]);
        const u = lin(t, 58.4, 61);
        const target = x0 + 0.33 * W;
        const needle = Math.max(x0, Math.min(x0 + W, target + 300 * (1 - u) ** 2 * Math.sin(u * 16)));
        const won = at(t, 61, 61.5);
        return (
          <g opacity={k}>
            {segs.map(([sx, w, i]) => (
              <g key={i}>
                <rect x={sx + 1} y="440" width={w - 2} height="28" rx="5" fill={i === 0 ? CYAN : "#ffffff"} opacity={i === 0 ? 0.35 + won * 0.5 : 0.14} filter={i === 0 && won > 0 ? glow : undefined} />
                <text x={sx + w / 2} y="459" textAnchor="middle" className={s.fMono} style={{ fontSize: 13 }}>{CANDS[i][0]} {Math.round(TOPK[i] * 100)}%</text>
              </g>
            ))}
            <path d={`M${needle} 428v52`} stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${needle - 6} 422l6 7l6 -7z`} fill="#fff" />
          </g>
        );
      })()}

      <Loop t={t} glow={glow} />
    </g>
  );
}

export function PipelineFigure() {
  const [t, setT] = useState(START);
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const touched = useRef(false);

  // Autoplay once when the film scrolls into view, unless the reader prefers reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (!touched.current) setPlaying(true);
    }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      setT((v) => {
        const next = v + dt;
        if (next >= END) { setPlaying(false); return END; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const toggle = () => {
    touched.current = true;
    if (!playing && t >= END) setT(START);
    setPlaying((p) => !p);
  };
  const line = LINES.find(([a, b]) => t >= a && t < b) ?? (t >= END ? LINES[LINES.length - 1] : null);
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;

  return (
    <div className={s.film} ref={ref} style={{ "--serif": serif.style.fontFamily }}>
      <svg viewBox="0 0 960 540" className={s.screen} fill="none" role="img"
        aria-label="Animated film of one forward pass: the prompt 'The cat sat on the' is tokenized, embedded, passed through attention and MLP layers, the last vector is turned into probabilities, 'mat' is sampled and appended, and a second pass adds a full stop.">
        <defs>
          <filter id="hlw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <Frame t={t} />
      </svg>
      <p className={`${s.subtitle}`} aria-live="polite">{line ? line[2] : " "}</p>
      <div className={s.filmBar}>
        <button type="button" className={s.filmPlay} onClick={toggle} aria-label={playing ? "Pause" : t >= END ? "Replay" : "Play"}>
          {playing ? "❚❚" : t >= END ? "↺" : "▶"}
        </button>
        <input type="range" min={START} max={END} step="0.1" value={t} aria-label="Position in the animation"
          onChange={(e) => { touched.current = true; setT(Number(e.target.value)); }} style={{ "--p": `${((t - START) / (END - START)) * 100}%` }} />
        <span className={s.filmTime}>{fmt(t - START)} / {fmt(END - START)}</span>
      </div>
    </div>
  );
}
