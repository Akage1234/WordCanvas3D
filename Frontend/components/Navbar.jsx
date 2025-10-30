import React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export function Navbar() {
  return (
    <nav className="flex sticky top-0 z-50 items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm shadow-2xl mb-8 dark:bg-black/80 dark:shadow-neutral-800/60">
      <Link href="/" className="flex items-center text-2xl font-bold tracking-tight cursor-pointer hover:opacity-90 transition-opacity">
        <img
          src="/logo.png"
          alt="WordCanvas3D logo"
          className="h-8 w-8 mr-4"
        />
        Word
        <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">Canvas3D</span>
      </Link>
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-8 items-center text-lg">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/tokenizer" className="transition-colors cursor-pointer">
                Tokenizer
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/embedding" className="transition-colors cursor-pointer">
                Embedding
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/vector-playground" className="transition-colors cursor-pointer">
                Vector Playground
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}