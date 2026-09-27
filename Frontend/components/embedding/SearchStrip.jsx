"use client";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

// Thin phone search for the embedding map. Suggestions appear above the bar only while typing; picking one
// selects the word and hides them, but the bar stays open so you can try word after word.
export default function SearchStrip({ words, selected, onSelect, onClear }) {
  const t = useTranslations("Embedding");
  const [query, setQuery] = useState(selected ?? "");
  const [typing, setTyping] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = [], contains = [];
    for (const w of words) {
      const lw = w.toLowerCase();
      if (lw.startsWith(q)) starts.push(w);
      else if (lw.includes(q)) contains.push(w);
      if (starts.length >= 30) break;
    }
    return [...starts, ...contains].slice(0, 30);
  }, [words, query]);

  const pick = (word) => {
    onSelect(word);
    setQuery(word);
    setTyping(false);
  };

  return (
    <div className="relative">
      {typing && query.trim() && (
        <ul
          role="listbox"
          aria-label={t("suggestions")}
          className="absolute inset-x-0 bottom-full mb-2 max-h-[38vh] overflow-y-auto overscroll-contain custom-scroll rounded-2xl border border-white/10 bg-neutral-950/90 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {matches.length ? matches.map((w) => (
            <li key={w}>
              <button
                type="button"
                role="option"
                aria-selected={w === selected}
                onClick={() => pick(w)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${w === selected ? "bg-cyan-300/10 text-cyan-200" : "text-neutral-200 hover:bg-white/[0.06]"}`}
              >
                {w}
              </button>
            </li>
          )) : (
            <li className="px-3 py-2 text-sm text-neutral-500">{words.length ? t("noWordsFound") : t("loadingWords")}</li>
          )}
        </ul>
      )}
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); if (matches[0]) pick(matches[0]); }}
        className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-black/60 pl-4 pr-1.5 shadow-2xl backdrop-blur-xl focus-within:border-cyan-300/40"
      >
        <Search className="h-4 w-4 flex-none text-neutral-400" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setTyping(true); }}
          onFocus={() => query.trim() && setTyping(true)}
          placeholder={t("searchAnyWord")}
          aria-label={t("searchAnyWord")}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-neutral-500 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setTyping(false); onClear(); }}
            aria-label={t("clearSearch")}
            className="grid h-9 w-9 flex-none place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
