"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

const glass = "bg-black/55 supports-[backdrop-filter]:bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl";

// Controls for the full-screen canvas pages (phones, and full-screen mode on larger screens): a dock of buttons, and whichever section is open floats
// just above it. Nothing is modal, so the 3D view stays visible and touchable while a section is open.
//   section = { id, icon, label, content: node | (close) => node, variant?: "card" | "strip" }
//   "card": a compact scrolling card with a title and close button; "strip": a thin bar with no chrome
//   (search, word inputs), so it covers as little of the canvas as possible.
export default function MobileDock({ sections }) {
  const t = useTranslations("Visualizer");
  const [openId, setOpenId] = useState(null);
  const open = sections.find((s) => s.id === openId);
  const close = () => setOpenId(null);
  // Lets canvas overlays (e.g. the word details tray) move up while a strip sits above the dock.
  const stripOpen = open?.variant === "strip";
  useEffect(() => {
    document.body.toggleAttribute("data-dock-strip", stripOpen);
    return () => document.body.removeAttribute("data-dock-strip");
  }, [stripOpen]);
  const content = open && (typeof open.content === "function" ? open.content(close) : open.content);

  return (
    <>
      {open && (open.variant === "strip" ? (
        <div key={open.id} className="fixed inset-x-3 md:inset-x-auto md:left-1/2 md:w-[520px] md:-translate-x-1/2 bottom-[84px] max-md:landscape:bottom-[62px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {content}
        </div>
      ) : (
        <section
          key={open.id}
          aria-label={open.label}
          className={`fixed inset-x-2 md:inset-x-auto md:left-1/2 md:w-[420px] md:-translate-x-1/2 bottom-[84px] max-md:landscape:bottom-[62px] z-50 flex max-h-[46vh] max-md:landscape:max-h-[60vh] flex-col rounded-2xl ${glass} animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h2 className="text-sm font-semibold text-neutral-200">{open.label}</h2>
            <button type="button" onClick={close} aria-label={t("close")} className="-mr-2 grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scroll px-4 pb-4">{content}</div>
        </section>
      ))}

      <div className={`fixed bottom-4 max-md:landscape:bottom-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 max-md:landscape:gap-1 rounded-full px-1.5 max-md:landscape:px-1 py-1.5 max-md:landscape:py-1 ${glass}`}>
        {sections.map(({ id, icon: Icon, label }) => {
          const active = id === openId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOpenId(active ? null : id)}
              aria-expanded={active}
              aria-label={label}
              className={`flex min-w-[54px] max-md:landscape:min-w-[45px] flex-col items-center justify-center gap-0.5 max-md:landscape:gap-0 rounded-full p-2 max-md:landscape:p-1.5 transition-colors ${active ? "bg-cyan-300/15 text-cyan-200" : "text-neutral-200 hover:bg-white/10"}`}
            >
              <Icon className="h-4 w-4 max-md:landscape:h-3.5 max-md:landscape:w-3.5" />
              <span className="text-[10px] max-md:landscape:text-[8px] font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
