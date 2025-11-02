'use client';
import React, { useState } from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";


export function Navbar() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/tokenizer", label: "Tokenizer" },
    { href: "/embedding", label: "Embedding" },
    { href: "/vector-playground", label: "Vector Playground" },
  ];

  return (
    <nav className="flex sticky top-2 rounded-full md:rounded-full mx-auto max-w-3xl z-50 items-center justify-between px-3 md:px-6 py-2 md:py-4 bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-xl mb-4 md:mb-8 outline outline-white/20 dark:outline-white/10">
      <Link
        href="/"
        className="flex items-center text-base sm:text-lg md:text-2xl font-bold tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
      >
        <img src="/logo.png" alt="WordCanvas3D logo" className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mr-2 sm:mr-3 md:mr-4 flex-shrink-0" />
        Word
        <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
          Canvas3D
        </span>
      </Link>
      
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:block">
        <NavigationMenuList className="flex space-x-6 md:space-x-8 items-center text-base md:text-lg">
          {navItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className={`transition-colors cursor-pointer ${
                    isActive(item.href)
                      ? "text-white font-semibold bg-blue-500/20 rounded-full px-3 md:px-4 py-1.5 md:py-2"
                      : "text-inherit hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Navigation - Hamburger Menu */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="right">
        <DrawerTrigger asChild className="md:hidden">
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-200 hover:bg-neutral-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-neutral-950/95 backdrop-blur-xl border-l border-white/10">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Navigation Menu</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center text-xl font-bold tracking-tight"
              >
                <img src="/logo.png" alt="WordCanvas3D logo" className="h-8 w-8 mr-3" />
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  WordCanvas3D
                </span>
              </Link>
              <DrawerClose asChild>
                <button
                  className="inline-flex items-center justify-center rounded-md p-2 text-neutral-200 hover:bg-neutral-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </DrawerClose>
            </div>
            <nav className="flex flex-col space-y-2 flex-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "text-white font-semibold bg-blue-500/20"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </DrawerContent>
      </Drawer>
    </nav>
  );
}
