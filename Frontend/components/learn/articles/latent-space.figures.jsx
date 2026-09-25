"use client";

import { useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./latent-space.module.css";

const [RED, TEAL] = CLUSTER_COLORS;

// Real GloVe data, computed offline. For 11 evenly spaced points on the straight line from word A to word B
// (each point rescaled to length 1): [cosine to A, cosine to B, four nearest other words with cosine].
const PATHS = [["village","city",[[1.0,0.514,[["villages",0.744],["town",0.73],["nearby",0.627],["near",0.611]]],[0.996,0.589,[["town",0.761],["villages",0.746],["nearby",0.653],["near",0.638]]],[0.982,0.665,[["town",0.789],["villages",0.742],["nearby",0.675],["area",0.662]]],[0.958,0.74,[["town",0.81],["villages",0.73],["nearby",0.691],["area",0.689]]],[0.92,0.809,[["town",0.823],["area",0.709],["villages",0.708],["nearby",0.7]]],[0.87,0.87,[["town",0.825],["area",0.72],["nearby",0.7],["near",0.694]]],[0.809,0.92,[["town",0.817],["area",0.723],["cities",0.719],["residents",0.698]]],[0.74,0.958,[["town",0.8],["cities",0.747],["area",0.716],["where",0.703]]],[0.665,0.982,[["town",0.774],["cities",0.765],["area",0.702],["where",0.7]]],[0.589,0.996,[["cities",0.775],["town",0.742],["downtown",0.704],["where",0.69]]],[0.514,1.0,[["cities",0.777],["town",0.706],["downtown",0.702],["where",0.675]]]]],["hot","cold",[[1.0,0.617,[["cool",0.669],["heat",0.623],["warm",0.602],["dry",0.563]]],[0.997,0.679,[["cool",0.691],["heat",0.637],["warm",0.632],["dry",0.589]]],[0.986,0.741,[["cool",0.71],["warm",0.659],["heat",0.648],["dry",0.612]]],[0.966,0.799,[["cool",0.724],["warm",0.682],["heat",0.654],["dry",0.632]]],[0.937,0.853,[["cool",0.731],["warm",0.7],["heat",0.655],["dry",0.647]]],[0.899,0.899,[["cool",0.732],["warm",0.711],["dry",0.656],["heat",0.649]]],[0.853,0.937,[["cool",0.727],["warm",0.716],["dry",0.659],["heat",0.638]]],[0.799,0.966,[["warm",0.714],["cool",0.714],["dry",0.656],["temperatures",0.625]]],[0.741,0.986,[["warm",0.706],["cool",0.696],["dry",0.647],["temperatures",0.621]]],[0.679,0.997,[["warm",0.694],["cool",0.674],["dry",0.634],["temperatures",0.613]]],[0.617,1.0,[["warm",0.677],["cool",0.648],["dry",0.617],["temperatures",0.601]]]]],["sea","mountain",[[1.0,0.4,[["ocean",0.732],["seas",0.718],["waters",0.717],["mediterranean",0.634]]],[0.995,0.487,[["ocean",0.735],["waters",0.717],["seas",0.713],["coast",0.644]]],[0.979,0.579,[["ocean",0.731],["waters",0.709],["seas",0.7],["coast",0.65]]],[0.948,0.671,[["ocean",0.717],["waters",0.69],["seas",0.677],["coast",0.647]]],[0.901,0.759,[["mountains",0.695],["ocean",0.691],["waters",0.66],["seas",0.642]]],[0.837,0.837,[["mountains",0.746],["ocean",0.653],["waters",0.618],["coastal",0.611]]],[0.759,0.901,[["mountains",0.784],["slopes",0.629],["ocean",0.603],["snow",0.601]]],[0.671,0.948,[["mountains",0.808],["slopes",0.652],["mountainous",0.615],["snow",0.614]]],[0.579,0.979,[["mountains",0.819],["slopes",0.664],["mount",0.626],["alpine",0.62]]],[0.487,0.995,[["mountains",0.819],["slopes",0.667],["mount",0.633],["alpine",0.629]]],[0.4,1.0,[["mountains",0.811],["slopes",0.663],["mount",0.633],["alpine",0.63]]]]],["king","queen",[[1.0,0.696,[["prince",0.673],["kingdom",0.651],["monarch",0.639],["throne",0.634]]],[0.997,0.747,[["prince",0.679],["monarch",0.657],["kingdom",0.656],["throne",0.642]]],[0.989,0.797,[["prince",0.68],["monarch",0.673],["kingdom",0.657],["throne",0.645]]],[0.973,0.843,[["monarch",0.684],["prince",0.677],["kingdom",0.654],["throne",0.645]]],[0.951,0.885,[["monarch",0.691],["prince",0.67],["kingdom",0.646],["royal",0.645]]],[0.921,0.921,[["monarch",0.694],["prince",0.657],["elizabeth",0.657],["royal",0.653]]],[0.885,0.951,[["monarch",0.691],["elizabeth",0.675],["princess",0.663],["royal",0.656]]],[0.843,0.973,[["elizabeth",0.687],["monarch",0.684],["princess",0.673],["royal",0.655]]],[0.797,0.989,[["elizabeth",0.695],["princess",0.678],["monarch",0.672],["royal",0.65]]],[0.747,0.997,[["elizabeth",0.698],["princess",0.679],["monarch",0.657],["royal",0.641]]],[0.696,1.0,[["elizabeth",0.697],["princess",0.676],["monarch",0.638],["royal",0.629]]]]],["walk","run",[[1.0,0.586,[["walking",0.797],["walked",0.722],["walks",0.709],["go",0.651]]],[0.996,0.652,[["walking",0.794],["walked",0.724],["walks",0.71],["go",0.679]]],[0.985,0.718,[["walking",0.784],["walked",0.72],["walks",0.705],["go",0.704]]],[0.964,0.781,[["walking",0.766],["go",0.724],["walked",0.71],["walks",0.693]]],[0.932,0.839,[["walking",0.741],["go",0.738],["runs",0.709],["going",0.698]]],[0.89,0.89,[["go",0.744],["runs",0.741],["going",0.71],["running",0.708]]],[0.839,0.932,[["runs",0.765],["go",0.743],["running",0.737],["out",0.714]]],[0.781,0.964,[["runs",0.781],["running",0.758],["go",0.734],["out",0.718]]],[0.718,0.985,[["runs",0.789],["running",0.77],["go",0.719],["ran",0.715]]],[0.652,0.996,[["runs",0.79],["running",0.776],["ran",0.723],["out",0.705]]],[0.586,1.0,[["runs",0.785],["running",0.775],["ran",0.725],["out",0.692]]]]],["day","night",[[1.0,0.722,[["days",0.837],["week",0.817],["month",0.775],["morning",0.747]]],[0.997,0.769,[["days",0.848],["week",0.827],["month",0.778],["morning",0.768]]],[0.989,0.815,[["days",0.854],["week",0.833],["morning",0.786],["month",0.777]]],[0.975,0.857,[["days",0.855],["week",0.834],["morning",0.8],["weekend",0.783]]],[0.955,0.895,[["days",0.852],["week",0.83],["morning",0.809],["weekend",0.79]]],[0.928,0.928,[["days",0.843],["week",0.821],["morning",0.814],["evening",0.801]]],[0.895,0.955,[["days",0.828],["morning",0.813],["evening",0.812],["saturday",0.807]]],[0.857,0.975,[["evening",0.818],["saturday",0.811],["days",0.808],["morning",0.807]]],[0.815,0.989,[["evening",0.818],["saturday",0.81],["morning",0.796],["sunday",0.79]]],[0.769,0.997,[["evening",0.815],["saturday",0.805],["sunday",0.783],["morning",0.781]]],[0.722,1.0,[["evening",0.807],["saturday",0.796],["sunday",0.772],["morning",0.763]]]]]];

function Bar({ word, c, tc, strong }) {
  return (
    <li className={strong ? s.strong : undefined} style={{ "--tc": tc, "--w": c }}>
      <span>{word}</span><i /><small>{c.toFixed(2)}</small>
    </li>
  );
}

export function WalkBetween() {
  const [p, setP] = useState(0);
  const [step, setStep] = useState(5);
  const [a, b, steps] = PATHS[p];
  const [ca, cb, others] = steps[step];
  const t = step / 10;

  return (
    <div className={s.walk}>
      <div className={s.pairs} role="group" aria-label="Choose a pair of words">
        {PATHS.map(([x, y], i) => (
          <button key={x} type="button" aria-pressed={i === p} onClick={() => setP(i)}>{x} → {y}</button>
        ))}
      </div>

      <svg viewBox="0 0 400 44" aria-hidden="true" className={s.track}>
        <line x1="20" y1="22" x2="380" y2="22" />
        <circle cx="20" cy="22" r="6" fill={TEAL} />
        <circle cx="380" cy="22" r="6" fill={RED} />
        <circle cx={20 + t * 360} cy="22" r="8" className={s.cursor} />
      </svg>
      <label className={s.slider}>
        <span style={{ color: TEAL }}>{a}</span>
        <input
          type="range" min="0" max="10" step="1" value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          aria-valuetext={`${Math.round((1 - t) * 100)}% ${a}, ${Math.round(t * 100)}% ${b}`}
        />
        <span style={{ color: RED }}>{b}</span>
      </label>
      <p className={s.mix}>{Math.round((1 - t) * 100)}% {a} + {Math.round(t * 100)}% {b}</p>

      <div className={s.cols}>
        <div>
          <h3>The two ends</h3>
          <ol className={s.bars}>
            <Bar word={a} c={ca} tc={TEAL} />
            <Bar word={b} c={cb} tc={RED} />
          </ol>
        </div>
        <div>
          <h3>Nearest other words</h3>
          <ol className={s.bars}>
            {others.map(([w, c], i) => <Bar key={w} word={w} c={c} tc="#cfd8e6" strong={i === 0} />)}
          </ol>
        </div>
      </div>
    </div>
  );
}
