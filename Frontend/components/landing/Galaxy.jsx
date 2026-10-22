"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
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
    stars.push({ p: [Math.cos(a) * rad, gauss(r) * 0.05, Math.sin(a) * rad], c: rad < 0.07 ? -3 : rad < 0.16 ? -2 : -1, s: r() * 0.8 + 0.3, ph: r() * 6.28 });
  }
  for (let k = 0; k < 500; k++) stars.push({ p: [gauss(r) * 1.3, gauss(r) * 0.35, gauss(r) * 1.3], c: k % arms, s: r() * 0.6 + 0.2, ph: r() * 6.28 });
  // Soft coloured clouds along each arm. Their own random stream, so the stars and words above don't move.
  const n = rng(29);
  const nebula = [];
  for (let c = 0; c < arms; c++) {
    for (let k = 0; k < 14; k++) {
      const rad = 0.28 + k * 0.095 + n() * 0.05;
      const a = (c / arms) * Math.PI * 2 + rad * 2.4 + (gauss(n) * 0.05) / (rad + 0.4);
      nebula.push({ p: [Math.cos(a) * rad, 0, Math.sin(a) * rad], c, s: 0.16 + n() * 0.14, a: 0.1 + n() * 0.08 });
    }
    // Bright knots along the arm's spine, like star-forming regions.
    for (let k = 0; k < 18; k++) {
      const rad = 0.3 + n() * 1.25;
      const a = (c / arms) * Math.PI * 2 + rad * 2.4 + (gauss(n) * 0.04) / (rad + 0.4);
      nebula.push({ p: [Math.cos(a) * rad, gauss(n) * 0.02, Math.sin(a) * rad], c, s: 0.04 + n() * 0.05, a: 0.3 + n() * 0.25 });
    }
  }
  // Arms brighten towards the centre: about 1.3x near the core, 0.5x at the rim.
  for (const o of [...stars, ...nebula]) o.f = Math.max(0.5, Math.min(1.3, 1.5 - Math.hypot(o.p[0], o.p[2]) * 0.65));
  return { stars, named, nebula };
}

// Core star colours by distance from the centre (c = -3, -2, -1): warm white in the bulge, cool blue outside it.
const CORE = { "-3": "#ffe2b8", "-2": "#fff3e2", "-1": "#cfe8ff" };
const colorOf = (c) => (c < 0 ? CORE[c] : CLUSTER_COLORS[c]);

// A soft round glow, drawn once per colour; stamping it with drawImage is far cheaper than a gradient per frame.
function sprite(color) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color + "99");
  grad.addColorStop(1, color + "00");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export default function Galaxy() {
  const t = useTranslations("Home");
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { stars, named, nebula } = buildStars();
    const glow = Object.fromEntries([...CLUSTER_COLORS.map((_, i) => i), -1, -2, -3].map((c) => [c, sprite(colorOf(c))]));
    const halo = { violet: sprite("#7c6cff"), warm: sprite("#ffd59a"), hot: sprite("#ffffff") };
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
      for (const nb of nebula) {
        const s = project(nb.p);
        const depth = Math.max(0.2, Math.min(1, 1.1 - s[2] * 0.45));
        const d = s[3] * nb.s;
        ctx.globalAlpha = Math.min(1, nb.a * depth * nb.f);
        ctx.drawImage(glow[nb.c], s[0] - d / 2, s[1] - d / 2, d, d);
      }
      for (const st of stars) {
        const s = project(st.p);
        const depth = Math.max(0.12, Math.min(1, 1.1 - s[2] * 0.45));
        const twinkle = reduced ? 1 : 0.75 + 0.25 * Math.sin(t / 700 + st.ph);
        const size = Math.max(st.c < 0 ? 0.8 : 1, s[3] * (st.c < 0 ? 0.006 : 0.0072) * st.s);
        ctx.fillStyle = colorOf(st.c);
        ctx.globalAlpha = Math.min(1, depth * twinkle * (st.c < 0 ? 0.55 : st.f));
        ctx.fillRect(s[0] - size / 2, s[1] - size / 2, size, size);
        if (st.s > 1.24) { // the brightest ~7% (and every named word) get a glow
          const d = size * 7;
          ctx.globalAlpha = depth * twinkle * 0.3;
          ctx.drawImage(glow[st.c], s[0] - d / 2, s[1] - d / 2, d, d);
        }
      }
      // Core: a violet halo, a warm bulge and a hot centre, squashed to the disk's current tilt.
      const core = project([0, 0, 0]);
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const flat = Math.abs(project([sy * 0.5, 0, cy * 0.5])[1] - project([-sy * 0.5, 0, -cy * 0.5])[1]) /
        Math.max(1, Math.abs(project([cy * 0.5, 0, -sy * 0.5])[0] - project([-cy * 0.5, 0, sy * 0.5])[0]));
      const pulse = reduced ? 1 : 0.94 + 0.06 * Math.sin(t / 1400);
      ctx.save();
      ctx.translate(core[0], core[1]);
      ctx.scale(1, Math.max(0.2, flat));
      for (const [img, r, a] of [[halo.violet, 1.6, 0.3], [halo.warm, 0.7, 0.6], [halo.hot, 0.24, 1]]) {
        const d = core[3] * r;
        ctx.globalAlpha = a * pulse;
        ctx.drawImage(img, -d / 2, -d / 2, d, d);
      }
      ctx.restore();
      const glare = core[3] * 0.12;
      ctx.globalAlpha = pulse;
      ctx.drawImage(halo.hot, core[0] - glare / 2, core[1] - glare / 2, glare, glare);
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
      <canvas ref={ref} aria-label={t("galaxyLabel")} role="img" />
    </div>
  );
}
