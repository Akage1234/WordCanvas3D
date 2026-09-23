"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { tokenizeText } from "@/lib/tokenizer";
import { markWhitespace, toHex, tokenColor, tokenLabel, TOKEN_TEXT } from "@/lib/tokenDisplay";
// import hover card atoms
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { HelpCircle, ChevronDown, Copy, RotateCw } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const OPENAI = "OpenAI (tiktoken)";
const LLAMA = "LLaMA (SentencePiece)";
// Both LLaMA options run the same llama-tokenizer-js 1.2.2 tokenizer (LLaMA 1/2 vocabulary).
const LLAMA_NOTE = "Both options use the same vocabulary, so their IDs match.";
const TOKENIZERS = [
  { label: "GPT-4.1 / 4o / mini (o200k_base)", value: "o200k_base", group: OPENAI, dot: "bg-sky-400" },
  { label: "GPT-4 / 3.5 (cl100k_base)", value: "cl100k_base", group: OPENAI, dot: "bg-cyan-400" },
  { label: "GPT-3 (p50k_base)", value: "p50k_base", group: OPENAI, dot: "bg-indigo-400" },
  { label: "Instruct (p50k_edit)", value: "p50k_edit", group: OPENAI, dot: "bg-violet-400" },
  { label: "Codex (r50k_base)", value: "r50k_base", group: OPENAI, dot: "bg-fuchsia-400" },
  { label: "GPT-2 (gpt2)", value: "gpt2", group: OPENAI, dot: "bg-rose-400" },
  { label: "LLaMA 2 (llama2)", value: "llama2", group: LLAMA, note: LLAMA_NOTE, dot: "bg-amber-400" },
  { label: "LLaMA (llama)", value: "llama", group: LLAMA, note: LLAMA_NOTE, dot: "bg-orange-400" },
];
const PRESETS = [
  { label: "Short", text: "A quiet idea can travel far." },
  { label: "World scripts", text: "Hello, world. مرحباً بالعالم. नमस्ते दुनिया। こんにちは世界。" },
  { label: "Emoji", text: "Build, test, celebrate: 🧩 → 🛠️ → ✅ 🎉" },
  { label: "Code", text: "const total = items.reduce((sum, item) => sum + item.price, 0);" },
  {
    label: "Paragraph",
    text: "At dusk, the library windows caught the last orange light. Inside, a reader compared two translations, noticing how punctuation, rhythm, and a single borrowed word changed the feeling of the same small scene.",
  },
];
const labelOf = (value) => TOKENIZERS.find((t) => t.value === value)?.label;
const OPTS = { allowedSpecial: new Set(["<|endoftext|>"]) };
const utf8 = new TextEncoder();
const NO_TOKENS = [];
const indexAt = (e) => {
  const el = e.target.closest?.("[data-i]");
  return el ? Number(el.dataset.i) : null;
};

// Screen-reader wording for one token: stray bytes, specials and edge whitespace spelled out.
const spoken = (t) =>
  t.kind === "text" && !/^\s|\s$|[\n\t]/.test(t.parts[0].text)
    ? t.parts[0].text
    : t.kind === "special"
    ? `special token ${t.name}`
    : t.parts
        .map((p) =>
          "text" in p
            ? p.text
                .replace(/^ +| +$/g, (m) => " space".repeat(m.length) + " ")
                .replace(/\n/g, " newline ")
                .replace(/\t/g, " tab ")
            : ` bytes ${toHex(p.bytes)} `
        )
        .join("")
        .replace(/\s+/g, " ")
        .trim();

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

function tokenHtml(t, showWs) {
  if (t.kind === "text") return escapeHtml(showWs ? markWhitespace(t.parts[0].text) : t.parts[0].text);
  if (t.kind === "special") {
    return `<span class="rounded-sm px-0.5 font-mono text-[0.85em] outline-1 outline-dashed outline-white/70">${escapeHtml(t.name)}</span>`;
  }
  return t.parts
    .map((p) =>
      "text" in p
        ? escapeHtml(showWs ? markWhitespace(p.text) : p.text)
        : `<span title="Partial UTF-8 character: these bytes combine with neighbouring tokens" class="mx-px rounded-sm px-0.5 font-mono text-[0.8em] ring-1 ring-inset ring-white/50">‹${toHex(p.bytes)}›</span>`
    )
    .join("");
}

export default function TokenizerPage() {
  const [text, setText] = useState(
    "The quick brown fox jumps over the lazy dog."
  );
  const [tokenizer, setTokenizer] = useState(TOKENIZERS[0].value);
  const [retry, setRetry] = useState(0);
  // Latest settled tokenization: { text, tokenizer, retry, tokens, error }.
  const [result, setResult] = useState(null);
  // Active token, tied to the result it indexes so it resets when results change.
  const [active, setActive] = useState(null); // { result, index, pinned }
  const [showWs, setShowWs] = useState(false);
  const [copyState, setCopyState] = useState(null); // "copied" | "failed"

  const coloredContainerRef = useRef(null);
  const idsContainerRef = useRef(null);
  const hoverRaf = useRef(0);
  const copyTimer = useRef(0);
  const focusAfterRetry = useRef(false);
  const selectedEls = useRef([]);

  useEffect(() => {
    let alive = true;
    tokenizeText(text, tokenizer, OPTS).then(
      (tokens) => alive && setResult({ text, tokenizer, retry, tokens, error: null }),
      (error) => alive && setResult({ text, tokenizer, retry, tokens: [], error })
    );
    return () => {
      alive = false;
    };
  }, [text, tokenizer, retry]);

  useEffect(() => {
    if (focusAfterRetry.current && result && !result.error) {
      focusAfterRetry.current = false;
      coloredContainerRef.current?.focus();
    }
  }, [result]);

  const current =
    result && result.text === text && result.tokenizer === tokenizer && result.retry === retry;
  const phase = !result
    ? "loading"
    : !current
    ? "updating"
    : result.error
    ? "error"
    : result.tokens.length === 0
    ? "empty"
    : "ready";
  const tokens = result && !result.error ? result.tokens : NO_TOKENS;
  const ids = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const activeIndex =
    active && active.result === result && active.index < tokens.length ? active.index : null;
  const activeToken = activeIndex === null ? null : tokens[activeIndex];

  useLayoutEffect(() => {
    selectedEls.current.forEach((el) => {
      el.removeAttribute("data-active");
      el.removeAttribute("aria-selected");
      el.removeAttribute("id");
    });
    selectedEls.current = [];
    if (activeIndex === null) return;
    const tokenEl = coloredContainerRef.current?.querySelector(`[data-i="${activeIndex}"]`);
    const idEl = idsContainerRef.current?.querySelector(`[data-i="${activeIndex}"]`);
    if (tokenEl) {
      tokenEl.dataset.active = "";
      tokenEl.setAttribute("aria-selected", "true");
      tokenEl.id = `tok-t-${activeIndex}`;
      selectedEls.current.push(tokenEl);
    }
    if (idEl) {
      idEl.dataset.active = "";
      idEl.setAttribute("aria-selected", "true");
      idEl.id = `tok-i-${activeIndex}`;
      selectedEls.current.push(idEl);
    }
  }, [activeIndex, active?.pinned, result, showWs]);

  const codePoints = useMemo(() => Array.from(text).length, [text]);
  const byteCount = useMemo(() => utf8.encode(text).length, [text]);

  const statusText = !result
    ? "Loading tokenizer"
    : result.error
    ? result.error.input
      ? "This text can't be tokenized with this encoder"
      : "Tokenizer couldn't load. Try again."
    : result.text === ""
    ? "No text"
    : `${result.tokens.length} tokens, ${result.tokenizer}`;

  const revealWithin = (container, el) => {
    if (!container || !el) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const pad = 4;
    if (r.top < c.top + pad) container.scrollTop -= c.top + pad - r.top;
    else if (r.bottom > c.bottom - pad) container.scrollTop += r.bottom - (c.bottom - pad);
  };

  // Scroll only the intended list box. Element.scrollIntoView() can also move the page.
  const reveal = (i, source) => {
    cancelAnimationFrame(hoverRaf.current);
    hoverRaf.current = requestAnimationFrame(() => {
      const t = coloredContainerRef.current?.querySelector(`[data-i="${i}"]`);
      const id = idsContainerRef.current?.querySelector(`[data-i="${i}"]`);
      if (source !== "tokens") revealWithin(coloredContainerRef.current, t);
      if (source !== "ids") revealWithin(idsContainerRef.current, id);
    });
  };

  const handleHover = (i, source) => {
    if (active?.pinned && active.result === result) return;
    setActive({ result, index: i, pinned: false });
    reveal(i, source);
  };
  const handleUnhover = () => {
    if (!(active?.pinned && active.result === result)) setActive(null);
  };
  // Click / tap pins a token; clicking it again unpins.
  const handleClick = (i, source) => {
    if (active?.pinned && active.result === result && active.index === i) setActive(null);
    else {
      setActive({ result, index: i, pinned: true });
      reveal(i, source);
    }
  };
  const handleKeyDown = (e) => {
    const n = tokens.length;
    if (!n) return;
    let next;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = activeIndex === null ? 0 : Math.min(n - 1, activeIndex + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = activeIndex === null ? 0 : Math.max(0, activeIndex - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape" && activeIndex !== null) {
      e.preventDefault();
      setActive(null);
      return;
    } else return;
    e.preventDefault();
    setActive({ result, index: next, pinned: true });
    reveal(next, "keyboard");
  };
  // Delegated pointer handlers: one set per list instead of one per token.
  const pointerProps = (source) => ({
    onMouseOver: (e) => {
      const i = indexAt(e);
      if (i === null) handleUnhover();
      else if (i !== activeIndex) handleHover(i, source);
    },
    onMouseLeave: handleUnhover,
    onClick: (e) => {
      const i = indexAt(e);
      if (i !== null) handleClick(i, source);
    },
  });

  // Parsing one escaped HTML string avoids asking React to reconcile tens of thousands
  // of otherwise static option fibers. Selection remains a two-element DOM update.
  const tokenOptions = useMemo(
    () =>
      tokens
        .map(
          (t, i) =>
            `<span data-i="${i}" role="option" aria-label="${escapeHtml(`Token ${i + 1} of ${tokens.length}: ${spoken(t)}, ID ${t.id}`)}" data-kind="${t.kind}" class="tok-option cursor-pointer rounded-[3px] py-0.5 shadow-[inset_-1px_0_0_rgba(0,0,0,0.6)] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style="color:${TOKEN_TEXT};--token-color:${tokenColor(t.id)};background-color:var(--token-color)" title="id: ${t.id}">${tokenHtml(t, showWs)}</span>`
        )
        .join(""),
    [tokens, showWs]
  );
  const idOptions = useMemo(
    () =>
      ids
        .map(
          (id, i) =>
            `<span data-i="${i}" role="option" aria-label="ID ${id}, token ${i + 1} of ${ids.length}" class="tok-id-option cursor-pointer rounded" style="--token-color:${tokenColor(id)}" title="token index: ${i}">${id}${i < ids.length - 1 ? ", " : ""}</span>`
        )
        .join(""),
    [ids]
  );

  const copyIds = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(JSON.stringify(ids));
      setCopyState("copied");
      copyTimer.current = setTimeout(() => setCopyState(null), 2500);
    } catch {
      setCopyState("failed");
    }
  };

  const onRetry = () => {
    focusAfterRetry.current = true;
    setRetry((r) => r + 1);
  };

  const selected = TOKENIZERS.find((t) => t.value === tokenizer);
  const panel = "rounded-lg border border-white/10 bg-white/5 p-3 md:p-4 backdrop-blur";
  const listBox =
    "overflow-auto custom-scroll rounded-md border border-neutral-700/80 bg-black/20 p-2 outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 transition-opacity duration-150";
  const busy = phase === "updating";
  const dim = busy ? "opacity-60 delay-150" : "";
  const skeleton = (
    <div aria-hidden="true" className="space-y-2 animate-pulse motion-reduce:animate-none">
      <div className="h-4 w-3/4 rounded bg-white/10" />
      <div className="h-4 w-1/2 rounded bg-white/10" />
    </div>
  );

  return (
    <>
      <Drawer>
        <style>{`
          #tok-tokens[data-has-active] .tok-option { background-color: transparent !important; }
          #tok-tokens[data-has-active] .tok-option[data-active] { background-color: var(--token-color) !important; outline: 2px solid #38bdf8; outline-offset: 2px; }
          #tok-ids .tok-id-option[data-active] { background-color: var(--token-color); color: white; font-weight: 600; outline: 2px solid #38bdf8; outline-offset: 1px; }
        `}</style>
        <header className="mb-4 md:mb-5 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Tokenizer</h1>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    aria-label="About tokenizer"
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                    style={{ lineHeight: 0 }}
                    tabIndex={0}
                  >
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent>
                  <div className="text-sm space-y-3">
                    <div className="font-semibold text-white">Tokenizer playground</div>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                      <li>Paste or type on the left, then pick an encoding from the menu.</li>
                      <li>Hover or tap any token or ID to spotlight its partner (auto‑scroll sync). With the keyboard, focus a panel and use the arrow keys.</li>
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
            <p className="mt-1 text-sm text-neutral-400">
              See how text splits into tokens and IDs. Runs in your browser; your text isn’t sent anywhere.
            </p>
          </div>
          <DrawerTrigger asChild>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 w-full sm:w-auto">
              Learn about tokenization
            </button>
          </DrawerTrigger>
        </header>

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

      <main className="px-4 sm:px-6 md:px-10 lg:px-14 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-7xl space-y-4 md:space-y-5">
          {/* Control bar: tokenizer selection and status */}
          <div className={`${panel} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 min-w-0">
              <span id="tok-model-label" className="text-sm font-medium text-neutral-200">
                Tokenizer
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id="tok-model"
                    aria-labelledby="tok-model-label tok-model"
                    className="inline-flex min-h-10 w-full sm:w-auto items-center justify-between gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-left text-sm font-medium hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 transition-colors"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${selected?.dot}`} />
                      <span className="truncate">{selected?.label}</span>
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-w-[min(26rem,90vw)]">
                  <DropdownMenuRadioGroup value={tokenizer} onValueChange={setTokenizer}>
                    {TOKENIZERS.map((t, i) => (
                      <div key={t.value}>
                        {t.group !== TOKENIZERS[i - 1]?.group && (
                          <>
                            {i > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="text-xs font-medium text-neutral-400">
                              {t.group}
                            </DropdownMenuLabel>
                          </>
                        )}
                        <DropdownMenuRadioItem value={t.value} className="items-start">
                          <span className="flex gap-2">
                            <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${t.dot}`} />
                            <span className="flex flex-col">
                              <span>{t.label}</span>
                              {t.note && <span className="text-xs text-neutral-400">{t.note}</span>}
                            </span>
                          </span>
                        </DropdownMenuRadioItem>
                      </div>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-xs text-neutral-300">
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    phase === "error" ? "bg-red-400" : phase === "loading" ? "bg-amber-300" : "bg-emerald-400"
                  }`}
                />
                {phase === "loading" ? "Loading tokenizer…" : phase === "error" ? "Error" : "Ready"}
                {/* Fades in only if tokenizing takes longer than 150 ms, so fast typing doesn't flicker. */}
                {busy && <span className="transition-opacity delay-150 starting:opacity-0">· Tokenizing…</span>}
              </span>
            </div>
            <p role="status" className="sr-only">
              {statusText}
            </p>
          </div>

          {selected?.note && (
            <p className="-mt-2 text-xs text-neutral-400">{selected.note}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-start">
            {/* Left: input */}
            <section className={`${panel} flex flex-col`}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="tok-input" className="text-sm font-medium text-neutral-200">
                  Text
                </label>
                <fieldset className="flex flex-wrap items-center justify-end gap-1.5">
                  <legend className="sr-only">Load a text sample</legend>
                  <span aria-hidden="true" className="mr-0.5 text-[11px] text-neutral-500">Try</span>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setActive(null);
                        setText(preset.text);
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] leading-none text-neutral-300 transition-colors hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                    >
                      {preset.label}
                    </button>
                  ))}
                </fieldset>
              </div>
              <Textarea
                id="tok-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                aria-describedby="tok-stats"
                className="min-h-48 md:min-h-[22rem] max-h-[70vh] resize-y overflow-auto custom-scroll text-[15px] md:text-[15px] leading-7"
                placeholder="Type or paste text…"
              />
            </section>

            {/* Right: outputs */}
            <section className="flex flex-col gap-4 min-w-0">
              <div className={panel}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 id="tok-tokens-label" className="text-sm font-medium text-neutral-200">
                    Tokens
                  </h2>
                  <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 text-xs text-neutral-300">
                    <input
                      type="checkbox"
                      checked={showWs}
                      onChange={(e) => setShowWs(e.target.checked)}
                      className="size-4 accent-sky-500"
                    />
                    Show whitespace
                  </label>
                </div>
                <div id="tok-stats" className="mb-3 grid grid-cols-3 gap-1.5" aria-label="Text statistics">
                  <div className="min-w-0 rounded-md border border-sky-400/20 bg-sky-400/[0.07] px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wide text-sky-300/80">Tokens</div>
                    <div className="truncate text-sm font-semibold tabular-nums text-sky-100">
                      {result && !result.error ? tokens.length : "–"}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-md border border-violet-400/20 bg-violet-400/[0.07] px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wide text-violet-300/80">Code points</div>
                    <div className="truncate text-sm font-semibold tabular-nums text-violet-100">{codePoints}</div>
                  </div>
                  <div className="min-w-0 rounded-md border border-amber-400/20 bg-amber-400/[0.07] px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wide text-amber-300/80">UTF-8 bytes</div>
                    <div className="truncate text-sm font-semibold tabular-nums text-amber-100">{byteCount}</div>
                  </div>
                </div>
                {phase === "error" || (busy && result?.error) ? (
                  <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
                    <p className="font-medium">
                      {result.error.input
                        ? `This text can't be tokenized with ${labelOf(result.tokenizer)}.`
                        : `Couldn't load the ${labelOf(result.tokenizer)} tokenizer.`}
                    </p>
                    <p className="mt-1 text-xs text-red-200/80">
                      {result.error.input
                        ? `${result.error.message}. Only <|endoftext|> is accepted as a special token here.`
                        : String(result.error?.message ?? result.error)}
                    </p>
                    {!result.error.input && (
                      <button
                        type="button"
                        onClick={onRetry}
                        disabled={busy}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-red-300/40 px-3 py-1.5 text-sm text-red-50 hover:bg-red-500/20 disabled:opacity-60"
                      >
                        <RotateCw className="size-4" aria-hidden="true" />
                        {busy ? "Retrying…" : "Retry"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    id="tok-tokens"
                    ref={coloredContainerRef}
                    role="listbox"
                    tabIndex={0}
                    aria-labelledby="tok-tokens-label"
                    aria-describedby="tok-inspector"
                    aria-busy={busy || phase === "loading"}
                    aria-activedescendant={activeIndex === null ? undefined : `tok-t-${activeIndex}`}
                    data-has-active={activeIndex === null ? undefined : ""}
                    onKeyDown={handleKeyDown}
                    {...pointerProps("tokens")}
                    className={`${listBox} ${dim} min-h-24 max-h-[50vh] md:max-h-[40vh] whitespace-pre-wrap break-words [unicode-bidi:plaintext] text-[15px] leading-8`}
                  >
                    {phase === "loading" ? (
                      skeleton
                    ) : tokens.length === 0 ? (
                      <span className="text-sm text-neutral-400">Type or paste text to see its tokens.</span>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: tokenOptions }} />
                    )}
                  </div>
                )}
                {/* Inspector: text form of the active token */}
                <p id="tok-inspector" className="mt-3 min-h-10 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-neutral-300">
                  {activeToken ? (
                    <>
                      <span className="font-semibold text-sky-200">
                        #{activeIndex + 1} of {tokens.length}
                      </span>
                      {" · "}
                      <span className="font-mono text-neutral-100">
                        {JSON.stringify(tokenLabel(activeToken))}
                      </span>
                      {" · ID "}
                      <span className="font-mono text-violet-200">{activeToken.id}</span>
                      {activeToken.bytes && (
                        <>
                          {` · ${activeToken.bytes.length} ${activeToken.bytes.length === 1 ? "byte" : "bytes"}: `}
                          <span className="font-mono text-amber-200">{toHex(activeToken.bytes)}</span>
                        </>
                      )}
                      {activeToken.piece !== undefined && ` · vocabulary piece ${JSON.stringify(activeToken.piece)}`}
                      {activeToken.kind === "special" && " · special token"}
                      {(activeToken.kind === "fragment" || activeToken.kind === "mixed") &&
                        " · includes a partial UTF-8 character that combines with neighbouring tokens"}
                    </>
                  ) : (
                    "Hover, tap, or use the arrow keys on a token to inspect it."
                  )}
                </p>
              </div>

              {/* Numeric IDs */}
              <div className={panel}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 id="tok-ids-label" className="text-sm font-medium text-neutral-200">
                    Token IDs
                  </h2>
                  <button
                    type="button"
                    onClick={copyIds}
                    disabled={phase !== "ready"}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    <Copy className="size-3.5" aria-hidden="true" />
                    Copy IDs
                  </button>
                </div>
                <div
                  id="tok-ids"
                  ref={idsContainerRef}
                  role="listbox"
                  tabIndex={0}
                  aria-labelledby="tok-ids-label"
                  aria-busy={busy || phase === "loading"}
                  aria-activedescendant={activeIndex === null ? undefined : `tok-i-${activeIndex}`}
                  onKeyDown={handleKeyDown}
                  {...pointerProps("ids")}
                  className={`${listBox} ${dim} min-h-16 max-h-[30vh] md:max-h-[24vh] font-mono text-[13px] leading-6 tabular-nums text-neutral-200 break-words`}
                >
                  {phase === "loading" ? (
                    skeleton
                  ) : (
                    <>
                      <span aria-hidden="true">[</span>
                      <span dangerouslySetInnerHTML={{ __html: idOptions }} />
                      <span aria-hidden="true">]</span>
                    </>
                  )}
                </div>
                <p role="status" className={`mt-2 text-xs ${copyState === "failed" ? "text-red-300" : "text-neutral-400"}`}>
                  {copyState === "copied"
                    ? "Copied IDs to the clipboard."
                    : copyState === "failed"
                    ? "Copy failed. Select the IDs above and copy them manually."
                    : ""}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
