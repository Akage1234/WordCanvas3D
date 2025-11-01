"use client";
import { useState } from "react";
import VisualizerLayout from "@/components/VisualizerLayout";
import VectorPlaygroundCanvas from "@/components/VectorPlaygroundCanvas";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function VectorPlaygroundControls({ embeddingModel, onEmbeddingModelChange, showGridlines, onShowGridlinesChange, wordsText, onWordsTextChange }) {
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

      {/* Embedding Selector */}
      <div className="space-y-2">
        <label htmlFor="embedding-select" className="text-sm font-medium">
          Embedding Model
        </label>
        <Select value={embeddingModel} onValueChange={onEmbeddingModelChange}>
          <SelectTrigger id="embedding-select" className="w-full">
            <SelectValue placeholder="Select embedding model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="glove_50d">GloVe 50D</SelectItem>
            <SelectItem value="glove_100D">GloVe 100D</SelectItem>
            <SelectItem value="glove_200D">GloVe 200D</SelectItem>
            <SelectItem value="glove_300D">GloVe 300D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      {/* Gridlines Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="gridlines"
          checked={showGridlines}
          onCheckedChange={onShowGridlinesChange}
        />
        <label
          htmlFor="gridlines"
          className="text-sm font-medium cursor-pointer"
        >
          Show Gridlines
        </label>
      </div>

      <Separator className="my-4" />

      {/* Words Input */}
      <div className="space-y-2">
        <Label htmlFor="words-input" className="text-sm font-medium">
          Words to Plot (up to 50)
        </Label>
        <Textarea
          id="words-input"
          value={wordsText}
          onChange={(e) => onWordsTextChange(e.target.value)}
          placeholder="Type words separated by spaces (e.g., man woman king queen)"
          className="min-h-[100px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {Math.min(wordsText.split(/\s+/).filter(w => w.trim().length > 0).length, 50)} / 50 words
        </p>
      </div>

      <Separator className="my-4" />
      {/* Add controls for vector operations */}
    </div>
  );
}

export default function PlaygroundPage() {
  const [embeddingModel, setEmbeddingModel] = useState("glove_50d");
  const [showGridlines, setShowGridlines] = useState(true);
  const [wordsText, setWordsText] = useState("");

  // Parse words from text, limit to 50
  const words = wordsText
    .split(/\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0)
    .slice(0, 50);

  return (
    <VisualizerLayout
      leftPanel={
        <VectorPlaygroundControls
          embeddingModel={embeddingModel}
          onEmbeddingModelChange={setEmbeddingModel}
          showGridlines={showGridlines}
          onShowGridlinesChange={setShowGridlines}
          wordsText={wordsText}
          onWordsTextChange={setWordsText}
        />
      }
      rightCanvas={
        <VectorPlaygroundCanvas
          embeddingModel={embeddingModel}
          showGridlines={showGridlines}
          words={words}
        />
      }
    />
  );
}
