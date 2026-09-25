"use client";

import { useEffect, useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./tokens-beyond-text.module.css";

/* ---------- Image → patches → one sequence with text ---------- */

// A small hand-drawn scene, used as the "photo" (illustrative).
const SCENE = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3b6e"/><stop offset="1" stop-color="#f59e8b"/></linearGradient></defs>
<rect width="160" height="160" fill="url(#g)"/><circle cx="112" cy="50" r="20" fill="#f9ca24"/>
<path d="M0 110 L40 70 L75 105 L105 78 L160 118 V160 H0Z" fill="#4b3f72"/>
<path d="M0 132 Q60 112 160 138 V160 H0Z" fill="#26de81"/>
<rect x="30" y="112" width="6" height="22" fill="#5b3a29"/><circle cx="33" cy="106" r="13" fill="#1e9e5a"/>
</svg>`)}`;

const G = 4; // 4 × 4 patches
const PATCHES = Array.from({ length: G * G }, (_, i) => ({ r: Math.floor(i / G), c: i % G }));
const TEXT = ["What", "·is", "·in", "·this", "·picture", "?"];
const color = (i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length];

function Patch({ r, c }) {
  return <span className={s.patchImg} style={{ backgroundImage: `url("${SCENE}")`, backgroundPosition: `${(c * 100) / (G - 1)}% ${(r * 100) / (G - 1)}%` }} />;
}

export function PatchSequence() {
  const [n, setN] = useState(0); // how many patches have joined the sequence
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setN((k) => Math.min(k + 1, G * G)), 380);
    return () => clearInterval(t);
  }, [playing]);
  if (playing && n >= G * G) setPlaying(false);

  const play = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(G * G); return; }
    if (n >= G * G) setN(0);
    setPlaying(true);
  };

  return (
    <div>
      <div className={s.controls}>
        <button type="button" className={`${s.btn} ${s.primary}`} onClick={play} disabled={playing}>{n >= G * G ? "Replay" : "Play"}</button>
        <button type="button" className={s.btn} onClick={() => { setPlaying(false); setN((k) => Math.min(k + 1, G * G)); }} disabled={n >= G * G}>Next patch</button>
        <button type="button" className={s.btn} onClick={() => { setPlaying(false); setN(0); }} disabled={n === 0}>Reset</button>
        <span className={s.status} aria-live="polite">{n} of {G * G} patches in the sequence</span>
      </div>

      <div className={s.stage}>
        <div className={s.imageWrap}>
          <span className={s.cap}>image, cut into a {G} × {G} grid</span>
          <div className={s.grid} role="img" aria-label="A small illustrated landscape divided into 16 square patches, numbered left to right, top to bottom.">
            {PATCHES.map((p, i) => (
              <span key={i} className={`${s.cell} ${i < n ? s.taken : ""} ${i === n - 1 ? s.current : ""}`}>
                <Patch {...p} />
                <small>{i + 1}</small>
              </span>
            ))}
          </div>
        </div>

        <div className={s.seqWrap}>
          <span className={s.cap}>one input sequence for the model</span>
          <ol className={s.seq} aria-label={`Sequence: ${TEXT.length} text tokens followed by ${n} image patch tokens`}>
            {TEXT.map((t, i) => (
              <li key={t} className={s.textTok} style={{ "--tc": color(i) }}>{t}</li>
            ))}
            <li className={s.marker}>&lt;image&gt;</li>
            {PATCHES.map((p, i) => (
              <li key={i} className={`${s.slot} ${i < n ? s.filled : ""}`}>
                {i < n && <Patch {...p} />}
                <small>{i + 1}</small>
              </li>
            ))}
            <li className={s.marker}>&lt;/image&gt;</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ---------- How many tokens does an image cost? ---------- */

const SIZES = [224, 448, 896];
const PATCH_SIZES = [14, 16, 32];

export function PatchCalculator() {
  const [size, setSize] = useState(224);
  const [patch, setPatch] = useState(16);
  const side = size / patch;
  const tokens = side * side;
  const numbers = patch * patch * 3;

  return (
    <div className={s.calc}>
      <div className={s.pickers}>
        <div role="group" aria-label="Image size in pixels">
          <span className={s.cap}>image size</span>
          <div className={s.controls}>
            {SIZES.map((v) => <button key={v} type="button" className={s.btn} aria-pressed={v === size} onClick={() => setSize(v)}>{v}×{v}</button>)}
          </div>
        </div>
        <div role="group" aria-label="Patch size in pixels">
          <span className={s.cap}>patch size</span>
          <div className={s.controls}>
            {PATCH_SIZES.map((v) => <button key={v} type="button" className={s.btn} aria-pressed={v === patch} onClick={() => setPatch(v)}>{v}×{v}</button>)}
          </div>
        </div>
      </div>

      <div className={s.calcBody}>
        <div
          className={s.miniGrid} style={{ "--n": side }} role="img"
          aria-label={`The image as a ${side} by ${side} grid of patches`}
        />
        <dl className={s.readout} aria-live="polite">
          <dt>patches per side</dt><dd>{size} ÷ {patch} = <b>{side}</b></dd>
          <dt>image tokens</dt><dd>{side} × {side} = <b>{tokens.toLocaleString("en-US")}</b></dd>
          <dt>numbers in one patch</dt><dd>{patch} × {patch} × 3 colours = <b>{numbers.toLocaleString("en-US")}</b></dd>
        </dl>
      </div>
    </div>
  );
}
