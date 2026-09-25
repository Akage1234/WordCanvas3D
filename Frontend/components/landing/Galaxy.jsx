"use client";
import { useEffect, useRef } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { rng, gauss } from "./random";
import styles from "./landing.module.css";

const WORDS = [
  ["king", "queen", "royal"], ["paris", "london", "tokyo"], ["winter", "january", "season"], ["travel", "journey", "arrive"],
  ["music", "piano", "song"], ["happy", "hope", "calm"], ["doctor", "health", "care"], ["river", "ocean", "forest"],
];

// Illustrative only: clusters wound into spiral arms, not real embedding data.
function buildStars() {
  const r = rng(11);
  const arms = WORDS.length;
  const stars = [];
  const named = [];
  const armPoint = (c, rad, spread) => {
    const a = (c / arms) * Math.PI * 2 + rad * 2.4 + (gauss(r) * spread) / (rad + 0.4);
    return [Math.cos(a) * rad, gauss(r) * 0.06 * (1.8 - rad), Math.sin(a) * rad];
  };
  for (let c = 0; c < arms; c++) {
    for (let k = 0; k < 420; k++) {
      const rad = 0.18 + Math.pow(r(), 0.75) * 1.5;
      stars.push({ p: armPoint(c, rad, 0.12), c, s: r() * 0.9 + 0.4, ph: r() * 6.28 });
    }
    WORDS[c].forEach((w, i) => {
      const pt = { p: armPoint(c, 0.55 + i * 0.38, 0.04), c, s: 1.6, ph: 0, w };
      stars.push(pt);
      named.push(pt);
    });
  }
  for (let k = 0; k < 900; k++) {
    const rad = Math.abs(gauss(r)) * 0.22;
    const a = r() * Math.PI * 2;
    stars.push({ p: [Math.cos(a) * rad, gauss(r) * 0.05, Math.sin(a) * rad], c: -1, s: r() * 0.8 + 0.3, ph: r() * 6.28 });
  }
  for (let k = 0; k < 500; k++) stars.push({ p: [gauss(r) * 1.3, gauss(r) * 0.35, gauss(r) * 1.3], c: k % arms, s: r() * 0.6 + 0.2, ph: r() * 6.28 });
  return { stars, named };
}

export default function Galaxy() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { stars, named } = buildStars();
    let W = 0, H = 0, yaw = 0, pitch = 0.95, drag = null, raf = 0, visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const b = canvas.getBoundingClientRect();
      W = b.width; H = b.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const project = ([x, y, z]) => {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const f = (Math.min(W, H * 1.4) * 1.15) / (z2 + 3.2);
      return [W / 2 + x1 * f, H / 2 + y1 * f, z2, f];
    };
    const label = (pt, s) => {
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#05070d";
      ctx.strokeText(pt.w, s[0] + 7, s[1]);
      ctx.fillStyle = "#ffffffcc";
      ctx.fillText(pt.w, s[0] + 7, s[1]);
    };
    const draw = (t) => {
      if (!drag && !reduced) yaw += 0.0012;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const st of stars) {
        const s = project(st.p);
        const depth = Math.max(0.12, Math.min(1, 1.1 - s[2] * 0.45));
        const twinkle = reduced ? 1 : 0.75 + 0.25 * Math.sin(t / 700 + st.ph);
        const size = Math.max(0.8, s[3] * 0.006 * st.s);
        ctx.fillStyle = st.c < 0 ? "#cfe8ff" : CLUSTER_COLORS[st.c];
        ctx.globalAlpha = depth * twinkle * (st.c < 0 ? 0.5 : 0.75);
        ctx.fillRect(s[0] - size / 2, s[1] - size / 2, size, size);
        if (st.s > 1.15) {
          ctx.globalAlpha = depth * 0.07;
          ctx.fillRect(s[0] - size * 2.5, s[1] - size * 2.5, size * 5, size * 5);
        }
      }
      const core = project([0, 0, 0]);
      const g = ctx.createRadialGradient(core[0], core[1], 0, core[0], core[1], core[3] * 0.45);
      g.addColorStop(0, "#9fdcff33");
      g.addColorStop(1, "#9fdcff00");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      for (const pt of named) {
        const s = project(pt.p);
        if (s[2] > 0.9) continue;
        ctx.globalAlpha = Math.max(0, Math.min(1, 0.9 - s[2] * 0.6));
        label(pt, s);
      }
      ctx.globalAlpha = 1;
      raf = visible && !reduced ? requestAnimationFrame(draw) : 0;
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(draw); };

    const ro = new ResizeObserver(() => { resize(); if (reduced) draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); });
    io.observe(canvas);
    const down = (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); };
    const move = (e) => {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.006;
      pitch = Math.max(0.2, Math.min(1.45, pitch + (e.clientY - drag.y) * 0.005));
      drag = { x: e.clientX, y: e.clientY };
      if (reduced) draw(0);
    };
    const up = () => { drag = null; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    resize();
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div className={styles.galaxy}>
      <canvas ref={ref} aria-label="A slowly rotating galaxy of words, coloured by cluster" role="img" />
    </div>
  );
}
