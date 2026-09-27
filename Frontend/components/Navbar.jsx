'use client';
import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { BookOpen, Box, Check, Globe, Menu, Sigma, Type, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLayoutMode } from "@/components/LayoutContext";

// Label and hint for each item live in messages under Nav.<id>.
const NAV_ITEMS = [
  { id: "learn", href: "/learn", Icon: BookOpen },
  { id: "tokenizer", href: "/tokenizer", Icon: Type },
  { id: "embedding", href: "/embedding", Icon: Box },
  { id: "vectors", href: "/vector-playground", Icon: Sigma },
];

const REPO_URL = "https://github.com/Akage1234/WordCanvas3D";
const PROFILE_URL = "https://github.com/Akage1234";

function GithubMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

// Language names stay in their own script. Switching keeps you on the same page.
const LANGUAGES = [["en", "English", "EN"], ["zh", "中文", "中"], ["ja", "日本語", "日"], ["es", "Español", "ES"]];

function LanguageMenu({ variant = "icon", compact }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (variant === "rows") {
    return (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 px-3 py-2 text-sm">
        <Globe className="h-4 w-4 flex-none text-neutral-400" />
        {LANGUAGES.map(([code, name]) => (
          <Link
            key={code}
            href={pathname}
            locale={code}
            lang={code}
            aria-current={code === locale ? "true" : undefined}
            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 transition-colors ${code === locale ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/[0.06] hover:text-white"}`}
          >
            {name}
          </Link>
        ))}
      </div>
    );
  }
  const current = LANGUAGES.find(([code]) => code === locale) ?? LANGUAGES[0];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`} aria-label={t("languageLabel")}>
          <Globe className="h-4 w-4" />{!compact && current[2]}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[1000] w-44 rounded-2xl border-white/10 bg-neutral-950/95 p-1.5 backdrop-blur-xl">
        {LANGUAGES.map(([code, name]) => (
          <Link
            key={code}
            href={pathname}
            locale={code}
            lang={code}
            onClick={() => setOpen(false)}
            aria-current={code === locale ? "true" : undefined}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${code === locale ? "bg-white/[0.06] text-white" : "text-neutral-300 hover:bg-white/[0.04] hover:text-white"}`}
          >
            {name}
            {code === locale && <Check className="h-4 w-4 text-cyan-300" />}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Repo and author links: a small corner cluster on wide screens, rows in the phone menu.
function SocialLinks({ variant = "icons", compact }) {
  const t = useTranslations("Nav");
  if (variant === "rows") {
    const row = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/[0.05] hover:text-white";
    return (
      <div className="flex flex-col gap-1">
        <LanguageMenu variant="rows" />
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={row}><GithubMark className="h-4 w-4" />{t("sourceCode")}</a>
        <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer" className={row}>
          <img src="https://github.com/Akage1234.png?size=64" alt="" className="h-5 w-5 rounded-full" />{t("madeBy")}
        </a>
      </div>
    );
  }
  const btn = `inline-flex ${compact ? "h-9 w-9" : "h-10 w-10"} items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`;
  return (
    <div className="flex items-center gap-1">
      <LanguageMenu compact={compact} />
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={btn} aria-label={t("repoLabel")} title={t("sourceCode")}>
        <GithubMark className="h-[18px] w-[18px]" />
      </a>
      <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer" className={btn} aria-label={t("authorLabel")} title={t("madeBy")}>
        <img src="https://github.com/Akage1234.png?size=64" alt="" className="h-7 w-7 rounded-full ring-1 ring-white/20" />
      </a>
    </div>
  );
}

const glass = "bg-black/40 supports-[backdrop-filter]:bg-black/30 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)]";
const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function Logo({ size = "md", onClick }) {
  const sizes = {
    sm: ["text-lg", "h-6 w-6 mr-2"],
    md: ["text-base sm:max-md:text-lg md:max-[1279px]:text-xl min-[1280px]:text-2xl", "h-5 w-5 sm:max-md:h-6 sm:max-md:w-6 md:max-[1279px]:h-7 md:max-[1279px]:w-7 min-[1280px]:h-8 min-[1280px]:w-8 mr-2 sm:max-[1279px]:mr-3 min-[1280px]:mr-4"],
    lg: ["text-xl", "h-8 w-8 mr-3"],
  }[size];
  return (
    <Link href="/" onClick={onClick} className={`group flex items-center font-bold tracking-tight rounded-full ${sizes[0]} ${focusRing}`}>
      <img src="/logo.png" alt="" className={`${sizes[1]} flex-shrink-0 transition-transform duration-500 ease-out group-hover:rotate-[-18deg] group-hover:scale-105`} />
      Word
      <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">Canvas3D</span>
    </Link>
  );
}

function DesktopLinks({ isActive, compact }) {
  const t = useTranslations("Nav");
  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map(({ id, href }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-colors duration-200 ${compact ? "px-3 py-1.5 text-sm" : "px-2.5 min-[1280px]:px-3.5 py-2 text-sm min-[1280px]:text-[15px]"} ${focusRing} ${
                active ? "bg-white/[0.08] text-white" : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-100"
              }`}
            >
              {t(`${id}.label`)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MobileMenu({ isActive, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const t = useTranslations("Nav");
  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <button
          className={`md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-200 transition-colors hover:bg-white/10 active:bg-white/15 ${focusRing} ${triggerClassName ?? ""}`}
          aria-label={t("openMenu")}
        >
          <Menu className="h-5 w-5" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-neutral-950/90 backdrop-blur-2xl border-l border-white/10">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{t("drawerTitle")}</DrawerTitle>
          <DrawerDescription>{t("drawerDescription")}</DrawerDescription>
        </DrawerHeader>
        <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain p-5 custom-scroll">
          <div className="mb-8 flex items-center justify-between">
            <Logo size="lg" onClick={close} />
            <DrawerClose asChild>
              <button className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`} aria-label={t("closeMenu")}>
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>
          <nav className="flex flex-1 flex-col gap-1.5 pb-2" aria-label={t("main")}>
            {NAV_ITEMS.map(({ id, href, Icon }, i) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  style={{ animationDelay: `${60 + i * 50}ms` }}
                  className={`group flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition-colors duration-200 animate-in fade-in slide-in-from-right-4 fill-mode-both ${focusRing} ${
                    active
                      ? "border-cyan-300/25 bg-cyan-300/[0.07] text-white"
                      : "border-transparent text-neutral-300 hover:bg-white/[0.05] hover:text-white active:bg-white/10"
                  }`}
                >
                  <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl border transition-colors ${active ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-neutral-400 group-hover:text-neutral-200"}`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[17px] font-medium leading-tight">{t(`${id}.label`)}</span>
                    <span className="mt-0.5 text-[13px] text-neutral-500">{t(`${id}.hint`)}</span>
                  </span>
                  {active && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-3">
            <SocialLinks variant="rows" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function Navbar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);
  const { isMinimalistMode } = useLayoutMode();
  const [scrolled, setScrolled] = useState(false);
  // Only show minimalist mode on visualizer pages
  const isVisualizerPage = pathname === '/embedding' || pathname === '/vector-playground';
  const effectiveMinimalistMode = isVisualizerPage && isMinimalistMode;

  // The bar gets a touch more solid once content scrolls under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Minimalist mode layout (fullscreen canvas pages) - Only on visualizer pages
  if (effectiveMinimalistMode) {
    return (
      <>
        <div className={`fixed top-3 left-3 z-50 rounded-full px-3.5 py-2 ${glass}`}>
          <Logo size="sm" />
        </div>
        <nav className={`fixed top-3 right-3 z-50 hidden md:flex items-center gap-1 rounded-full p-1 ${glass}`} aria-label={t("main")}>
          <DesktopLinks isActive={isActive} compact />
          <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
          <SocialLinks />
        </nav>
        <div className={`fixed top-3 right-3 z-50 md:hidden rounded-full ${glass}`}>
          <MobileMenu isActive={isActive} />
        </div>
      </>
    );
  }

  // Standard layout (sidebar pages)
  return (
    <>
    <nav
      aria-label={t("main")}
      className={`flex sticky top-2 mx-2 mt-2 md:max-[1279px]:mx-4 min-[1280px]:mx-auto max-w-3xl md:max-[1279px]:max-w-none z-50 items-center justify-between rounded-full pl-4 pr-2 md:pl-6 md:pr-3 py-1.5 md:py-2.5 mb-4 md:mb-8 transition-[background-color,box-shadow] duration-300 ${glass} ${scrolled ? "bg-black/60 supports-[backdrop-filter]:bg-black/55" : ""}`}
    >
      <Logo />
      <div className="hidden md:flex items-center gap-1">
        <DesktopLinks isActive={isActive} />
        {/* No room for the corner pill below 1280px, so the language/GitHub/profile buttons sit in the bar */}
        <span className="mx-1 h-5 w-px bg-white/10 min-[1280px]:hidden" aria-hidden="true" />
        <div className="min-[1280px]:hidden"><SocialLinks compact /></div>
      </div>
      <MobileMenu isActive={isActive} />
    </nav>
    {/* Outside the bar: its backdrop-filter would make it the containing block for this fixed cluster */}
    <div className={`fixed top-3 right-4 z-50 hidden min-[1280px]:block rounded-full p-1 ${glass}`}>
      <SocialLinks />
    </div>
    </>
  );
}
