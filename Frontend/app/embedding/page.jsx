"use client";
import { useState, useRef, useEffect } from "react";
import VisualizerLayout from "@/components/VisualizerLayout";
import EmbeddingCanvas from "@/components/EmbeddingCanvas";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { HelpCircle, Check, ChevronsUpDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function EmbeddingControls({ 
  embeddingModel, 
  onEmbeddingModelChange,
  searchWord,
  onSearchWordChange,
  useClusterColors,
  onUseClusterColorsChange,
  wordsList = []
}) {
  const [open, setOpen] = useState(false);
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
            <SelectItem value="glove">GloVe 50D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      {/* Word Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Word Search
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {searchWord
                ? searchWord
                : "Search for a word..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search words..." className="h-9" />
              <CommandList>
                <CommandEmpty>No word found.</CommandEmpty>
                <CommandGroup>
                  {wordsList.map((word) => (
                    <CommandItem
                      key={word}
                      value={word}
                      onSelect={(currentValue) => {
                        onSearchWordChange(currentValue === searchWord ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      {word}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          searchWord === word ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-4" />

      {/* Cluster Color Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="cluster-colors"
          checked={useClusterColors}
          onCheckedChange={onUseClusterColorsChange}
        />
        <label
          htmlFor="cluster-colors"
          className="text-sm font-medium cursor-pointer"
        >
          Color by Similarity Cluster
        </label>
      </div>
    </div>
  );
}

export default function EmbeddingPage() {
  const [embeddingModel, setEmbeddingModel] = useState("glove");
  const [searchWord, setSearchWord] = useState("");
  const [useClusterColors, setUseClusterColors] = useState(false);
  const [wordsList, setWordsList] = useState([]);
  const canvasRef = useRef(null);

  // Get words list from canvas component
  useEffect(() => {
    const checkWords = () => {
      if (canvasRef.current?.getWords) {
        const words = canvasRef.current.getWords();
        if (words && words.length > 0 && words.length !== wordsList.length) {
          setWordsList(words);
        }
      }
    };

    // Check initially and then periodically
    checkWords();
    const interval = setInterval(checkWords, 500);

    return () => clearInterval(interval);
  }, [embeddingModel, wordsList.length]);

  return (
    <VisualizerLayout
      leftPanel={
        <EmbeddingControls
          embeddingModel={embeddingModel}
          onEmbeddingModelChange={setEmbeddingModel}
          searchWord={searchWord}
          onSearchWordChange={setSearchWord}
          useClusterColors={useClusterColors}
          onUseClusterColorsChange={setUseClusterColors}
          wordsList={wordsList}
        />
      }
      rightCanvas={
        <EmbeddingCanvas
          ref={canvasRef}
          embeddingModel={embeddingModel}
          searchWord={searchWord}
          useClusterColors={useClusterColors}
        />
      }
    />
  );
}
