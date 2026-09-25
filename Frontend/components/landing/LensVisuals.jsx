"use client";
import { useEffect, useRef, useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { hash, rng, gauss } from "./random";
import styles from "./landing.module.css";

const SPLITS = [["un", "believ", "able"], ["straw", "berry"], ["token", "ization"], ["Word", "Canvas", "3", "D"]];

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TokenSplit() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const id = setInterval(() => setN((v) => v + 1), 2400);
    return () => clearInterval(id);
  }, []);
  const parts = SPLITS[n % SPLITS.length];
  return (
    <>
      <div className={styles.tkWord}>
        {parts.map((p, i) => {
          const c = CLUSTER_COLORS[(i * 3 + 3) % CLUSTER_COLORS.length];
          return <span key={`${n}-${i}`} style={{ background: `${c}55`, boxShadow: `inset 0 -2px 0 ${c}` }}>{p}</span>;
        })}
      </div>
      <div className={styles.tkIds}>{parts.map((p) => hash(p) % 100000).join("  ·  ")}</div>
    </>
  );
}

export function MiniClusters() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = reducedMotion();
    const r = rng(3);
    const pts = [];
    [[90, 80], [180, 130], [270, 75], [130, 160], [250, 160]].forEach(([cx, cy], ci) => {
      for (let k = 0; k < 26; k++) pts.push({ x: cx + gauss(r) * 22, y: cy + gauss(r) * 18, c: [1, 4, 0, 3, 2][ci], ph: r() * 6 });
    });
    const edges = [];
    pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && a.c === b.c && Math.hypot(a.x - b.x, a.y - b.y) < 24) edges.push([a, b]); }));
    let raf = 0, visible = false;
    const draw = (t) => {
      ctx.clearRect(0, 0, 360, 210);
      const at = (p) => reduced ? [p.x, p.y] : [p.x + Math.sin(t / 900 + p.ph) * 1.6, p.y + Math.cos(t / 1100 + p.ph) * 1.6];
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        const [ax, ay] = at(a), [bx, by] = at(b);
        ctx.strokeStyle = `${CLUSTER_COLORS[a.c]}55`;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      for (const p of pts) {
        const [x, y] = at(p);
        ctx.fillStyle = CLUSTER_COLORS[p.c];
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      raf = visible && !reduced ? requestAnimationFrame(draw) : 0;
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); });
    io.observe(canvas);
    draw(0);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  return <canvas ref={ref} width={360} height={210} aria-hidden="true" />;
}

export function VectorMath() {
  const marker = (id, color) => (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0L10 5L0 10z" fill={color} />
    </marker>
  );
  return (
    <svg className={styles.vm} viewBox="0 0 360 210" aria-hidden="true">
      <defs>
        {marker("vm1", "#45b7d1")}
        {marker("vm2", "#ff6b6b")}
        {marker("vm3", "#fd79a8")}
        {marker("vm4", "#a55eea")}
      </defs>
      <path d="M40 180H330M60 30V190" stroke="#ffffff10" />
      <path className={styles.arrow} d="M60 180L150 60" stroke="#45b7d1" strokeWidth="2.5" fill="none" markerEnd="url(#vm1)" />
      <path className={`${styles.arrow} ${styles.a2}`} d="M150 60L190 150" stroke="#ff6b6b" strokeWidth="2.5" fill="none" markerEnd="url(#vm2)" />
      <path className={`${styles.arrow} ${styles.a3}`} d="M190 150L260 110" stroke="#fd79a8" strokeWidth="2.5" fill="none" markerEnd="url(#vm3)" />
      <path className={`${styles.arrow} ${styles.a4}`} d="M60 180L260 110" stroke="#a55eea" strokeWidth="3" fill="none" markerEnd="url(#vm4)" />
      <text x="118" y="52">king</text>
      <text x="196" y="168">− man</text>
      <text x="252" y="98">+ woman</text>
      <text x="262" y="132" style={{ fill: "#d6b8ff" }}>≈ queen</text>
    </svg>
  );
}
