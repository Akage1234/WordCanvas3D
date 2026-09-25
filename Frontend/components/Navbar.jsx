'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { usePathname } from "next/navigation";
import { BookOpen, Box, Menu, Sigma, Type, X } from "lucide-react";
import { useLayoutMode } from "@/components/LayoutContext";

const NAV_ITEMS = [
  { href: "/learn", label: "Learn", hint: "Articles and guides", Icon: BookOpen },
  { href: "/tokenizer", label: "Tokenizer", hint: "See how text is split", Icon: Type },
  { href: "/embedding", label: "Embedding", hint: "Explore words in 3D", Icon: Box },
  { href: "/vector-playground", label: "Vector Playground", hint: "Do math with meaning", Icon: Sigma },
];

const glass = "bg-black/40 supports-[backdrop-filter]:bg-black/30 backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)]";
const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function Logo({ size = "md", onClick }) {
  const sizes = {
    sm: ["text-lg", "h-6 w-6 mr-2"],
    md: ["text-base sm:text-lg md:text-2xl", "h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mr-2 sm:mr-3 md:mr-4"],
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
  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-colors duration-200 ${compact ? "px-3 py-1.5 text-sm" : "px-3 lg:px-3.5 py-2 text-sm lg:text-[15px]"} ${focusRing} ${
                active ? "bg-white/[0.08] text-white" : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-100"
              }`}
            >
              {label}
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
  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <button
          className={`md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-200 transition-colors hover:bg-white/10 active:bg-white/15 ${focusRing} ${triggerClassName ?? ""}`}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-neutral-950/90 backdrop-blur-2xl border-l border-white/10">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerDescription>Pages on WordCanvas3D</DrawerDescription>
        </DrawerHeader>
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-center justify-between">
            <Logo size="lg" onClick={close} />
            <DrawerClose asChild>
              <button className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>
          <nav className="flex flex-1 flex-col gap-1.5" aria-label="Main">
            {NAV_ITEMS.map(({ href, label, hint, Icon }, i) => {
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
                    <span className="text-[17px] font-medium leading-tight">{label}</span>
                    <span className="mt-0.5 text-[13px] text-neutral-500">{hint}</span>
                  </span>
                  {active && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />}
                </Link>
              );
            })}
          </nav>
          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-neutral-500">Free &amp; open source · no sign-up</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function Navbar() {
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
        <nav className={`fixed top-3 right-3 z-50 hidden md:block rounded-full p-1 ${glass}`} aria-label="Main">
          <DesktopLinks isActive={isActive} compact />
        </nav>
        <div className={`fixed top-3 right-3 z-50 md:hidden rounded-full ${glass}`}>
          <MobileMenu isActive={isActive} />
        </div>
      </>
    );
  }

  // Standard layout (sidebar pages)
  return (
    <nav
      aria-label="Main"
      className={`flex sticky top-2 mx-auto max-w-3xl z-50 items-center justify-between rounded-full pl-4 pr-2 md:pl-6 md:pr-3 py-1.5 md:py-2.5 mb-4 md:mb-8 transition-[background-color,box-shadow] duration-300 ${glass} ${scrolled ? "bg-black/60 supports-[backdrop-filter]:bg-black/55" : ""}`}
    >
      <Logo />
      <div className="hidden md:block">
        <DesktopLinks isActive={isActive} />
      </div>
      <MobileMenu isActive={isActive} />
    </nav>
  );
}
