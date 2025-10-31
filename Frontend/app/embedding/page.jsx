"use client";
import VisualizerLayout from "@/components/VisualizerLayout";
import EmbeddingCanvas from "@/components/EmbeddingCanvas";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function EmbeddingControls() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        Embedding Controls{" "}
        <HoverCard>
          <HoverCardTrigger asChild>
            <button
              aria-label="About Embedding Visualizer"
              className="text-blue-400 hover:text-blue-600 transition-colors"
              style={{ lineHeight: 0 }}
              tabIndex={0}
            >
              <HelpCircle size={20} />
            </button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="text-sm space-y-3">
              <div className="font-semibold text-white">
                Embedding Visualizer
              </div>
              <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                <li>
                  Select a pretrained embedding model and load its 2D or 3D
                  projection.
                </li>
                <li>
                  Hover or search words to highlight their position in the
                  embedding space.
                </li>
                <li>
                  Observe how semantically similar words cluster together in
                  space.
                </li>
              </ul>
            </div>
          </HoverCardContent>
        </HoverCard>
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Visualize embeddings in 3D space.
      </p>
      <Separator className="my-4" />
      {/* Add your control components here later */}
    </div>
  );
}

export default function EmbeddingPage() {
  return (
    <VisualizerLayout
      leftPanel={<EmbeddingControls />}
      rightCanvas={<EmbeddingCanvas />}
    />
  );
}
