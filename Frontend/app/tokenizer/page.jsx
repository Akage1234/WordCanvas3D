"use client";

import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { tokenizeText } from "@/lib/tokenizer";
// import hover card atoms
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";
import { useRef } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function TokenizerPage() {
  const [text, setText] = useState(
    "The quick brown fox jumps over the lazy dog."
  );
  const [tokens, setTokens] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const coloredContainerRef = useRef(null);
  const idsContainerRef = useRef(null);
  const tokenElsRef = useRef([]); // per-token spans (colored panel)
  const idElsRef = useRef([]); // per-id spans (IDs panel)

  const hoverRaf = useRef(0);

  const isOutOfView = (container, el) => {
    if (!container || !el) return false;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const pad = 4;
    return r.top < c.top + pad || r.bottom > c.bottom - pad;
  };

  const handleHover = (i, source) => {
    setHoveredIndex(i);
    cancelAnimationFrame(hoverRaf.current);
    hoverRaf.current = requestAnimationFrame(() => {
      const t = tokenElsRef.current[i];
      const id = idElsRef.current[i];
      // Only scroll the opposite panel, and only if out of view
      if (source !== "tokens" && isOutOfView(coloredContainerRef.current, t)) {
        t?.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "auto",
        });
      }
      if (source !== "ids" && isOutOfView(idsContainerRef.current, id)) {
        id?.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "auto",
        });
      }
    });
  };

  const handleUnhover = () => setHoveredIndex(null);

  const TOKENIZERS = [
    { label: "GPT-4.1 / 4o / mini (o200k_base)", value: "o200k_base" },
    { label: "GPT-4 / 3.5 (cl100k_base)", value: "cl100k_base" },
    { label: "GPT-3 (p50k_base)", value: "p50k_base" },
    { label: "Instruct (p50k_edit)", value: "p50k_edit" },
    { label: "Codex (r50k_base)", value: "r50k_base" },
    { label: "GPT-2 (gpt2)", value: "gpt2" },
    { label: "LLaMA 2 (llama2)", value: "llama2" },
    { label: "LLaMA (llama)", value: "llama" },
  ];
  const [tokenizer, setTokenizer] = useState(TOKENIZERS[0].value);

  useEffect(() => {
    let alive = true;
    (async () => {
      const tks = await tokenizeText(text, tokenizer, {
        allowedSpecial: new Set(["<|endoftext|>"]),
      });
      if (alive) setTokens(tks);
    })();
    return () => {
      alive = false;
    };
  }, [text, tokenizer]);

  // Deterministic color per token id
  const colorFor = (id) => {
    const h = id % 360;
    return `hsl(${h} 50% 55%)`;
  };

  const ids = useMemo(() => tokens.map((t) => t.id), [tokens]);

  return (
    <>
      <Drawer>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-6 max-w-7xl mx-auto w-full">
          <div />
          <div className="justify-self-center flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Tokenizer</h1>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  aria-label="About tokenizer"
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                  style={{ lineHeight: 0 }}
                  tabIndex={0}
                >
                  <HelpCircle size={20} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="text-sm space-y-3">
                  <div className="font-semibold text-white">Tokenizer playground</div>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                    <li>Paste or type on the left, then pick an encoding from the menu.</li>
                    <li>Hover any token ID to spotlight the exact token above (auto‑scroll sync).</li>
                    <li>Try different encodings to see how splits and IDs change.</li>
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-md border border-neutral-600/70 bg-neutral-900/60 px-2 py-0.5 text-xs text-neutral-200">
                      Encoding: <span className="font-medium">{tokenizer}</span>
                    </span>
                    <span className="rounded-md border border-neutral-600/70 bg-neutral-900/60 px-2 py-0.5 text-xs text-neutral-200">
                      Tokens: <span className="font-medium">{tokens.length}</span>
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">Tip: emojis, CJK, and code samples expose differences best.</div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="justify-self-end">
            <DrawerTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
                Learn about tokenization
              </button>
            </DrawerTrigger>
          </div>
        </div>

        <DrawerContent className="flex flex-col max-h-[90vh] custom-scroll">
          <div className="mx-auto w-full max-w-2xl overflow-y-auto flex-1 px-4 pt-4">
            <DrawerHeader>
              <DrawerTitle>What is tokenization?</DrawerTitle>
              <DrawerDescription>
                Tokenization is the process of breaking text into smaller units
                called tokens, which can represent words, subwords, or
                characters. These tokens are then mapped to numeric IDs that a
                model can understand. Different models use different
                tokenization rules, so the same text may be split into tokens in
                various ways, affecting how it’s processed and interpreted.
              </DrawerDescription>
            </DrawerHeader>

            <div className="space-y-3">
              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                  ASCII words
                </div>
                <div className="text-sm text-white mb-1">“Hello world”</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    Hello
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    ▁world
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                  Emoji + tone
                </div>
                <div className="text-sm text-white mb-1">“👋🏽 Friends”</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    👋
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    🏽
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    ▁Friends
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                  CJK
                </div>
                <div className="text-sm text-white mb-1">“こんにちは”</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    こん
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    にちは
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400">
                Active encoding:{" "}
                <span className="font-semibold text-neutral-200">
                  {tokenizer}
                </span>
              </div>
            </div>
          </div>

          <DrawerFooter className="mx-auto w-full max-w-2xl px-4 pb-4">
            <DrawerClose asChild>
              <button className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
                Close
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <main className="px-6 md:px-10 lg:px-14 py-6 min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch h-[70vh]">
          {/* Left: input */}
          <section className="h-full">
            <div className="h-full flex flex-col rounded-lg border border-white/10 bg-white/5 p-4  backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-400 text-white">Input</div>
                {/* Tokenizer selection */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 rounded border border-neutral-700 px-3 py-1 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 transition-colors">
                      {TOKENIZERS.find((t) => t.value === tokenizer)?.label}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {TOKENIZERS.map((t) => (
                      <DropdownMenuItem
                        key={t.value}
                        onSelect={() => setTokenizer(t.value)}
                        className={tokenizer === t.value ? "font-bold" : ""}
                      >
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className=" h-[62vh] md:h-[70vh] resize-none overflow-auto custom-scroll" // or hide-scrollbar
                placeholder="Type or paste text…"
              />
            </div>
          </section>

          {/* Right: outputs */}
          <section className="flex flex-col gap-6 h-full min-h-0">
            {/* Highlighted tokens */}
            <div className="flex-[2] min-h-0 rounded-lg border p-4 flex flex-col border-white/10 bg-white/5 p-4  backdrop-blur">
              <div className="text-sm text-neutral-400 mb-2 text-white">
                Tokens (colored)
              </div>
              <div
                ref={coloredContainerRef}
                className="flex-1 min-h-0 overflow-auto leading-7 border border-neutral-500/80 rounded-lg p-1 custom-scroll"
              >
                {tokens.length === 0 ? (
                  <span className="text-neutral-500">No tokens</span>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {tokens.map((t, i) => (
                      <span
                        key={i}
                        ref={(el) => (tokenElsRef.current[i] = el)}
                        onMouseEnter={() => handleHover(i, "tokens")}
                        onMouseLeave={handleUnhover}
                        className="px-0.5 py-0.5 m-0.5 rounded transition-colors"
                        style={{
                          backgroundColor:
                            hoveredIndex === null
                              ? colorFor(t.id)
                              : hoveredIndex === i
                              ? colorFor(t.id)
                              : "transparent",
                        }}
                        title={`id: ${t.id}`}
                      >
                        {t.token}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Numeric IDs */}
            <div className="flex-[1] min-h-0 rounded-lg border p-4 flex flex-col border-white/10 bg-white/5 p-4  backdrop-blur">
              <div className="text-sm text-neutral-400 mb-2 text-white">
                Token IDs
              </div>
              <div
                ref={idsContainerRef}
                className="flex-1 min-h-0 overflow-auto border border-neutral-500/80 rounded-lg p-1 custom-scroll"
              >
                {ids.length === 0 ? (
                  <span className="text-neutral-500">[]</span>
                ) : (
                  <code className="text-sm text-neutral-200 break-words">
                    [{" "}
                    {ids.map((id, i) => (
                      <span
                        key={i}
                        ref={(el) => (idElsRef.current[i] = el)}
                        onMouseEnter={() => handleHover(i, "ids")}
                        onMouseLeave={handleUnhover}
                        className={`inline-block m-0.5 cursor-pointer rounded px-1 py-0.5 transition-colors ${
                          hoveredIndex === i ? "text-white font-semibold" : ""
                        }`}
                        style={{
                          backgroundColor:
                            hoveredIndex === i ? colorFor(id) : "transparent",
                        }}
                        title={`token index: ${i}`}
                      >
                        {id}
                        {i < ids.length - 1 ? " " : ""}
                      </span>
                    ))}{" "}
                    ]
                  </code>
                )}
              </div>
              <div className="mt-2 text-xs text-neutral-400">
                Encoding: <span className="text-blue-400 font-medium">{tokenizer}</span> • Tokens: <span className="text-emerald-400 font-medium">{tokens.length}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
