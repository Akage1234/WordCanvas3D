import { readFile } from "node:fs/promises";
import path from "node:path";
import { Fragment } from "react";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

// Link-preview cards (1200×630), one design per kind of page. Rendered at build time by next/og,
// which supports flexbox, absolute positioning, gradients and inline SVG (no CSS grid or filters).
export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#05070b";
const CYAN = "#5ad0f5";
const DIM = "#7d889b";
const PALETTE = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#a29bfe", "#fd79a8", "#34d399"];

// Fonts come from Google Fonts at build time; if that fails the cards fall back to the built-in font.
const FONT_CSS = [
  ["Inter", "Inter:wght@400;800"],
  ["Serif", "Instrument+Serif:ital@1"],
  ["Mono", "JetBrains+Mono:wght@500"],
];
let fonts;
async function loadFonts() {
  if (fonts) return fonts;
  try {
    const all = await Promise.all(FONT_CSS.map(async ([name, query]) => {
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`)).text();
      const faces = [...css.matchAll(/font-style: (\w+);\s*font-weight: (\d+);[\s\S]*?src: url\((.+?)\) format\('(?:truetype|opentype)'\)/g)];
      return Promise.all(faces.map(async ([, style, weight, src]) => ({
        name, style, weight: Number(weight), data: await (await fetch(src)).arrayBuffer(),
      })));
    }));
    fonts = all.flat();
  } catch {
    fonts = [];
  }
  return fonts;
}

// Chinese and Japanese need their own fonts. Google Fonts can subset a font to just the characters a
// card uses (the `text` parameter), which keeps each download small.
const CJK = { zh: "Noto+Sans+SC", ja: "Noto+Sans+JP" };
async function cjkFonts(locale, text) {
  if (!CJK[locale]) return [];
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${CJK[locale]}:wght@400;800&text=${encodeURIComponent(text)}`)).text();
    const faces = [...css.matchAll(/font-weight: (\d+);[\s\S]*?src: url\((.+?)\) format\('(?:truetype|opentype)'\)/g)];
    return Promise.all(faces.map(async ([, weight, src]) => ({ name: "CJK", style: "normal", weight: Number(weight), data: await (await fetch(src)).arrayBuffer() })));
  } catch {
    return [];
  }
}

let logoSrc;
async function logo() {
  logoSrc ??= `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/logo.png"))).toString("base64")}`;
  return logoSrc;
}

// Small deterministic pseudo-random numbers so every build draws the same picture.
const rand = (i, j = 0) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };

function DotGrid() {
  const dots = [];
  for (let x = 20; x < 1200; x += 40) for (let y = 20; y < 630; y += 40) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="#ffffff" />);
  return <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0, opacity: 0.07 }}>{dots}</svg>;
}

// Shared frame: background, brand row, footer. `left` is the text column, `right` the artwork.
async function card({ left, right, kicker, accent = CYAN, glow = "#1d4ed8", leftWidth = 600, locale, footer, text }) {
  const [latin, src, cjk] = await Promise.all([loadFonts(), logo(), cjkFonts(locale, `${text} ${kicker ?? ""} ${footer}`)]);
  const loaded = [...latin, ...cjk];
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: INK, color: "#f2f5fa", fontFamily: loaded.length ? "Inter" : "sans-serif" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: `radial-gradient(700px 520px at 88% 30%, ${glow}40, transparent 65%), radial-gradient(600px 420px at 0% 110%, ${accent}1f, transparent 60%)` }} />
        <DotGrid />
        {right && <div style={{ position: "absolute", right: 0, top: 0, width: 600, height: 630, display: "flex" }}>{right}</div>}

        <div style={{ position: "absolute", left: 72, top: 60, right: 72, bottom: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src={src} width={46} height={46} alt="" />
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
                <span>Word</span><span style={{ color: CYAN }}>Canvas3D</span>
              </div>
            </div>
            {kicker && (
              <div style={{ display: "flex", padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${accent}66`, background: `${accent}14`, color: accent, fontFamily: "Mono", fontSize: 20, letterSpacing: 1 }}>{kicker}</div>
            )}
          </div>
          {/* A fragment would be laid out as a row by the renderer, so unwrap it into this column. */}
          <div style={{ display: "flex", flexDirection: "column", width: leftWidth }}>{left?.type === Fragment ? left.props.children : left}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 21, color: DIM }}>
            <span>wordcanvas3d.vercel.app</span>
            <span style={{ width: 5, height: 5, borderRadius: 5, background: "#3a4252" }} />
            <span>{footer}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: loaded },
  );
}

const Title = ({ children, size = 76 }) => (
  <div style={{ display: "flex", flexWrap: "wrap", fontSize: size, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.5 }}>{children}</div>
);
const SerifLine = ({ children, size = 88, color = CYAN }) => (
  <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontWeight: 400, fontSize: size, lineHeight: 1, color, marginTop: 4 }}>{children}</div>
);
const Sub = ({ children }) => <div style={{ display: "flex", marginTop: 26, fontSize: 26, lineHeight: 1.4, color: "#aab5c6", maxWidth: 560 }}>{children}</div>;
const Label = ({ x, y, children, color = "#dfe6f1", size = 20 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", fontFamily: "Mono", fontSize: size, color }}>{children}</div>
);
function Chip({ text, color, id, size = 34 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", padding: `${size * 0.22}px ${size * 0.42}px`, borderRadius: 10, background: `${color}47`, borderBottom: `4px solid ${color}`, fontFamily: "Mono", fontSize: size, color: "#fff" }}>{text}</div>
      {id !== undefined && <div style={{ display: "flex", fontFamily: "Mono", fontSize: 18, color: DIM }}>{id}</div>}
    </div>
  );
}

/* ---------- artwork ---------- */

function Galaxy() {
  const cx = 330, cy = 315, dots = [];
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i < 110; i++) {
      const t = i / 110;
      const a = t * 3.1 + arm * (Math.PI / 2);
      const r = 26 + t * 250 + (rand(arm, i) - 0.5) * 26;
      const x = cx + Math.cos(a) * r + (rand(i, arm) - 0.5) * 18;
      const y = cy + Math.sin(a) * r * 0.62 + (rand(i + 3, arm) - 0.5) * 14;
      dots.push(<circle key={`${arm}-${i}`} cx={x} cy={y} r={0.8 + rand(i, arm + 9) * 2.2} fill={PALETTE[arm + 1]} opacity={0.35 + (1 - t) * 0.55} />);
    }
  }
  for (let i = 0; i < 160; i++) {
    const a = rand(i, 1) * Math.PI * 2, r = Math.pow(rand(i, 2), 2) * 70;
    dots.push(<circle key={`c${i}`} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r * 0.62} r={0.8 + rand(i, 3) * 1.4} fill="#e6f7ff" opacity={0.5 + rand(i, 4) * 0.5} />);
  }
  const words = [["king", 150, 170], ["queen", 60, 250], ["ocean", 420, 150], ["music", 250, 470], ["paris", 470, 330], ["river", 380, 250], ["january", 90, 400], ["happy", 470, 430]];
  return (
    <div style={{ display: "flex", position: "relative", width: 600, height: 630 }}>
      <svg width="600" height="630" viewBox="0 0 600 630">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#bfe9ff" stopOpacity=".55" /><stop offset="100%" stopColor="#bfe9ff" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx={cx} cy={cy} rx="120" ry="80" fill="url(#core)" />
        {dots}
      </svg>
      {words.map(([w, x, y]) => <Label key={w} x={x} y={y} size={19} color="#cfd8e6">{w}</Label>)}
    </div>
  );
}

function Clusters() {
  const groups = [
    { c: PALETTE[0], x: 190, y: 190, words: ["king", "queen", "prince"] },
    { c: PALETTE[1], x: 420, y: 250, words: ["apple", "pear", "grape"] },
    { c: PALETTE[3], x: 250, y: 430, words: ["paris", "rome", "tokyo"] },
    { c: PALETTE[4], x: 470, y: 460, words: ["happy", "glad", "joyful"] },
  ];
  const pts = [], lines = [], labels = [];
  groups.forEach((g, gi) => {
    const local = [];
    for (let i = 0; i < 26; i++) {
      const a = rand(i, gi) * Math.PI * 2, r = Math.sqrt(rand(gi, i)) * 70;
      local.push([g.x + Math.cos(a) * r, g.y + Math.sin(a) * r * 0.8]);
    }
    local.forEach(([x, y], i) => {
      const [nx, ny] = local[(i + 3) % local.length];
      lines.push(<line key={`l${gi}-${i}`} x1={x} y1={y} x2={nx} y2={ny} stroke={g.c} strokeOpacity=".22" strokeWidth="1" />);
      pts.push(<rect key={`p${gi}-${i}`} x={x - 3.5} y={y - 3.5} width="7" height="7" fill={g.c} opacity={0.55 + rand(i, gi + 5) * 0.45} />);
    });
    // Labelled words sit at fixed spots around the cluster so their names never collide.
    [[-52, -44], [34, -8], [-22, 46]].forEach(([dx, dy], i) => {
      const w = g.words[i], x = g.x + dx, y = g.y + dy;
      pts.push(<rect key={`h${gi}-${i}`} x={x - 6} y={y - 6} width="12" height="12" fill={g.c} />);
      labels.push(<Label key={w} x={x + 10} y={y - 14}>{w}</Label>);
    });
  });
  return (
    <div style={{ display: "flex", position: "relative", width: 600, height: 630 }}>
      <svg width="600" height="630" viewBox="0 0 600 630">{lines}{pts}</svg>
      {labels}
    </div>
  );
}

// Called as a function (not <Arrow />): only plain SVG elements are allowed inside <svg> here.
function arrow({ from, to, color, width = 5, dashed }, key) {
  const [x1, y1] = from, [x2, y2] = to;
  const a = Math.atan2(y2 - y1, x2 - x1), h = 18;
  const p = (s) => `${x2 - h * Math.cos(a + s)} ${y2 - h * Math.sin(a + s)}`;
  return (
    <g key={key}>
      <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "10 10" : undefined} />
      {!dashed && <path d={`M${p(0.42)}L${x2} ${y2}L${p(-0.42)}`} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </g>
  );
}

function Parallelogram() {
  const o = [110, 500], man = [300, 440], king = [250, 170], woman = [380, 520], queen = [330, 250];
  return (
    <div style={{ display: "flex", position: "relative", width: 600, height: 630 }}>
      <svg width="600" height="630" viewBox="0 0 600 630">
        {arrow({ from: o, to: man, color: PALETTE[2] }, 1)}
        {arrow({ from: o, to: king, color: PALETTE[0] }, 2)}
        {arrow({ from: o, to: woman, color: PALETTE[5] }, 3)}
        {arrow({ from: o, to: queen, color: CYAN, width: 6 }, 4)}
        {arrow({ from: man, to: king, color: PALETTE[3], width: 3, dashed: true }, 5)}
        {arrow({ from: woman, to: queen, color: PALETTE[3], width: 3, dashed: true }, 6)}
        <circle cx={queen[0]} cy={queen[1]} r="34" fill={CYAN} opacity=".14" />
        <circle cx={o[0]} cy={o[1]} r="6" fill="#dfe6f1" />
      </svg>
      <Label x={king[0] - 40} y={king[1] - 44} size={26}>king</Label>
      <Label x={queen[0] + 30} y={queen[1] - 30} size={30} color={CYAN}>queen</Label>
      <Label x={man[0] + 22} y={man[1] - 20} size={24}>man</Label>
      <Label x={woman[0] + 22} y={woman[1] - 8} size={24}>woman</Label>
    </div>
  );
}

// The Learn chalk drawing, without the chalk filter (not supported here) but with the same lines.
function ChalkBulb() {
  const w = { stroke: "#eef3fb", strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  return (
    <svg width="600" height="630" viewBox="-40 -70 500 530">
      <g {...w}>
        <path d="M210 62c-38 0-66 29-66 64 0 24 12 40 26 54 9 9 13 18 13 30v12h54v-12c0-12 4-21 13-30 14-14 26-30 26-54 0-35-28-64-66-64z" />
        <path d="M186 234h48M188 246h44M194 258h32M202 270h16" />
        <path d="M194 222c0-26 4-46 16-60 12 14 16 34 16 60" strokeWidth="3" opacity=".75" />
        <path d="M210 22v18M126 58l12 12M294 58l-12 12M96 128h18M306 128h18M122 196l12-8M298 196l-12-8" strokeWidth="4" />
        <path d="M110 312h200l-6 26H104zM96 338h226v30H96zM122 286l176-6 4 30-176 6z" />
        <path d="M290 312v26M298 312v26M112 338v30M120 338v30M280 281l2 30" strokeWidth="3" />
        <path d="M70 372c90 3 190 3 282-1" strokeWidth="3" opacity=".6" />
      </g>
      <path d="M100 348h220M100 358h220" stroke="#72ede5" strokeWidth="3" opacity=".6" />
      <path d="M116 320h186M114 328h186" stroke="#fd79a8" strokeWidth="3" opacity=".6" />
      <path d="M128 294l168-6M128 302l168-6" stroke="#a29bfe" strokeWidth="3" opacity=".65" />
      <circle cx="210" cy="128" r="46" stroke="#f9ca24" strokeWidth="3" strokeDasharray="5 11" fill="none" opacity=".8" />
    </svg>
  );
}

function Attention({ color }) {
  const xs = [150, 240, 330, 420, 510];
  const arcs = [[0, 4, 0.9], [1, 4, 0.55], [2, 4, 0.75], [3, 4, 0.35], [1, 3, 0.4], [0, 2, 0.3]];
  return (
    <svg width="600" height="630" viewBox="0 0 600 630">
      {arcs.map(([a, b, w], i) => {
        const x1 = xs[a], x2 = xs[b], h = (x2 - x1) * 0.75;
        return <path key={i} d={`M${x1} 400C${x1} ${400 - h} ${x2} ${400 - h} ${x2} 400`} stroke={color} strokeWidth={2 + w * 8} strokeOpacity={0.25 + w * 0.6} fill="none" strokeLinecap="round" />;
      })}
      {xs.map((x, i) => <rect key={x} x={x - 34} y="404" width="68" height="42" rx="9" fill={`${PALETTE[i]}55`} stroke={PALETTE[i]} strokeWidth="2" />)}
    </svg>
  );
}

function TokenStack() {
  const toks = [["tok", 0], ["en", 3], ["iz", 1], ["ation", 4], ["·is", 2], ["·fun", 5]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start", justifyContent: "center", width: 600, height: 630, paddingLeft: 130 }}>
      {[toks.slice(0, 4), toks.slice(4)].map((row, r) => (
        <div key={r} style={{ display: "flex", gap: 12 }}>
          {row.map(([t, c]) => <Chip key={t} text={t} color={PALETTE[c]} size={40} />)}
        </div>
      ))}
    </div>
  );
}

function Pipeline({ color }) {
  const steps = [["text", PALETTE[3]], ["tokens", PALETTE[1]], ["vectors", PALETTE[2]], ["transformer", PALETTE[4]], ["next word", color]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center", width: 600, height: 630, paddingLeft: 190 }}>
      {steps.map(([s, c], i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 34, height: 34, borderRadius: 34, alignItems: "center", justifyContent: "center", background: `${c}33`, color: c, fontFamily: "Mono", fontSize: 18 }}>{i + 1}</div>
          <div style={{ display: "flex", padding: "12px 22px", borderRadius: 12, border: `2px solid ${c}`, background: `${c}1a`, fontFamily: "Mono", fontSize: 26, color: "#fff" }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- the cards ---------- */

// Every card's words come from messages (Og namespace), so each language gets its own preview.
async function words(locale, key) {
  const t = await getTranslations({ locale, namespace: "Og" });
  const m = t.raw(key);
  // Headlines were sized for the English text. Longer translations shrink to the same visual length;
  // CJK characters count as ~2.4 letters, since each is about that wide next to the narrow serif.
  const en = (await getTranslations({ locale: "en", namespace: "Og" })).raw(key);
  const width = (str = "") => [...str].reduce((n, ch) => n + (/[⺀-鿿＀-￯]/.test(ch) ? 2.4 : 1), 0);
  const longest = (o) => Math.max(width(o.title), width(o.serif));
  const k = Math.max(0.5, Math.min(1, longest(en) / longest(m)));
  return { ...m, locale, footer: t("footer"), text: Object.values(m).join(" "), sz: (n) => Math.round(n * k) };
}

export async function ogHome(locale) {
  const m = await words(locale, "home");
  const { sz: _sz, ...rest } = m;
  return card({
    ...rest,
    left: (<>
      <Title size={m.sz(92)}>{m.title}</Title>
      <SerifLine size={m.sz(104)}>{m.serif}</SerifLine>
      <Sub>{m.sub}</Sub>
    </>),
    right: <Galaxy />,
    leftWidth: 540,
  });
}

export async function ogTokenizer(locale) {
  const m = await words(locale, "tokenizer");
  const toks = [["The", 976], ["·cat", 9059], ["·sat", 10139], ["·on", 402], ["·the", 290], ["·mat", 2450], [".", 13]];
  const { sz: _sz, ...rest } = m;
  return card({
    ...rest,
    glow: "#b8860b",
    accent: PALETTE[3],
    leftWidth: 1056,
    left: (<>
      <Title size={m.sz(76)}>{m.title}</Title>
      <SerifLine size={m.sz(92)} color={PALETTE[3]}>{m.serif}</SerifLine>
      <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
        {toks.map(([t, id], i) => <Chip key={t + id} text={t} id={id} color={PALETTE[i % PALETTE.length]} size={40} />)}
      </div>
    </>),
  });
}

export async function ogEmbedding(locale) {
  const m = await words(locale, "embedding");
  const { sz: _sz, ...rest } = m;
  return card({
    ...rest,
    glow: "#0f766e",
    accent: PALETTE[1],
    leftWidth: 540,
    left: (<>
      <Title size={m.sz(76)}>{m.title}</Title>
      <SerifLine size={m.sz(92)} color={PALETTE[1]}>{m.serif}</SerifLine>
      <Sub>{m.sub}</Sub>
    </>),
    right: <Clusters />,
  });
}

export async function ogVectors(locale) {
  const m = await words(locale, "vectors");
  const { sz: _sz, ...rest } = m;
  return card({
    ...rest,
    glow: "#7c3aed",
    accent: PALETTE[4],
    leftWidth: 560,
    left: (<>
      <Title size={m.sz(76)}>{m.title}</Title>
      <SerifLine size={m.sz(92)} color={PALETTE[4]}>{m.serif}</SerifLine>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40, fontFamily: "Mono", fontSize: 28 }}>
        <Chip text="king" color={PALETTE[0]} size={24} />
        <span style={{ color: DIM }}>−</span>
        <Chip text="man" color={PALETTE[2]} size={24} />
        <span style={{ color: DIM }}>+</span>
        <Chip text="woman" color={PALETTE[5]} size={24} />
        <span style={{ color: DIM }}>≈</span>
        <Chip text="queen" color={CYAN} size={24} />
      </div>
    </>),
    right: <Parallelogram />,
  });
}

export async function ogLearn(locale) {
  const m = await words(locale, "learn");
  const { sz: _sz, ...rest } = m;
  return card({
    ...rest,
    glow: "#1d4ed8",
    leftWidth: 580,
    left: (<>
      <Title size={m.sz(70)}>{m.title}</Title>
      <SerifLine size={m.sz(96)}>{m.serif}</SerifLine>
      <Sub>{m.sub}</Sub>
    </>),
    right: <ChalkBulb />,
  });
}

const ARTICLE_ART = {
  Tokens: () => <TokenStack />,
  Embeddings: () => <Clusters />,
  Transformers: (c) => <Attention color={c} />,
  Vectors: () => <Parallelogram />,
};

export async function ogArticle(a, trackTitle, locale) {
  const t = await getTranslations({ locale, namespace: "Og" });
  const learn = t("article.learn");
  const art = ARTICLE_ART[a.tag]?.(a.color) ?? <Pipeline color={a.color} />;
  const size = a.title.length > 58 ? 44 : a.title.length > 40 ? 50 : 60;
  return card({
    kicker: t("article.kicker", { minutes: a.minutes }),
    locale,
    footer: t("footer"),
    text: `${learn} ${trackTitle}`,
    accent: a.color,
    glow: a.color,
    leftWidth: 560,
    left: (<>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, fontFamily: "Mono", fontSize: 22, color: a.color }}>
        <span>{learn}</span><span style={{ color: DIM }}>/</span><span>{trackTitle}</span>
      </div>
      <Title size={size}>{a.title}</Title>
      <Sub>{a.summary}</Sub>
    </>),
    right: art,
  });
}
