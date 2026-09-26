"use client";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// "How do I use this page?" for each tool: a few numbered steps and one tip (messages: PageGuide.<page>).
// The concept itself (what is tokenization, etc.) lives in ConceptSheet behind the (i) button.
export function PageGuide({ page, className = "" }) {
  const t = useTranslations("PageGuide");
  const g = t.raw(page);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={g.title}
          title={t("buttonTitle")}
          className={`inline-flex items-center justify-center rounded-full text-blue-400 transition-colors hover:text-blue-300 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${className}`}
          style={{ lineHeight: 0 }}
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[1000] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-white/10 bg-neutral-950/95 p-5 backdrop-blur-xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-300">{t("kicker")}</div>
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
