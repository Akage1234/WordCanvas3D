"use client";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// "How do I use this page?" for each tool: a few numbered steps and one tip. The concept itself
// (what is tokenization, etc.) lives in ConceptSheet behind the (i) button.
const GUIDES = {
  tokenizer: {
    title: "Using the Tokenizer",
    steps: [
      "Type or paste text on the left, or pick a preset: Short, World scripts, Emoji, Code or Paragraph.",
      "Choose a tokenizer from the menu at the top to see how a different model splits the same text.",
      "Hover or tap any token to highlight its ID, and the other way round. Arrow keys work too.",
      "Turn on Show whitespace to reveal spaces and line breaks inside tokens.",
    ],
    tip: "Emoji and non-English text show the biggest differences between tokenizers.",
  },
  embedding: {
    title: "Using the Embedding explorer",
    steps: [
      "Pick a model, how many words to load, and PCA or UMAP in the sidebar.",
      "Drag to rotate the cloud, scroll or pinch to zoom.",
      "Click a point, or use Word Search, to select a word and see its nearest neighbours.",
      "Use Show labels, Motion and Clusters on the canvas to change what you see.",
    ],
    tip: "Distances in the 3D view are approximate, because 300 dimensions are squashed into 3.",
  },
  vectors: {
    title: "Using the Vector Playground",
    steps: [
      "Type words into the Words box to plot each one as an arrow.",
      "Fill in a, b and c to compute a − b + c, or pick a preset, then press Calculate.",
      "The result card shows the closest word. Open “Show the next 4 closest words” for runners-up.",
      "Use the eye button to switch between the From zero and Group centre views. Drag to rotate.",
    ],
    tip: "Try paris − france + italy, or walking − walk + swim.",
  },
};

export function PageGuide({ page, className = "" }) {
  const g = GUIDES[page];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={g.title}
          title="How to use this page"
          className={`inline-flex items-center justify-center rounded-full text-blue-400 transition-colors hover:text-blue-300 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${className}`}
          style={{ lineHeight: 0 }}
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[1000] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-white/10 bg-neutral-950/95 p-5 backdrop-blur-xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-300">How to use</div>
        <div className="mt-1 text-base font-semibold text-white">{g.title}</div>
        <ol className="mt-4 space-y-3">
          {g.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-neutral-300">
              <span className="grid h-5 w-5 flex-none place-items-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-[11px] text-neutral-200">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-lg bg-cyan-300/[0.06] px-3 py-2 text-xs leading-relaxed text-cyan-100/80">{g.tip}</p>
      </PopoverContent>
    </Popover>
  );
}
