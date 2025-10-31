"use client";
import VisualizerLayout from "@/components/VisualizerLayout";
import VectorPlaygroundCanvas from "@/components/VectorPlaygroundCanvas";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
function VectorPlaygroundControls() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        Vector Playground{" "}
        <HoverCard>
          <HoverCardTrigger asChild>
            <button
              aria-label="About Vector Playground"
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
                Vector Playground
              </div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>
                    Experiment with vector arithmetic (addition, subtraction, scaling).
                  </li>
                  <li>
                    Visualize the results of analogy operations like:
                    <span className="font-mono"> <code className="text-red-400">king - man + woman = ?</code></span>
                  </li>
                  <li>
                    Analyze distances and directions between selected points.
                  </li>
                  <li>
                    Get intuition for how vector math underpins word analogies.
                  </li>
                </ul>
            </div>
          </HoverCardContent>
        </HoverCard>
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Perform vector math and analogy experiments here.
      </p>
      <Separator className="my-4" />
      {/* Add controls for vector operations */}
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <VisualizerLayout
      leftPanel={<VectorPlaygroundControls />}
      rightCanvas={<VectorPlaygroundCanvas />}
    />
  );
}
