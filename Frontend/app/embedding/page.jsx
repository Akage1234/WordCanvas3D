"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import VisualizerLayout from "@/components/VisualizerLayout";
import EmbeddingCanvas from "@/components/EmbeddingCanvas";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
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
  wordCount,
  onWordCountChange,
  searchWord,
  onSearchWordChange,
  useClusterColors,
  onUseClusterColorsChange,
  showClusterEdges,
  onShowClusterEdgesChange,
  wordsList = [],
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Memoize sorted words to avoid recalculation on every render
  const sortedWords = useMemo(() => {
    const sorted = [...wordsList];
    if (searchWord && sorted.includes(searchWord)) {
      const index = sorted.indexOf(searchWord);
      sorted.splice(index, 1);
      sorted.unshift(searchWord);
    }
    return sorted;
  }, [wordsList, searchWord]);
  
  // Filter and limit words for performance (max 300 results)
  const filteredWords = useMemo(() => {
    if (!open) return []; // Don't filter when closed
    
    let filtered = sortedWords;
    
    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = sortedWords.filter(word => 
        word.toLowerCase().includes(query)
      );
    } else {
      // When no search query, only show first 50 items for fast initial render
      filtered = sortedWords.slice(0, 50);
    }
    
    // Always include the selected word if it exists and isn't already in the list
    if (searchWord && !filtered.includes(searchWord)) {
      filtered = [searchWord, ...filtered];
    }
    
    // Limit total results to 300 for performance
    return filtered.slice(0, 300);
  }, [sortedWords, searchQuery, open, searchWord]);

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
            <SelectItem value="glove_50d">GloVe 50D</SelectItem>
            <SelectItem value="glove_100D">GloVe 100D</SelectItem>
            <SelectItem value="glove_200D">GloVe 200D</SelectItem>
            <SelectItem value="glove_300D">GloVe 300D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      {/* Word Count Selector */}
      <div className="space-y-2">
        <label htmlFor="word-count-select" className="text-sm font-medium">
          Word Count
        </label>
        <Select value={wordCount} onValueChange={onWordCountChange}>
          <SelectTrigger id="word-count-select" className="w-full">
            <SelectValue placeholder="Select word count" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1000">1,000 words</SelectItem>
            <SelectItem value="5000">5,000 words</SelectItem>
            <SelectItem value="10000">10,000 words</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      {/* Word Search */}
      {/* Word Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Word Search</label>
        <Popover open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            // Clear search query when closing
            setSearchQuery("");
          }
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {searchWord ? searchWord : "Search for a word..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command 
              shouldFilter={false}
              onValueChange={(value) => {
                // Handle value change for searching
                if (value !== searchWord) {
                  setSearchQuery(value);
                }
              }}
            >
              <CommandInput 
                placeholder="Search words..." 
                className="h-9"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery ? "No word found." : `Type to search ${wordsList.length} words...`}
                </CommandEmpty>
                <CommandGroup>
                  {filteredWords.map((word) => (
                    <CommandItem
                      key={word}
                      value={word}
                      onSelect={(currentValue) => {
                        onSearchWordChange(
                          currentValue === searchWord ? "" : currentValue
                        );
                        setSearchQuery("");
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
                  {searchQuery && filteredWords.length >= 300 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Showing first 300 results. Refine your search for more.
                    </div>
                  )}
                  {!searchQuery && wordsList.length > 50 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Type to search {wordsList.length} words...
                    </div>
                  )}
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

      <Separator className="my-4" />

      {/* Cluster Edges Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="cluster-edges"
          checked={showClusterEdges}
          onCheckedChange={onShowClusterEdgesChange}
        />
        <label
          htmlFor="cluster-edges"
          className="text-sm font-medium cursor-pointer"
        >
          Connect Clusters with Edges
        </label>
      </div>
    </div>
  );
}

export default function EmbeddingPage() {
  const [embeddingModel, setEmbeddingModel] = useState("glove_50d");
  const [wordCount, setWordCount] = useState("1000");
  const [searchWord, setSearchWord] = useState("");
  const [useClusterColors, setUseClusterColors] = useState(true);
  const [showClusterEdges, setShowClusterEdges] = useState(true);
  const [wordsList, setWordsList] = useState([]);
  const canvasRef = useRef(null);

  // Get words list from canvas component
  useEffect(() => {
    const checkWords = () => {
      if (canvasRef.current?.getWords) {
        const words = canvasRef.current.getWords();
        if (words && words.length > 0) {
          // Only update if the list actually changed
          setWordsList(prev => {
            if (prev.length !== words.length) {
              return words;
            }
            // Deep comparison only if lengths match (avoid expensive JSON.stringify on every check)
            if (prev.length > 0 && prev[0] !== words[0]) {
              return words;
            }
            return prev;
          });
        }
      }
    };

    // Check initially
    checkWords();
    
    // Longer intervals for larger datasets to reduce CPU usage
    const intervalMs = wordCount === "10000" ? 2000 : wordCount === "5000" ? 1000 : 500;
    const interval = setInterval(checkWords, intervalMs);

    return () => clearInterval(interval);
  }, [embeddingModel, wordCount]); // Removed wordsList.length dependency to avoid re-running effect

  return (
    <>
      <Drawer>

          <div className="justify-self-end me-4">
            <DrawerTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
                Learn about Embedding Space
              </button>
            </DrawerTrigger>
          </div>

        <DrawerContent className="flex flex-col max-h-[90vh] custom-scroll">
          <div className="mx-auto w-full max-w-2xl overflow-y-auto flex-1 px-4 pt-4">
            <DrawerHeader>
              <DrawerTitle>What is Embedding Space?</DrawerTitle>
              <DrawerDescription>
                Embedding space is a high-dimensional mathematical space where words, 
                sentences, or other linguistic units are represented as vectors. These 
                vectors capture semantic and syntactic relationships, allowing similar 
                meanings to be positioned close together in the space. Word embeddings 
                transform discrete text into continuous vectors that machine learning 
                models can understand and manipulate.
              </DrawerDescription>
            </DrawerHeader>

            <div className="space-y-4 pb-4">
              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-4">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  Semantic Clustering
                </div>
                <div className="text-sm text-neutral-300 mb-2">
                  Words with similar meanings naturally cluster together in embedding space. 
                  For example, words like "king", "queen", "prince" would be positioned 
                  close to each other because they share semantic relationships.
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-200 border border-blue-700/50">
                    king
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-200 border border-blue-700/50">
                    queen
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-200 border border-blue-700/50">
                    prince
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-200 border border-blue-700/50">
                    royal
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-4">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  Dimensionality
                </div>
                <div className="text-sm text-neutral-300 mb-2">
                  Word embeddings typically exist in high-dimensional spaces (50-300+ dimensions). 
                  The 3D visualization you see is a projection that preserves relationships while 
                  making the space visually interpretable. Each dimension captures different 
                  linguistic features.
                </div>
                <div className="text-xs text-neutral-400 mt-2">
                  Current model: <span className="font-semibold text-neutral-200">{embeddingModel}</span>
                </div>
              </div>

              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-4">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  Distance as Similarity
                </div>
                <div className="text-sm text-neutral-300">
                  The distance between vectors in embedding space represents semantic similarity. 
                  Closer vectors indicate more similar meanings. This property enables applications 
                  like semantic search, recommendation systems, and word analogy tasks.
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="mx-auto w-full max-w-2xl px-4 pb-4">
            <DrawerClose asChild>
              <button className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
                Close
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <VisualizerLayout
        leftPanel={
          <EmbeddingControls
            embeddingModel={embeddingModel}
            onEmbeddingModelChange={setEmbeddingModel}
            wordCount={wordCount}
            onWordCountChange={setWordCount}
            searchWord={searchWord}
            onSearchWordChange={setSearchWord}
            useClusterColors={useClusterColors}
            onUseClusterColorsChange={setUseClusterColors}
            showClusterEdges={showClusterEdges}
            onShowClusterEdgesChange={setShowClusterEdges}
            wordsList={wordsList}
          />
        }
        rightCanvas={
          <EmbeddingCanvas
            ref={canvasRef}
            embeddingModel={embeddingModel}
            wordCount={wordCount}
            searchWord={searchWord}
            useClusterColors={useClusterColors}
            showClusterEdges={showClusterEdges}
          />
        }
      />
    </>
  );
}
