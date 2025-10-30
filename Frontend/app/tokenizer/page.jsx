'use client'

import { useEffect, useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { tokenizeText } from '@/lib/tokenizer'
// import hover card atoms
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { HelpCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

export default function TokenizerPage() {
  const [text, setText] = useState('')
  const [tokens, setTokens] = useState([])
  const TOKENIZERS = [
    { label: "GPT-4.1 / 4o / mini (o200k_base)", value: "o200k_base" },
    { label: "GPT-4 / 3.5 (cl100k_base)", value: "cl100k_base" },
    { label: "GPT-3 (p50k_base)", value: "p50k_base" },
    { label: "Instruct (p50k_edit)", value: "p50k_edit" },
    { label: "Codex (r50k_base)", value: "r50k_base" },
    { label: "GPT-2 (gpt2)", value: "gpt2" },
  ];
  const [tokenizer, setTokenizer] = useState(TOKENIZERS[0].value);

  useEffect(() => {
    let alive = true;
    (async () => {
      const tks = await tokenizeText(text, tokenizer, {
        allowedSpecial: new Set(['<|endoftext|>']),
      });
      if (alive) setTokens(tks);
    })();
    return () => { alive = false };
  }, [text, tokenizer]);

  // Deterministic color per token id
  const colorFor = (id) => {
    const h = (id % 360)
    return `hsl(${h} 90% 70%)`
  }

  const ids = useMemo(() => tokens.map(t => t.id), [tokens])

  return (
    <>
    <div className="flex items-center justify-center gap-2 mb-6">
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
          <div className="text-sm">
            Enter or paste text on the left.<br />
            The right panels show the tokens produced by the GPT tokenization algorithm, with colors and numeric IDs.<br />
            Good for understanding how your text is split and encoded!
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
    <main className="px-6 md:px-10 lg:px-14 py-6">
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: input */}
        <section className="md:sticky md:top-20">
          <div className="rounded-lg border border-neutral-800/90 bg-neutral-800/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-400 text-white">Input</div>
              {/* Tokenizer selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded border border-neutral-700 px-3 py-1 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 transition-colors">
                    {TOKENIZERS.find(t => t.value === tokenizer)?.label}
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
              className="h-[62vh] md:h-[70vh] resize-none overflow-auto"
              placeholder="Type or paste text…"
            />
          </div>
        </section>

        {/* Right: outputs */}
        <section className="flex flex-col gap-6">
          {/* Highlighted tokens */}
          <div className="rounded-lg border border-neutral-800/60 bg-neutral-800/60 p-4">
            <div className="text-sm text-neutral-400 mb-2 text-white">Tokens (colored)</div>
            <div className="min-h-[28vh] max-h-[36vh] overflow-auto leading-7">
              {tokens.length === 0 ? (
                <span className="text-neutral-500">No tokens</span>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {tokens.map((t, i) => (
                    <span
                      key={i}
                      className="px-0.5 py-0.5 rounded"
                      style={{ backgroundColor: colorFor(t.id) }}
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
          <div className="rounded-lg border border-neutral-800/60 bg-neutral-800/60 p-4">
            <div className="text-sm text-neutral-400 mb-2 text-white">Token IDs</div>
            <div className="min-h-[18vh] max-h-[24vh] overflow-auto">
              {ids.length === 0 ? (
                <span className="text-neutral-500">[]</span>
              ) : (
                <code className="text-sm text-neutral-200 break-words">{`[ ${ids.join(' ')} ]`}</code>
              )}
            </div>
            <div className="text-xs text-neutral-400">
              Encoding: {tokenizer} • Tokens: {tokens.length}
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  )
}