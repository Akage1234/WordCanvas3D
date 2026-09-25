"use client";
import Link from "next/link";
import { ArrowUpRight, Info, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// "What even is this?" for each tool: a short plain-language brief, one small picture, and the Learn
// articles that explain it properly. Titles are duplicated from the Learn registry on purpose, so this
// client component doesn't pull every article body into the page bundle.
const CONCEPTS = {
  tokenizer: {
    kicker: "Tokenizer",
    title: "What is tokenization?",
    lede: "A language model can't read letters. Before it sees your text, a tokenizer cuts it into pieces called tokens and swaps each piece for a number.",
    points: [
      "A token is often a whole common word, sometimes part of a word, a space or a punctuation mark.",
      "Every model has a fixed list of tokens, its vocabulary, with a number (ID) for each.",
      "Rare words, other languages and emoji take more tokens, so they cost more to process.",
    ],
    picture: "tokens",
    reads: [
      ["why-tokens", "Why models read tokens, not letters or words", 6],
      ["what-is-a-token", "What is a token, and why isn’t it a word?", 4],
      ["tokenization-algorithms", "How tokenizers are built: BPE, WordPiece and Unigram", 6],
    ],
  },
  embedding: {
    kicker: "Embedding",
    title: "What is an embedding?",
    lede: "An embedding turns a word into a long list of numbers, here 300 of them, so that words used in similar ways end up with similar numbers.",
    points: [
      "Think of each list as a point in a space with 300 directions. Close points mean related words.",
      "Nobody writes these numbers by hand. They are learned by reading huge amounts of text.",
      "We can’t see 300 dimensions, so this page squashes them into 3D with PCA or UMAP. Some distances get distorted.",
    ],
    picture: "cluster",
    reads: [
      ["what-are-embeddings", "What are embeddings?", 7],
      ["how-a-word-becomes-300-numbers", "How a word becomes 300 numbers", 4],
      ["pca-vs-umap", "PCA vs UMAP: two ways to flatten meaning", 4],
    ],
  },
  vectors: {
    kicker: "Vector Playground",
    title: "What are word vectors?",
    lede: "Each word’s embedding is a vector: an arrow from the origin to a point. Because they are arrows, you can add and subtract them, and the result often still means something.",
    points: [
      "king − man + woman lands close to queen: the “royalty” step is roughly the same arrow either way.",
      "Similarity is measured by angle (cosine), not by distance on screen.",
      "The arrows here are a flattened view of 300 dimensions; the maths uses all of them.",
    ],
    picture: "arrows",
    reads: [
      ["king-man-woman", "King − man + woman, explained", 4],
      ["latent-space", "Latent space: the hidden meaning in numbers", 7],
      ["what-are-embeddings", "What are embeddings?", 7],
    ],
  },
};

const CHIPS = [["The", "#ff6b6b"], ["·cat", "#4ecdc4"], ["·sat", "#45b7d1"], ["·on", "#f9ca24"], ["·the", "#a29bfe"]];

function Picture({ kind }) {
  if (kind === "tokens") {
    return (
      <div className="flex flex-wrap items-end gap-1.5 font-mono">
        {CHIPS.map(([t, c], i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <b className="rounded-md px-2 py-1 text-[15px] font-medium text-white" style={{ background: `${c}47`, boxShadow: `inset 0 -2px 0 ${c}` }}>{t}</b>
            <small className="text-[11px] text-neutral-500">{[976, 9059, 10139, 402, 290][i]}</small>
          </span>
        ))}
      </div>
    );
  }
  const svg = kind === "cluster" ? (
    <>
      {[[40, 40, "#ff6b6b", "king"], [62, 30, "#ff6b6b", "queen"], [56, 58, "#ff6b6b", "prince"], [150, 70, "#4ecdc4", "apple"], [172, 58, "#4ecdc4", "pear"], [164, 88, "#4ecdc4", "grape"], [110, 20, "#f9ca24", "paris"], [128, 40, "#f9ca24", "rome"]].map(([x, y, c, w]) => (
        <g key={w}>
          <circle cx={x} cy={y} r="4" fill={c} />
          <text x={x + 7} y={y + 4} fontSize="10" fill="#aab5c6" fontFamily="var(--mono, monospace)">{w}</text>
        </g>
      ))}
    </>
  ) : (
    <>
      <defs>
        <marker id="cs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5 0 10z" fill="context-stroke" />
        </marker>
      </defs>
      <path d="M20 96L70 30" stroke="#5ad0f5" strokeWidth="2" markerEnd="url(#cs-arrow)" />
      <path d="M20 96L60 76" stroke="#a29bfe" strokeWidth="2" markerEnd="url(#cs-arrow)" />
      <path d="M110 96L160 30" stroke="#5ad0f5" strokeWidth="2" markerEnd="url(#cs-arrow)" />
      <path d="M110 96L150 76" stroke="#fd79a8" strokeWidth="2" markerEnd="url(#cs-arrow)" />
      <path d="M60 76L70 30M150 76L160 30" stroke="#f9ca24" strokeWidth="1.5" strokeDasharray="3 3" />
      {[[74, 28, "king"], [64, 80, "man"], [164, 28, "queen"], [154, 80, "woman"]].map(([x, y, w]) => (
        <text key={w} x={x} y={y} fontSize="10" fill="#aab5c6" fontFamily="var(--mono, monospace)">{w}</text>
      ))}
    </>
  );
  return <svg viewBox="0 0 210 104" className="h-auto w-full max-w-[320px]" aria-hidden="true">{svg}</svg>;
}

// Icon-only by default; pass `label` for a text button (used on the tokenizer header).
export function ConceptButton({ concept, label, className = "" }) {
  const c = CONCEPTS[concept];
  if (!c) return null;
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        {label ? (
          <button className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-neutral-200 transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.06] hover:text-white sm:w-auto outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${className}`}>
            <Info className="h-4 w-4 text-cyan-300" />
            {label}
          </button>
        ) : (
          <button
            aria-label={c.title}
            title={c.title}
            className={`inline-flex items-center justify-center rounded-full text-neutral-200 transition-colors hover:bg-white/10 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${className}`}
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="bg-neutral-950/95 backdrop-blur-2xl border-l border-white/10 sm:max-w-md">
        <div className="flex h-full flex-col overflow-y-auto custom-scroll">
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <DrawerHeader className="p-0 text-left">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-300">{c.kicker}</span>
              <DrawerTitle className="mt-1 text-2xl font-bold tracking-tight text-white">{c.title}</DrawerTitle>
              <DrawerDescription className="mt-3 text-[15px] leading-relaxed text-neutral-300">{c.lede}</DrawerDescription>
            </DrawerHeader>
            <DrawerClose asChild>
              <button className="-mr-2 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>

          <div className="mx-6 mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Picture kind={c.picture} />
          </div>

          <ul className="mt-5 space-y-3 px-6">
            {c.points.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-relaxed text-neutral-300">
                <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-cyan-300/80" />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-auto px-6 pb-6 pt-8">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">Read more on Learn</div>
            <div className="space-y-2">
              {c.reads.map(([slug, title, minutes]) => (
                <DrawerClose asChild key={slug}>
                  <Link
                    href={`/learn/${slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.05]"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-neutral-100">{title}</span>
                      <span className="font-mono text-[11px] text-neutral-500">{minutes} min read</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 flex-none text-neutral-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                  </Link>
                </DrawerClose>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
