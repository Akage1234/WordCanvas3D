"use client";

import { useEffect, useId, useRef, useState } from "react";
import l from "./learn.module.css";

// One continuous shot of the pipeline: a prompt is typed, cut into tokens (real cl100k IDs), each token
// unfolds into an embedding, the embeddings drop into a plane of meaning, attention bends that plane and
// pulls context into the last token, its vector scores every candidate, top-k keeps three, one is sampled
// and appended. Then it fades and starts over.
const LOOP = 15;
const STILL = 13.8; // frame shown when motion is reduced

const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lin = (t, a, b) => clamp((t - a) / (b - a));
const at = (t, a, b) => ease(lin(t, a, b));
const mix = (a, b, k) => a + (b - a) * k;

const YELLOW = "#f5c451", CYAN = "#5ad0f5", GREEN = "#34d399", PURPLE = "#c4b5fd", PINK = "#f472b6";
const CW = 10.8; // width of one monospace character at 18px

const TOKENS = [
  { w: "the", id: 1820, c: YELLOW, p: [-3.2, 1.1], off: 0 },
  { w: "cat", id: 8415, c: CYAN, p: [1.7, 2.0], off: 4 },
  { w: "sat", id: 7731, c: GREEN, p: [2.9, -0.6], off: 8 },
  { w: "on", id: 389, c: PURPLE, p: [-0.8, -1.9], off: 12 },
  { w: "the", id: 279, c: YELLOW, p: [-2.6, 0.3], to: [1.1, 0.7], off: 15 },
];
const ATTN = [0.08, 0.46, 0.31, 0.15];
const NEXT = { w: "mat", id: 5634 };
const PROBS = [["mat", 0.41], ["floor", 0.18], ["sofa", 0.12], ["bed", 0.08], ["roof", 0.03]];
const SLOTS = [78, 174, 270, 366, 462, 562];
const X0 = 320 - (18 * CW) / 2;
const C = { x: 190, y: 204 };
const U = 25;
const ROW = (i) => 134 + i * 24;

const STAGES = [
  [2.3, "a prompt"],
  [3.9, "cut into tokens"],
  [5.4, "each token becomes a vector"],
  [6.8, "vectors live in a space of meaning"],
  [9.0, "attention pulls in context"],
  [11.0, "the last vector scores every word"],
  [11.5, "keep the top k"],
  [12.5, "sample one"],
  [LOOP, "append it, and go again"],
];

// Deterministic "embedding" values per token id, in [-1, 1].
const cell = (id, j) => {
  const s = Math.sin(id * 12.9898 + j * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

// The transformer as a smooth bend of space: a swirl around the origin plus a gentle shear.
function warp([x, y], k) {
  const a = k * 0.55 * Math.exp(-(x * x + y * y) / 20);
  const cs = Math.cos(a), sn = Math.sin(a);
  return [x * cs - y * sn + k * 0.12 * y, x * sn + y * cs];
}
const screen = ([x, y]) => [C.x + x * U, C.y - y * U];

function quad(p0, c, p1, s) {
  const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, d = s * s;
  return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
}

function gridPath(k) {
  const lines = [];
  for (let x = -5; x <= 5; x++) {
    const pts = [];
    for (let i = 0; i <= 16; i++) pts.push(screen(warp([x, -3 + (6 * i) / 16], k)));
    lines.push({ d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L"), axis: x === 0 });
  }
  for (let y = -3; y <= 3; y++) {
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push(screen(warp([-5 + (10 * i) / 20, y], k)));
    lines.push({ d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L"), axis: y === 0 });
  }
  return lines;
}

const draw = (k) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k, opacity: k > 0 ? 1 : 0 });

export default function PipelineAnim({ className, serif }) {
  const ref = useRef(null);
  const uid = useId().replace(/:/g, "");
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setT(STILL));
      return () => cancelAnimationFrame(raf);
    }
    let visible = true;
    let last = performance.now();
    let clock = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(ref.current);
    const tick = (now) => {
      if (visible) {
        clock = (clock + Math.min(now - last, 100) / 1000) % LOOP;
        setT(clock);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const serifStyle = { fontFamily: serif };
  const fade = 1 - at(t, 14.2, 14.9);
  const typed = Math.floor(lin(t, 0.3, 2.0) * 18);
  const bend = at(t, 6.8, 8.8);
  const gridIn = at(t, 4.8, 5.9);
  const gridDim = 1 - 0.55 * at(t, 9.8, 10.4);
  const beams = at(t, 6.9, 7.8) * (1 - at(t, 9.2, 9.8));
  const arrow = at(t, 9.0, 9.8);
  const proj = at(t, 9.7, 10.3);
  const head = at(t, 9.8, 10.3);
  const bracket = at(t, 11.0, 11.5);
  const flyK = at(t, 12.5, 13.3);
  const chipK = at(t, 13.0, 13.5);

  const dots = TOKENS.map((tok, i) => {
    const base = tok.to ? [mix(tok.p[0], tok.to[0], at(t, 7.6, 9.0)), mix(tok.p[1], tok.to[1], at(t, 7.6, 9.0))] : tok.p;
    const target = screen(warp(base, bend));
    const k = at(t, 5.4 + i * 0.09, 6.3 + i * 0.09);
    const from = [SLOTS[i], 128];
    return { k, x: mix(from[0], target[0], k), y: mix(from[1], target[1], k) - Math.sin(Math.PI * k) * 26 };
  });
  const lastDot = dots[4];

  const stageIdx = STAGES.findIndex(([end]) => t < end);
  const stageStart = stageIdx ? STAGES[stageIdx - 1][0] : 0;
  const captionOp = clamp((t - stageStart) / 0.35) * clamp((STAGES[stageIdx][0] - t) / 0.35 + (stageIdx === STAGES.length - 1 ? 1 : 0));

  const sample = lin(t, 11.5, 12.4);
  const picked = Math.floor((1 - (1 - sample) ** 2) * 9 + 1e-6) % 3;
  const matStart = [424, ROW(0) + 4];
  const matEnd = [SLOTS[5], 46];
  const matPos = [mix(matStart[0], matEnd[0], flyK), mix(matStart[1], matEnd[1], flyK) - Math.sin(Math.PI * flyK) * 40];
  const cursorX = t < 13.3 ? X0 + typed * CW + 2 : SLOTS[5] + 29;
  const cursorOn = (t < 2.1 || t > 13.4) && Math.floor(t * 2.2) % 2 === 0;

  return (
    <svg ref={ref} className={className} viewBox="0 0 640 300" fill="none" role="img"
      aria-label="Animation: the prompt 'the cat sat on the' is split into tokens, each becomes a vector in a space of meaning, attention pulls context into the last token, its vector scores every possible next word, the top three are kept and 'mat' is sampled and appended.">
      <defs>
        <filter id={`g${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`v${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={CYAN} stopOpacity=".16" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g opacity={fade}>
        {/* plane of meaning */}
        <ellipse cx={C.x} cy={C.y} rx="150" ry="90" fill={`url(#v${uid})`} opacity={gridIn * (0.4 + beams * 0.6)} />
        <g strokeLinecap="round" opacity={gridDim}>
          {gridPath(bend).map((g, i) => (
            <path key={i} d={g.d} stroke={g.axis ? "#ffffff59" : "#ffffff17"} strokeWidth={g.axis ? 1.1 : 0.8} {...draw(at(t, 4.8 + i * 0.03, 5.9 + i * 0.03) * gridIn)} />
          ))}
        </g>

        {/* attention beams from every earlier token into the last one */}
        {beams > 0 && dots.slice(0, 4).map((d, i) => {
          const c = [(d.x + lastDot.x) / 2, Math.min(d.y, lastDot.y) - 34];
          const w = ATTN[i];
          const pulses = t > 7.3 && t < 9.4 ? [0, 1, 2].map((j) => quad([d.x, d.y], c, [lastDot.x, lastDot.y], (t * 0.8 + j / 3 + i * 0.1) % 1)) : [];
          return (
            <g key={i} opacity={beams}>
              <path d={`M${d.x} ${d.y}Q${c[0]} ${c[1]} ${lastDot.x} ${lastDot.y}`} stroke={TOKENS[i].c} strokeOpacity={0.25 + w * 1.4} strokeWidth={0.6 + w * 5} strokeLinecap="round" {...draw(at(t, 6.9 + i * 0.1, 7.8 + i * 0.1))} />
              {pulses.map(([px, py], j) => <circle key={j} cx={px} cy={py} r={1.2 + w * 3} fill={TOKENS[i].c} filter={`url(#g${uid})`} />)}
            </g>
          );
        })}
        <text x="64" y="112" className={l.animMath} style={{ ...serifStyle, opacity: at(t, 7.0, 7.6) * (1 - at(t, 9.0, 9.5)) }}>softmax(QKᵀ/√d) V</text>

        {/* the final vector */}
        {arrow > 0 && (() => {
          const ang = Math.atan2(lastDot.y - C.y, lastDot.x - C.x);
          const end = [lastDot.x - 8 * Math.cos(ang), lastDot.y - 8 * Math.sin(ang)];
          const tip = [mix(C.x, end[0], arrow), mix(C.y, end[1], arrow)];
          const h = (s) => [tip[0] - 9 * Math.cos(ang + s), tip[1] - 9 * Math.sin(ang + s)];
          return (
            <g stroke={CYAN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#g${uid})`}>
              <path d={`M${C.x} ${C.y}L${tip[0]} ${tip[1]}`} />
              <path d={`M${h(0.45).join(" ")}L${tip.join(" ")}L${h(-0.45).join(" ")}`} />
            </g>
          );
        })()}
        {proj > 0 && (
          <path d={`M${lastDot.x + 6} ${lastDot.y}C${lastDot.x + 70} ${lastDot.y} 330 ${ROW(2)} 372 ${ROW(2)}`} stroke={CYAN} strokeOpacity=".5" strokeWidth="1" {...draw(proj)} />
        )}

        {/* dots and their labels */}
        {dots.map((d, i) => d.k > 0 && (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={i === 4 ? 5 + beams * 1.5 : 4} fill={TOKENS[i].c} filter={`url(#g${uid})`} />
            {i === 4 && <circle cx={d.x} cy={d.y} r={5 + beams * 1.5} fill={CYAN} opacity={at(t, 7.6, 9.0)} />}
            <text x={d.x + 8} y={d.y + (i === 0 ? -6 : 4)} className={l.animLabel} opacity={d.k * (1 - 0.4 * at(t, 9.8, 10.4))}>{TOKENS[i].w}</text>
          </g>
        ))}

        {/* embedding columns */}
        {TOKENS.map((tok, i) => {
          const collapse = dots[i].k;
          if (t < 3.9 || collapse >= 1) return null;
          return Array.from({ length: 8 }, (_, j) => {
            const v = cell(tok.id, j);
            const grow = at(t, 3.9 + j * 0.07 + i * 0.06, 4.4 + j * 0.07 + i * 0.06);
            const y = mix(84 + j * 11, 128, collapse);
            return (
              <rect key={`${i}-${j}`} x={SLOTS[i] - 13 * grow * (1 - collapse)} y={y} width={26 * grow * (1 - collapse)} height={9 * (1 - collapse * 0.6)} rx="2"
                fill={v > 0 ? CYAN : PINK} opacity={(0.18 + 0.82 * Math.abs(v)) * grow} />
            );
          });
        })}

        {/* prompt, then tokens */}
        {TOKENS.map((tok, i) => {
          const k = at(t, 2.3 + i * 0.07, 3.2 + i * 0.07);
          const shown = tok.w.slice(0, Math.max(0, typed - tok.off));
          const x = mix(X0 + tok.off * CW, SLOTS[i] - (tok.w.length * CW) / 2, k);
          const box = at(t, 2.7 + i * 0.07, 3.5 + i * 0.07);
          const idK = at(t, 3.1 + i * 0.05, 3.8 + i * 0.05);
          const w = tok.w.length * CW + 22;
          return (
            <g key={i}>
              <rect x={SLOTS[i] - w / 2} y="27" width={w} height="28" rx="7" stroke={tok.c} strokeWidth="1.4" fill={tok.c} fillOpacity={0.08 * box} {...draw(box)} />
              <text x={x} y="46" className={l.animMono}>{shown}</text>
              <text x={SLOTS[i]} y="72" textAnchor="middle" className={l.animId} opacity={idK * (1 - at(t, 5.2, 5.6) * 0.65)}>{Math.round(tok.id * idK)}</text>
            </g>
          );
        })}
        <rect x={cursorX} y="30" width="2" height="21" fill={CYAN} opacity={cursorOn ? 0.9 : 0} />

        {/* next-token distribution */}
        <text x="372" y="112" className={l.animMath} style={{ ...serifStyle, opacity: head }}>P( next | the cat sat on the )</text>
        {PROBS.map(([w, p], i) => {
          const grow = at(t, 10.0 + i * 0.08, 10.9 + i * 0.08);
          const dim = i > 2 ? 1 - 0.7 * bracket : 1;
          const y = ROW(i);
          const chosen = t > 12.4 && i === 0;
          return (
            <g key={w} opacity={(grow > 0 ? 1 : 0) * dim}>
              <text x="438" y={y + 4} textAnchor="end" className={l.animLabel} style={{ fill: chosen ? "#fff" : undefined, opacity: i === 0 ? 1 - flyK * 0.7 : 1 }}>{w}</text>
              <rect x="446" y={y - 6} width={Math.max(0, p * 370 * grow)} height="11" rx="3" fill={i === 0 ? CYAN : "#ffffff"} opacity={i === 0 ? 0.85 : 0.22} />
              <text x={452 + p * 370 * grow} y={y + 4} className={l.animId} opacity={grow}>{Math.round(p * 100 * grow)}%</text>
            </g>
          );
        })}
        <g stroke={CYAN} strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round">
          <path d={`M384 ${ROW(0) - 10}h-6V${ROW(2) + 10}h6`} {...draw(bracket)} />
        </g>
        <text x="370" y={ROW(1) + 5} textAnchor="end" className={l.animMath} style={{ ...serifStyle, opacity: bracket }}>k = 3</text>
        {t > 11.5 && t < 13.2 && (
          <rect x="390" y={ROW(picked) - 11} width="240" height="21" rx="7" fill="#ffffff0d" stroke={CYAN} strokeOpacity=".55" opacity={1 - at(t, 12.8, 13.2)} />
        )}

        {/* the sampled token flies up and joins the prompt */}
        {flyK > 0 && <text x={matPos[0]} y={matPos[1]} textAnchor="middle" className={l.animMono} style={{ fill: "#fff" }} filter={chipK < 1 ? `url(#g${uid})` : undefined}>{NEXT.w}</text>}
        <rect x={SLOTS[5] - 27.2} y="27" width="54.4" height="28" rx="7" stroke={CYAN} strokeWidth="1.5" fill={CYAN} fillOpacity={0.14 * chipK} filter={`url(#g${uid})`} {...draw(chipK)} />
        <text x={SLOTS[5]} y="72" textAnchor="middle" className={l.animId} opacity={at(t, 13.3, 13.8)}>{NEXT.id}</text>
      </g>

      <text x="632" y="292" textAnchor="end" className={l.animCaption} style={{ ...serifStyle, opacity: captionOp * fade }}>{STAGES[stageIdx][1]}</text>
      <text x="632" y="266" textAnchor="end" className={l.animStep} style={{ opacity: fade }}>{String(stageIdx + 1).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")}</text>
    </svg>
  );
}
