"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import VisualizerLayout from "@/components/VisualizerLayout";
import EmbeddingCanvas from "@/components/EmbeddingCanvas";
import { PageGuide } from "@/components/PageGuide";
import { Check, ChevronsUpDown, Database, Search, Palette, AlertTriangle, X } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { badgeColor, clusterColor, DEFAULT_POINT_COLOR } from "@/components/embedding/embeddingPalette.mjs";
import ExplorationTray from "@/components/embedding/ExplorationTray";
import { clusterSummaries, exploreNetwork } from "@/components/embedding/exploration.mjs";
import explorationStyles from "@/components/embedding/exploration.module.css";
import { useLayoutMode } from "@/components/LayoutContext";

const MODEL_LABELS = { glove_300D: "GloVe 300D", fasttext_300D: "FastText 300D", word2vec_300D: "Word2Vec 300D" };
const COUNT_LABELS = { "1000": "1,000 words", "5000": "5,000 words", "10000": "10,000 words" };
const METHOD_LABELS = { pca: "PCA", umap: "UMAP" };
const NO_WORDS = [];

const COLOR_HINT = "Cluster IDs stored with the dataset.";
const EDGE_HINT = "Draws stored neighbour links. Not every stored link is drawn, so lines are not a complete neighbour list.";

function SectionLabel({ id, children }) {
  return (
    <h3 id={id} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

// Loading / error / graphics notices. `compact` is the in-drawer variant (drawers are modal on mobile).
function StatusNotice({ status, onRetry, onReloadScene, compact = false }) {
  const { data, graphics, datasetName } = status;
  const box = compact
    ? "rounded-lg border p-3 text-sm"
    : "pointer-events-auto w-full max-w-sm rounded-lg border p-4 text-sm shadow-xl";

  if (data.state === "error") {
    return (
      <div role="alert" className={cn(box, "border-red-500/30 bg-neutral-950/95 text-neutral-200")}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium text-white">Couldn&apos;t load {datasetName}</p>
            <p className="text-neutral-300">{data.message}</p>
          </div>
        </div>
        <Button onClick={onRetry} size="sm" className="mt-3 h-11 w-full sm:h-9">Retry</Button>
      </div>
    );
  }
  if (graphics === "unavailable" || graphics === "stalled") {
    const unavailable = graphics === "unavailable";
    return (
      <div role="alert" className={cn(box, "border-amber-500/30 bg-neutral-950/95 text-neutral-200")}>
        <p className="font-medium text-white">
          {unavailable ? "3D view isn't available in this browser" : "The 3D view hasn't recovered yet"}
        </p>
        <p className="mt-1 text-neutral-300">
          {unavailable
            ? "WebGL couldn't start. You can still search words and read their details in the panel."
            : "The browser paused graphics and hasn't restored them. It may still recover on its own."}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {unavailable ? "Try again to start the 3D view." : "Reload the 3D view to restore graphics. Reloading resets the camera."}
        </p>
        <Button onClick={onReloadScene} size="sm" variant="outline" className="mt-3 h-11 w-full sm:h-9">
          {unavailable ? "Try again" : "Reload 3D view"}
        </Button>
      </div>
    );
  }
  if (graphics === "lost") {
    return (
      <div role="status" className={cn(box, "border-white/10 bg-neutral-950/95 text-neutral-300")}>
        Graphics paused by the browser — restoring…
      </div>
    );
  }
  if (data.state === "loading" && compact) {
    return <p className="text-xs text-muted-foreground">Loading {datasetName}…</p>;
  }
  return null;
}

function selectionColor(info) {
  return info?.state === "found" ? clusterColor(info.cluster) : DEFAULT_POINT_COLOR;
}

function SelectedWordPill({ info, onClear }) {
  if (!info) {
    return <p className="text-xs text-muted-foreground">Search or click a point to see its details.</p>;
  }

  const hue = selectionColor(info);

  return (
    <div
      className="rounded-md px-2.5 py-2"
      style={{ backgroundColor: badgeColor(hue), boxShadow: `0 0 0 1px ${hue}59` }}
      aria-live="polite"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/70">Selected</p>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{info.word}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="-mr-1.5 h-6 shrink-0 rounded px-1.5 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white"
          aria-label={`Clear selection ${info.word}`}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

// VisualizerLayout renders `rightCanvas` in both its desktop and mobile trees at once (one is display:none).
// Only mount the WebGL canvas in the visible copy so there is one scene, one fetch, one context.
function VisibleOnly({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const check = () => setVisible(el.getClientRects().length > 0);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="absolute inset-0">{visible ? children : null}</div>;
}

function EmbeddingControls({
  embeddingModel,
  onEmbeddingModelChange,
  wordCount,
  onWordCountChange,
  reductionMethod,
  onReductionMethodChange,
  searchWord,
  onSearchWordChange,
  useClusterColors,
  onUseClusterColorsChange,
  showClusterEdges,
  onShowClusterEdgesChange,
  wordsList = [],
  selectedInfo,
  onClearSelection,
  statusLine,
}) {
  const controlsRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const scrollRegion = controlsRef.current?.parentElement;
    if (!scrollRegion) return;

    const previousTabIndex = scrollRegion.getAttribute("tabindex");
    const previousRole = scrollRegion.getAttribute("role");
    const previousLabel = scrollRegion.getAttribute("aria-label");
    scrollRegion.classList.add("hide-scrollbar");
    scrollRegion.setAttribute("tabindex", "0");
    scrollRegion.setAttribute("role", "region");
    scrollRegion.setAttribute("aria-label", "Embedding controls");
    const handleScrollKey = (event) => {
      if (event.target !== scrollRegion) return;
      const pageStep = Math.max(80, scrollRegion.clientHeight * 0.8);
      const offsets = {
        ArrowDown: 40,
        ArrowUp: -40,
        PageDown: pageStep,
        PageUp: -pageStep,
      };
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        scrollRegion.scrollTop = event.key === "Home" ? 0 : scrollRegion.scrollHeight;
      } else if (offsets[event.key] !== undefined) {
        event.preventDefault();
        scrollRegion.scrollBy({ top: offsets[event.key] });
      }
    };
    scrollRegion.addEventListener("keydown", handleScrollKey);

    return () => {
      scrollRegion.removeEventListener("keydown", handleScrollKey);
      scrollRegion.classList.remove("hide-scrollbar");
      if (previousTabIndex === null) scrollRegion.removeAttribute("tabindex");
      else scrollRegion.setAttribute("tabindex", previousTabIndex);
      if (previousRole === null) scrollRegion.removeAttribute("role");
      else scrollRegion.setAttribute("role", previousRole);
      if (previousLabel === null) scrollRegion.removeAttribute("aria-label");
      else scrollRegion.setAttribute("aria-label", previousLabel);
    };
  }, []);
  
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
    <div ref={controlsRef} className="flex min-h-full flex-col gap-6">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Embedding Space
        <PageGuide page="embedding" />
      </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          300-D word vectors projected to 3D. Distances here can distort relationships.
      </p>
      </header>

      {/* Dataset */}
      <section aria-labelledby="dataset-heading" className="space-y-3">
        <SectionLabel id="dataset-heading">Dataset</SectionLabel>
        <div className="space-y-1.5">
        <label htmlFor="embedding-select" className="text-sm font-medium">
          Embedding Model
        </label>
        <Select value={embeddingModel} onValueChange={onEmbeddingModelChange}>
          <SelectTrigger id="embedding-select" className="w-full">
              <SelectValue placeholder="Select embedding model">{MODEL_LABELS[embeddingModel]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="glove_300D">GloVe 300D</SelectItem>
            <SelectItem value="fasttext_300D">FastText 300D</SelectItem>
            <SelectItem value="word2vec_300D">Word2Vec 300D</SelectItem>
          </SelectContent>
        </Select>
      </div>
        <div className="space-y-1.5">
        <label htmlFor="word-count-select" className="text-sm font-medium">
          Word Count
        </label>
        <Select value={wordCount} onValueChange={onWordCountChange}>
          <SelectTrigger id="word-count-select" className="w-full">
              <SelectValue placeholder="Select word count">{COUNT_LABELS[wordCount]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1000">1,000 words</SelectItem>
            <SelectItem value="5000">5,000 words</SelectItem>
            <SelectItem value="10000">10,000 words</SelectItem>
          </SelectContent>
        </Select>
      </div>
        <div className="space-y-1.5">
          <span id="reduction-label" className="text-sm font-medium">
          Dimensionality Reduction
          </span>
          <RadioGroup value={reductionMethod} onValueChange={onReductionMethodChange} aria-labelledby="reduction-label" className="flex gap-5">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pca" id="pca" />
            <Label htmlFor="pca" className="text-sm font-normal cursor-pointer">
              PCA
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="umap" id="umap" />
            <Label htmlFor="umap" className="text-sm font-normal cursor-pointer">
              UMAP
            </Label>
          </div>
        </RadioGroup>
      </div>
      </section>

      {/* Explore */}
      <section aria-labelledby="explore-heading" className="space-y-3">
        <SectionLabel id="explore-heading">Explore</SectionLabel>
        <div className="space-y-1.5">
          <label htmlFor="word-search-trigger" className="text-sm font-medium">Word Search</label>
        <Popover open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            // Clear search query when closing
            setSearchQuery("");
          }
        }}>
          <PopoverTrigger asChild>
            <Button
                id="word-search-trigger"
              variant="outline"
              role="combobox"
              aria-expanded={open}
                aria-label={searchWord ? `Word Search, selected ${searchWord}` : "Word Search"}
              className="w-full justify-between"
            >
                <span className="truncate">{searchWord ? searchWord : "Search for a word..."}</span>
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
                    {searchQuery ? "No word found." : wordsList.length ? `Type to search ${wordsList.length} words...` : "Loading words..."}
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
        <SelectedWordPill info={selectedInfo} onClear={onClearSelection} />
      </section>

      {/* Display */}
      <section aria-labelledby="display-heading" className="space-y-3">
        <SectionLabel id="display-heading">Display</SectionLabel>
        <div className="flex items-start space-x-2">
        <Checkbox
          id="cluster-colors"
          checked={useClusterColors}
          onCheckedChange={onUseClusterColorsChange}
            aria-describedby="cluster-colors-hint"
            className="mt-0.5"
        />
          <div>
        <label
          htmlFor="cluster-colors"
          className="text-sm font-medium cursor-pointer"
        >
          Color by Similarity Cluster
        </label>
            <p id="cluster-colors-hint" className="text-xs text-muted-foreground">{COLOR_HINT}</p>
      </div>
        </div>
        <div className="flex items-start space-x-2">
        <Checkbox
          id="cluster-edges"
          checked={showClusterEdges}
          onCheckedChange={onShowClusterEdgesChange}
            aria-describedby="cluster-edges-hint"
            className="mt-0.5"
        />
          <div>
        <label
          htmlFor="cluster-edges"
          className="text-sm font-medium cursor-pointer"
        >
          Connect Clusters with Edges
        </label>
            <p id="cluster-edges-hint" className="text-xs text-muted-foreground">{EDGE_HINT}</p>
      </div>
    </div>
      </section>

      <p className="mt-auto border-t border-white/10 pt-3 text-xs text-muted-foreground" aria-hidden="true">
        {statusLine}
      </p>
    </div>
  );
}

export default function EmbeddingPage() {
  const [embeddingModel, setEmbeddingModel] = useState("glove_300D");
  const [wordCount, setWordCount] = useState("1000");
  const [reductionMethod, setReductionMethod] = useState("pca");
  const [searchWord, setSearchWord] = useState("");
  const [useClusterColors, setUseClusterColors] = useState(true);
  const [showClusterEdges, setShowClusterEdges] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // For searching while typing
  // Data loading and graphics capability are tracked separately: data can be ready while 3D is unavailable.
  const [data, setData] = useState({ state: "loading" });
  const [graphics, setGraphics] = useState("ok");
  const [picked, setPicked] = useState(null); // word clicked/tapped on the canvas (details only, no fly-to)
  const [sceneKey, setSceneKey] = useState(0); // bump = rebuild the 3D view (explained to the user first)
  // In the fullscreen (minimalist) layout the canvas runs under the floating navbar, so the panel starts lower.
  const { isMinimalistMode } = useLayoutMode();
  const canvasRef = useRef(null);
  const [focus, setFocus] = useState(false);
  const [pins, setPins] = useState([]);
  const [showLabels, setShowLabels] = useState(false);
  const [motion, setMotion] = useState(true);
  const [spotlight, setSpotlight] = useState(null);
  const resetExploration = () => { setFocus(false); setPins([]); setSpotlight(null); };
  const changeModel = (value) => { resetExploration(); setEmbeddingModel(value); };
  const changeCount = (value) => { resetExploration(); setWordCount(value); };
  const changeMethod = (value) => { resetExploration(); setReductionMethod(value); };

  const dataset = data.state === "ready" ? data.dataset : null;
  const wordsList = dataset?.words ?? NO_WORDS;
  const wordIndex = useMemo(() => new Map(wordsList.map((w, i) => [w, i])), [wordsList]);
  const datasetName = `${MODEL_LABELS[embeddingModel]} · ${COUNT_LABELS[wordCount]} · ${METHOD_LABELS[reductionMethod]}`;

  const selectSearchWord = useCallback((word) => {
    setPicked(word);
    setSearchWord(word);
  }, []);
  // A link like /embedding?word=paris selects that word once the first dataset is ready.
  const linkedWordRef = useRef(false);
  const handleDataStatus = useCallback((status) => {
    setData(status);
    if (status.state !== "ready" || linkedWordRef.current) return;
    linkedWordRef.current = true;
    const word = new URLSearchParams(window.location.search).get("word")?.trim();
    if (word) selectSearchWord(word);
  }, [selectSearchWord]);
  const clearSelection = useCallback(() => {
    setPicked(null);
    setSearchWord("");
    setSearchQuery("");
    setFocus(false);
    canvasRef.current?.clearSelection();
  }, []);
  const retry = useCallback(() => {
    if (canvasRef.current) canvasRef.current.retry();
    else setSceneKey((k) => k + 1);
  }, []);
  const reloadScene = useCallback(() => setSceneKey((k) => k + 1), []);
    
  const selectedInfo = useMemo(() => {
    const word = picked ?? searchWord;
    if (!word) return null;
    const base = {
      word,
      source: picked ? "canvas" : "search",
      datasetName,
      modelName: MODEL_LABELS[embeddingModel],
      countName: COUNT_LABELS[wordCount],
      methodName: METHOD_LABELS[reductionMethod],
    };
    if (!dataset) return { ...base, state: "pending" };
    const i = wordIndex.get(word);
    if (i === undefined) return { ...base, state: "missing" };
    const p = dataset.positions;
    const links = [...new Set(dataset.edges[i])].filter((t) => t !== i).map((t) => dataset.words[t]);
    return { ...base, state: "found", cluster: dataset.clusters[i], coords: [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]], links };
  }, [picked, searchWord, dataset, wordIndex, datasetName, embeddingModel, wordCount, reductionMethod]);

  const clusters = useMemo(() => clusterSummaries(dataset), [dataset]);
  const current = picked ?? searchWord;
  const validPins = useMemo(() => [...new Set([...pins, current])].filter((word) => word && wordIndex.has(word)).slice(0, pins.length ? 2 : 0), [pins, current, wordIndex]);
  const shared = useMemo(() => dataset ? [...exploreNetwork(dataset.words, dataset.edges, "", validPins, false).shared].map((i) => dataset.words[i]) : [], [dataset, validPins]);
  const setExplorationFocus = (value) => { setFocus(value); if (value) setSpotlight(null); };
  const setClusterSpotlight = (value) => { setSpotlight(value); if (value !== null) { setFocus(false); setPins([]); } };

  const status = { data, graphics, datasetName };
  const statusText =
    data.state === "loading" ? `Loading ${datasetName}…`
    : data.state === "error" ? `Couldn't load ${datasetName}.`
    : graphics === "unavailable" ? `Loaded ${wordsList.length.toLocaleString()} words. 3D view unavailable; search still works.`
    : graphics === "lost" ? "Graphics paused. Restoring…"
    : graphics === "stalled" ? "3D view hasn't recovered."
    : `Ready · ${wordsList.length.toLocaleString()} words`;
  const canvasLabel = `3D scatter plot of ${dataset ? `${wordsList.length.toLocaleString()} ` : ""}words from ${MODEL_LABELS[embeddingModel]}, ${METHOD_LABELS[reductionMethod]} projection. Use Word Search to explore the words as text.`;

  const drawerNotice = <StatusNotice status={status} onRetry={retry} onReloadScene={reloadScene} compact />;

  return (
    <div className={explorationStyles.page}>

      <VisualizerLayout
        leftPanel={
          <EmbeddingControls
            embeddingModel={embeddingModel}
            onEmbeddingModelChange={changeModel}
            wordCount={wordCount}
            onWordCountChange={changeCount}
            reductionMethod={reductionMethod}
            onReductionMethodChange={changeMethod}
            searchWord={searchWord}
            onSearchWordChange={selectSearchWord}
            useClusterColors={useClusterColors}
            onUseClusterColorsChange={setUseClusterColors}
            showClusterEdges={showClusterEdges}
            onShowClusterEdgesChange={setShowClusterEdges}
            wordsList={wordsList}
            selectedInfo={selectedInfo}
            onClearSelection={clearSelection}
            statusLine={statusText}
          />
        }
        mobileControlSections={[
          {
            id: "model",
            icon: Database,
            label: "Model",
            content: (
              <div className="space-y-4">
                {drawerNotice}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Model & Configuration</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="mobile-embedding-select" className="text-sm font-medium">
                        Embedding Model
                      </label>
                      <Select value={embeddingModel} onValueChange={changeModel}>
                        <SelectTrigger id="mobile-embedding-select" className="w-full">
                          <SelectValue placeholder="Select embedding model">{MODEL_LABELS[embeddingModel]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="glove_300D">GloVe 300D</SelectItem>
                          <SelectItem value="fasttext_300D">FastText 300D</SelectItem>
                          <SelectItem value="word2vec_300D">Word2Vec 300D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="mobile-word-count-select" className="text-sm font-medium">
                        Word Count
                      </label>
                      <Select value={wordCount} onValueChange={changeCount}>
                        <SelectTrigger id="mobile-word-count-select" className="w-full">
                          <SelectValue placeholder="Select word count">{COUNT_LABELS[wordCount]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">1,000 words</SelectItem>
                          <SelectItem value="5000">5,000 words</SelectItem>
                          <SelectItem value="10000">10,000 words</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <span id="mobile-reduction-label" className="text-sm font-medium">
                        Dimensionality Reduction
                      </span>
                      <RadioGroup value={reductionMethod} onValueChange={changeMethod} aria-labelledby="mobile-reduction-label" className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pca" id="mobile-pca" />
                          <Label htmlFor="mobile-pca" className="text-sm font-normal cursor-pointer">
                            PCA
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="umap" id="mobile-umap" />
                          <Label htmlFor="mobile-umap" className="text-sm font-normal cursor-pointer">
                            UMAP
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "search",
            icon: Search,
            label: "Search",
            content: (closeDrawer) => (
              <div className="space-y-4">
                {drawerNotice}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Word Search</h3>
                  <div className="space-y-3">
                    {/* Current selection */}
                    {selectedInfo && (
                      <SelectedWordPill info={selectedInfo} onClear={clearSelection} />
                    )}
                    
                    {/* Search input - built into drawer, no popover */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type to search words</label>
                      <Command shouldFilter={false} className="rounded-lg border">
                        <CommandInput 
                          placeholder="Type to search words..." 
                          className="h-11"
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>
                            {wordsList.length > 0 ? "No words found. Try a different search." : "Loading words..."}
                          </CommandEmpty>
                          <CommandGroup>
                            {wordsList
                              .filter(word => 
                                !searchQuery || 
                                word.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .slice(0, 50)
                              .map((word) => (
                                <CommandItem
                                  key={word}
                                  value={word}
                                  onSelect={() => {
                                    selectSearchWord(word);
                                    setSearchQuery("");
                                    // Close the drawer when word is selected
                                    setTimeout(() => closeDrawer(), 200);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <span className={cn(
                                    "flex-1",
                                    searchWord === word && "font-semibold text-blue-400"
                                  )}>
                                    {word}
                                  </span>
                                  {searchWord === word && (
                                    <Check className="ml-auto h-4 w-4 text-blue-400" />
                                  )}
                                </CommandItem>
                              ))}
                            {wordsList.filter(word => 
                              !searchQuery || 
                              word.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length > 50 && (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                                Showing first 50 results. Keep typing to refine search...
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                    
                    <div className="text-xs text-muted-foreground pt-2">
                      {wordsList.length > 0 ? (
                        <span>Search through {wordsList.length} words. Select a word to highlight it on the canvas.</span>
                      ) : (
                        <span>Loading word list...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "display",
            icon: Palette,
            label: "Display",
            content: (
              <div className="space-y-4">
                {drawerNotice}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Display Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="mobile-cluster-colors"
                        checked={useClusterColors}
                        onCheckedChange={setUseClusterColors}
                        aria-describedby="mobile-cluster-colors-hint"
                        className="mt-0.5"
                      />
                      <div>
                      <label
                        htmlFor="mobile-cluster-colors"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Color by Similarity Cluster
                      </label>
                        <p id="mobile-cluster-colors-hint" className="text-xs text-muted-foreground">{COLOR_HINT}</p>
                    </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="mobile-cluster-edges"
                        checked={showClusterEdges}
                        onCheckedChange={setShowClusterEdges}
                        aria-describedby="mobile-cluster-edges-hint"
                        className="mt-0.5"
                      />
                      <div>
                      <label
                        htmlFor="mobile-cluster-edges"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Connect Clusters with Edges
                      </label>
                        <p id="mobile-cluster-edges-hint" className="text-xs text-muted-foreground">{EDGE_HINT}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            ),
          },
        ]}
        rightCanvas={
          <div className="relative w-full h-full" data-embedding-status={data.state} data-graphics-status={graphics}>
            <VisibleOnly>
            <EmbeddingCanvas
                key={sceneKey}
              ref={canvasRef}
              embeddingModel={embeddingModel}
              wordCount={wordCount}
              reductionMethod={reductionMethod}
              searchWord={searchWord}
              pickedWord={picked ?? ""}
              useClusterColors={useClusterColors}
              showClusterEdges={showClusterEdges}
                onDataStatus={handleDataStatus}
                onGraphicsStatus={setGraphics}
                onPick={(word) => (word ? selectSearchWord(word) : clearSelection())}
                exploration={{ focus, pins: validPins, spotlight, showLabels }}
                motion={motion}
                ariaLabel={canvasLabel}
            />
            </VisibleOnly>
            <ExplorationTray
              info={selectedInfo} focus={focus} onFocus={setExplorationFocus}
              pins={validPins} onPin={(word) => { setPins([word]); setSpotlight(null); }}
              onUnpin={() => setPins([])}
              shared={shared}
              onSelect={selectSearchWord} onClear={clearSelection}
              onFrame={() => canvasRef.current?.locate(selectedInfo?.word)}
              showLabels={showLabels} onLabels={setShowLabels} motion={motion} onMotion={setMotion} clusters={clusters}
              spotlight={spotlight} onSpotlight={setClusterSpotlight}
              onFrameCluster={(id) => canvasRef.current?.frameCluster?.(id)} minimalist={isMinimalistMode}
            />
            <p className="sr-only" role="status" aria-live="polite">{statusText}</p>
            {data.state === "loading" && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm" aria-hidden="true">
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div className="w-8 h-8 border-4 border-neutral-700 border-t-blue-500 rounded-full animate-spin motion-reduce:animate-none" />
                  <p className="text-sm text-neutral-300">Loading {MODEL_LABELS[embeddingModel]}</p>
                  <p className="text-xs text-neutral-400">{COUNT_LABELS[wordCount]} · {METHOD_LABELS[reductionMethod]}</p>
          </div>
              </div>
            )}
            {(data.state === "error" || (data.state !== "loading" && graphics !== "ok")) && (
              <div className={cn(
                "pointer-events-none absolute inset-0 z-40 flex justify-center p-4",
                graphics === "lost" && data.state !== "error" ? "items-start pt-16" : "items-center bg-neutral-950/60"
              )}>
                <StatusNotice status={status} onRetry={retry} onReloadScene={reloadScene} />
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
