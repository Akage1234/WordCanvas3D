"use client";
import { Github } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

export default function AuthorHoverCard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div className="fixed bottom-6 right-6 z-[99999] pointer-events-auto" style={{ isolation: 'isolate', zIndex: 99999 }}>
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            aria-label="About the author"
            className="rounded-full bg-blue-600 hover:bg-blue-500 p-2.5 text-white shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
            style={{ lineHeight: 0 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              fill="none"
              viewBox="0 0 20 20"
              className="rounded-full"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="10" fill="white" opacity="0.13" />
              <path
                d="M10 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.5c-2.33 0-7 1.17-7 3.5V18h14v-2.5c0-2.33-4.67-3.5-7-3.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 !z-[99999]" side="top" align="end" style={{ zIndex: 99999 }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="WordCanvas Logo" 
                width={24} 
                height={24}
                className="rounded"
              />
              <div className="font-semibold text-white">WordCanvas3D</div>
            </div>
            <p className="text-sm text-neutral-300">
              Explore how AI understands language through tokens and embeddings.
            </p>
            <div className="pt-2 border-t border-neutral-700">
              <div className="text-xs text-neutral-400">
                Created by{" "}
                <a
                  href="https://www.linkedin.com/in/ajay-kumar-0a024521a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white transition-colors"
                >
                  @Akage
                </a>{" "}
                in 2025
              </div>
            </div>
            <a
              href="https://github.com/Akage1234/WordCanvas3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}

