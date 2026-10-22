"use client";

import { useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { tokenLabel } from "@/lib/tokenDisplay";
import s from "@/components/learn/articles/why-tokens.module.css";

// Real o200k_base tokens (label, id), precomputed with @dqbd/tiktoken + lib/tokenDisplay.
// "·" marks a space; <F0 9F> is a raw byte that is only part of a character.
const PRESETS = [
  { name: "简单句", text: "The cat sat on the mat.", toks: [["The", 976], ["·cat", 9059], ["·sat", 10139], ["·on", 402], ["·the", 290], ["·mat", 2450], [".", 13]] },
  { name: "罕见词", text: "Tokenizers split unbelievably rare words into smaller pieces.", toks: [["Token", 4421], ["izers", 24223], ["·split", 12648], ["·unbelievably", 180692], ["·rare", 12829], ["·words", 6391], ["·into", 1511], ["·smaller", 13679], ["·pieces", 12762], [".", 13]] },
  { name: "德语 + 表情符号", text: "Grüße aus München! 🦒", toks: [["Gr", 3193], ["ü", 572], ["ße", 13153], ["·aus", 3976], ["·München", 61963], ["!", 0], ["·<F0 9F>", 9552], ["<A6>", 99], ["<92>", 240]] },
  { name: "日语", text: "東京は日本の首都です。", toks: [["東京", 108713], ["は", 5205], ["日本", 9048], ["の", 3385], ["首", 15425], ["都", 12232], ["です", 15121], ["。", 788]] },
  { name: "代码", text: "for i in range(10): print(i)", toks: [["for", 1938], ["·i", 575], ["·in", 306], ["·range", 3352], ["(", 7], ["10", 702], ["):", 3127], ["·print", 2123], ["(i", 3649], [")", 8]] },
];

const MAX_CHIPS = 60;

function Row({ label, items }) {
  const shown = items.slice(0, MAX_CHIPS);
  return (
    <div className={s.row}>
      <span className={s.rowLabel}>{label} · <b>{items.length}</b></span>
      <div className={s.chips}>
        {shown.map(([text, sub], i) => (
          <span key={i} className={s.chip} style={{ "--tc": CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
            <b>{text}</b>
            {sub !== undefined && <small>{sub}</small>}
          </span>
        ))}
        {items.length > MAX_CHIPS && <span className={s.more}>另有 {items.length - MAX_CHIPS} 个</span>}
      </div>
    </div>
  );
}

// Lazy-loaded so the ~MB tokenizer tables only download if the reader types their own text.
let tokenizerPromise = null;
// Same options as the /tokenizer page (lib/tokenizer's default allowed_special value is rejected by tiktoken).
const OPTS = { allowedSpecial: new Set(["<|endoftext|>"]) };
const loadTokenizer = () => (tokenizerPromise ??= import("@/lib/tokenizer").catch((e) => { tokenizerPromise = null; throw e; }));

export function ThreeWaySplit() {
  const [preset, setPreset] = useState(0);
  const [custom, setCustom] = useState(null); // { text, toks, status }
  const text = custom ? custom.text : PRESETS[preset].text;
  const toks = custom ? custom.toks : PRESETS[preset].toks;

  const chars = [...text].map((c) => [c === " " ? "·" : c]);
  const words = (text.match(/\S+/g) ?? []).map((w) => [w]);

  async function onType(value) {
    setCustom((c) => ({ text: value, toks: c?.toks ?? PRESETS[preset].toks, status: "loading" }));
    try {
      const { tokenizeText } = await loadTokenizer();
      const out = await tokenizeText(value, "o200k_base", OPTS);
      // Ignore stale results if the reader kept typing.
      setCustom((c) => (c && c.text === value ? { text: value, toks: out.map((t) => [tokenLabel(t), t.id]), status: "ok" } : c));
    } catch {
      setCustom((c) => (c && c.text === value ? { ...c, status: "error" } : c));
    }
  }

  return (
    <div>
      <div className={s.buttons} role="group" aria-label="示例句子">
        {PRESETS.map((p, i) => (
          <button key={p.name} type="button" className={s.btn} aria-pressed={!custom && i === preset}
            onClick={() => { setCustom(null); setPreset(i); }}>{p.name}</button>
        ))}
      </div>
      <label className={s.inputLabel}>
        <span>或者输入你自己的文本</span>
        <input
          className={s.input} type="text" maxLength={200} value={text}
          onChange={(e) => onType(e.target.value)} spellCheck={false}
        />
      </label>
      <div className={s.rows}>
        <Row label="字符" items={chars} />
        <Row label="单词（按空格切分）" items={words} />
        <div className={custom && custom.status !== "ok" ? s.stale : undefined}>
          <Row label="子词词元（o200k_base）" items={toks} />
        </div>
        <p className={s.summary} aria-live="polite">
          {chars.length} 个字符 · {words.length} 个单词 · {custom && custom.status !== "ok" ? "…" : toks.length} 个词元
        </p>
        {custom?.status === "loading" && <p className={s.note}>正在用真实的 o200k_base 分词器切分……</p>}
        {custom?.status === "error" && <p className={s.note}>无法切分这段文本。请改选上面的示例。</p>}
      </div>
    </div>
  );
}
