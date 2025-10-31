'use client';
import React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { usePathname } from "next/navigation";


export function Navbar() {

  const pathname = usePathname();
  const isActive = (href) => pathname === href;


  return (
    <nav className="flex sticky top-2 rounded-full mx-auto max-w-3xl z-50 items-center justify-between px-6 py-4 bg-white/50 dark:bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-xl mb-8 outline outline-white/20 dark:outline-white/10">
      <Link
        href="/"
        className="flex items-center text-2xl font-bold tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
      >
        <img src="/logo.png" alt="WordCanvas3D logo" className="h-8 w-8 mr-4" />
        Word
        <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
          Canvas3D
        </span>
      </Link>
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-8 items-center text-lg">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/tokenizer"
                className={`transition-colors cursor-pointer ${
                  isActive("/tokenizer")
                    ? "text-white font-semibold bg-blue-500/20 rounded-full px-4 py-2"
                    : "text-inherit hover:text-white"
                }`}
              >
                Tokenizer
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/embedding"
                className={`transition-colors cursor-pointer ${
                  isActive("/embedding")
                    ? "text-white font-semibold bg-blue-500/20 rounded-full px-4 py-2"
                    : "text-inherit hover:text-white"
                }`}
              >
                Embedding
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/vector-playground"
                className={`transition-colors cursor-pointer ${
                  isActive("/vector-playground")
                    ? "text-white font-semibold bg-blue-500/20 rounded-full px-4 py-2"
                    : "text-inherit hover:text-white"
                }`}
              >
                Vector Playground
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
