"use client";
import { useState, useEffect, useRef } from "react";
import VisualizerLayout from "@/components/VisualizerLayout";
import VectorPlaygroundCanvas from "@/components/VectorPlaygroundCanvas";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function VectorPlaygroundControls({
  embeddingModel,
  onEmbeddingModelChange,
  showGridlines,
  onShowGridlinesChange,
  wordsText,
  onWordsTextChange,
  vectorA,
  onVectorAChange,
  vectorB,
  onVectorBChange,
  vectorC,
  onVectorCChange,
  onCalculate,
  calculationResult,
  errorMessage,
  errorField,
}) {
  return (
    <div className="w-full min-w-0 overflow-hidden">
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
              <div className="font-semibold text-white">Vector Playground</div>
              <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                <li>
                  Experiment with vector arithmetic (addition, subtraction,
                  scaling).
                </li>
                <li>
                  Visualize the results of analogy operations like:
                  <span className="font-mono">
                    {" "}
                    <code className="text-red-400">king - man + woman = ?</code>
                  </span>
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
            <SelectItem value="glove_300D">GloVe 300D</SelectItem>
            <SelectItem value="fasttext_300D">FastText 300D</SelectItem>
            <SelectItem value="word2vec_300D">Word2Vec 300D</SelectItem>
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
          {Math.min(
            wordsText.split(/\s+/).filter((w) => w.trim().length > 0).length,
            50
          )}{" "}
          / 50 words
        </p>
      </div>

      <Separator className="my-4" />

      {/* Vector Calculation */}
      <div className="space-y-2 max-w-full overflow-hidden">
        <Label className="text-sm font-medium">Vector Calculation
        <HoverCard>
          <HoverCardTrigger asChild>
            <HelpCircle className="inline-block ml-1 h-3 w-3 text-muted-foreground cursor-help" />
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="text-sm space-y-3">
              <div>
                <p className="font-semibold mb-2">
                  Vector Calculation: a - b + c
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  This performs word analogy calculations using vector
                  arithmetic. The result finds the word that has the same
                  relationship to 'c' as 'a' has to 'b'.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Example:</p>
                <div className="font-mono text-xs space-y-1">
                  <p>
                    • <strong>a:</strong> king (starting word)
                  </p>
                  <p>
                    • <strong>b:</strong> man (reference word)
                  </p>
                  <p>
                    • <strong>c:</strong> woman (target word)
                  </p>
                  <p>
                    • <strong>Result:</strong> queen
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  "What is to woman as king is to man?" → queen
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  <strong>How it works:</strong> The calculation (a - b + c)
                  finds the direction from b to a, then applies that same
                  direction starting from c. All input words and the result are
                  automatically plotted on the canvas.
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        </Label>
        <div className="flex items-center gap-2">
          <Tooltip open={errorField === "a" && errorMessage ? true : false}>
            <TooltipTrigger asChild>
              <Input
                id="vector-a"
                value={vectorA}
                onChange={(e) => onVectorAChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onCalculate();
                  }
                }}
                placeholder="king"
                className={cn(
                  "flex-1",
                  errorField === "a" &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
            </TooltipTrigger>
            {errorField === "a" && errorMessage && (
              <TooltipContent className="bg-destructive text-destructive-foreground border-destructive">
                <p className="max-w-xs">{errorMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <span className="text-sm font-semibold">-</span>
          <Tooltip open={errorField === "b" && errorMessage ? true : false}>
            <TooltipTrigger asChild>
              <Input
                id="vector-b"
                value={vectorB}
                onChange={(e) => onVectorBChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onCalculate();
                  }
                }}
                placeholder="man"
                className={cn(
                  "flex-1",
                  errorField === "b" &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
            </TooltipTrigger>
            {errorField === "b" && errorMessage && (
              <TooltipContent className="bg-destructive text-destructive-foreground border-destructive">
                <p className="max-w-xs">{errorMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <span className="text-sm font-semibold">+</span>
          <Tooltip open={errorField === "c" && errorMessage ? true : false}>
            <TooltipTrigger asChild>
              <Input
                id="vector-c"
                value={vectorC}
                onChange={(e) => onVectorCChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onCalculate();
                  }
                }}
                placeholder="woman"
                className={cn(
                  "flex-1",
                  errorField === "c" &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
            </TooltipTrigger>
            {errorField === "c" && errorMessage && (
              <TooltipContent className="bg-destructive text-destructive-foreground border-destructive">
                <p className="max-w-xs">{errorMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        <Button onClick={onCalculate} variant="default" className="w-full">
          Calculate
        </Button>
      </div>

      <Separator className="my-4" />
    </div>
  );
}

// Vector equation parser for format: a - b + c
// IMPORTANT: Perform arithmetic on FULL vectors, not just first 3 dimensions
function parseVectorEquation(a, b, c, embeddings) {
  if (!embeddings)
    return { result: null, missingWords: [], inputWords: [], errorField: null };

  const missingWords = [];
  const inputWords = [a, b, c]
    .filter((w) => w && w.trim().length > 0)
    .map((w) => w.trim().toLowerCase());
  let errorField = null;

  // Check if all words exist
  const aWord = a?.trim().toLowerCase();
  const bWord = b?.trim().toLowerCase();
  const cWord = c?.trim().toLowerCase();

  if (!aWord) {
    return {
      result: null,
      missingWords: ["First word (a) is required"],
      inputWords,
      errorField: "a",
    };
  }
  if (!bWord) {
    return {
      result: null,
      missingWords: ["Second word (b) is required"],
      inputWords,
      errorField: "b",
    };
  }
  if (!cWord) {
    return {
      result: null,
      missingWords: ["Third word (c) is required"],
      inputWords,
      errorField: "c",
    };
  }

  // Check each word exists in embeddings
  if (!embeddings[aWord]) {
    missingWords.push(`"${aWord}"`);
    if (!errorField) errorField = "a";
  }
  if (!embeddings[bWord]) {
    missingWords.push(`"${bWord}"`);
    if (!errorField) errorField = "b";
  }
  if (!embeddings[cWord]) {
    missingWords.push(`"${cWord}"`);
    if (!errorField) errorField = "c";
  }

  if (missingWords.length > 0) {
    return { result: null, missingWords, inputWords, errorField };
  }

  // Get vectors
  const vectorA = embeddings[aWord];
  const vectorB = embeddings[bWord];
  const vectorC = embeddings[cWord];

  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    !Array.isArray(vectorC)
  ) {
    return {
      result: null,
      missingWords: ["Invalid vector format"],
      inputWords,
      errorField: null,
    };
  }

  // Calculate: a - b + c
  // Ensure same dimensionality
  const dims = Math.max(vectorA.length, vectorB.length, vectorC.length);

  const resultVector = new Array(dims).fill(0);

  // Add a
  for (let i = 0; i < Math.min(vectorA.length, dims); i++) {
    resultVector[i] += vectorA[i] || 0;
  }

  // Subtract b
  for (let i = 0; i < Math.min(vectorB.length, dims); i++) {
    resultVector[i] -= vectorB[i] || 0;
  }

  // Add c
  for (let i = 0; i < Math.min(vectorC.length, dims); i++) {
    resultVector[i] += vectorC[i] || 0;
  }

  return {
    result: resultVector,
    missingWords: [],
    inputWords,
    errorField: null,
  };
}

// Find closest word to a vector using cosine similarity (better for word embeddings)
function findClosestWord(resultVectorFull, embeddings, excludeWords = []) {
  if (!resultVectorFull || !embeddings || !Array.isArray(resultVectorFull))
    return null;

  let maxSimilarity = -Infinity;
  let closestWord = null;
  let closestDistance = Infinity;

  // Calculate magnitude of result vector for cosine similarity
  const resultMagnitude = Math.sqrt(
    resultVectorFull.reduce((sum, val) => sum + val * val, 0)
  );

  if (resultMagnitude === 0) return null;

  // Create a set of words to exclude (case-insensitive)
  const excludeSet = new Set(excludeWords.map((w) => w.toLowerCase()));

  for (const [word, embedding] of Object.entries(embeddings)) {
    // Skip excluded words (input words)
    if (excludeSet.has(word.toLowerCase())) continue;

    if (!Array.isArray(embedding) || embedding.length === 0) continue;

    // Ensure same dimensionality
    const dims = Math.min(resultVectorFull.length, embedding.length);

    // Calculate dot product for cosine similarity
    let dotProduct = 0;
    let embeddingMagnitude = 0;

    for (let i = 0; i < dims; i++) {
      const rVal = resultVectorFull[i] || 0;
      const eVal = embedding[i] || 0;
      dotProduct += rVal * eVal;
      embeddingMagnitude += eVal * eVal;
    }

    embeddingMagnitude = Math.sqrt(embeddingMagnitude);

    if (embeddingMagnitude === 0) continue;

    // Cosine similarity (range: -1 to 1)
    const cosineSimilarity =
      dotProduct / (resultMagnitude * embeddingMagnitude);

    // Also calculate Euclidean distance for reference
    let euclideanDistance = 0;
    for (let i = 0; i < dims; i++) {
      const diff = (resultVectorFull[i] || 0) - (embedding[i] || 0);
      euclideanDistance += diff * diff;
    }
    euclideanDistance = Math.sqrt(euclideanDistance);

    // Use cosine similarity to find closest (higher is better)
    if (cosineSimilarity > maxSimilarity) {
      maxSimilarity = cosineSimilarity;
      closestWord = word;
      closestDistance = euclideanDistance;
    }
  }

  return {
    word: closestWord,
    distance: closestDistance,
    similarity: maxSimilarity,
  };
}

export default function PlaygroundPage() {
  const [embeddingModel, setEmbeddingModel] = useState("glove_300D");
  const [showGridlines, setShowGridlines] = useState(true);
  const [wordsText, setWordsText] = useState(
    "If the path be beautiful , let us not ask where it leads"
  );
  const [vectorA, setVectorA] = useState("");
  const [vectorB, setVectorB] = useState("");
  const [vectorC, setVectorC] = useState("");
  const [calculationResult, setCalculationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorField, setErrorField] = useState(null); // 'a', 'b', 'c', or null
  const [embeddingsData, setEmbeddingsData] = useState(null);
  const shouldAutoRecalculateRef = useRef(false); // Track if we should auto-recalculate when embeddings load

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setErrorField(null);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Clear calculation result when embedding model changes, but mark for auto-recalculate if we had a result
  useEffect(() => {
    if (calculationResult && vectorA && vectorB && vectorC) {
      // Had a calculation - mark to auto-recalculate when new embeddings load
      shouldAutoRecalculateRef.current = true;
    }
    setCalculationResult(null);
    setErrorMessage(null);
    setErrorField(null);
    setEmbeddingsData(null); // Clear old embeddings to ensure we wait for new ones
  }, [embeddingModel]);

  // Auto-recalculate when embeddings finish loading (if we had a previous calculation)
  useEffect(() => {
    if (
      shouldAutoRecalculateRef.current &&
      embeddingsData &&
      vectorA &&
      vectorB &&
      vectorC
    ) {
      shouldAutoRecalculateRef.current = false;
      // Use handleCalculate logic inline to avoid circular dependency
      const {
        result: resultVectorFull,
        missingWords,
        inputWords,
        errorField: field,
      } = parseVectorEquation(vectorA, vectorB, vectorC, embeddingsData);

      if (
        missingWords.length === 0 &&
        resultVectorFull &&
        Array.isArray(resultVectorFull)
      ) {
        const vector3D = [
          resultVectorFull[0] || 0,
          resultVectorFull[1] || 0,
          resultVectorFull[2] || 0,
        ];
        const closest = findClosestWord(
          resultVectorFull,
          embeddingsData,
          inputWords
        );

        setCalculationResult({
          vector3D: vector3D,
          vectorFull: resultVectorFull,
          closestWord: closest?.word,
          closestDistance: closest?.distance,
          similarity: closest?.similarity,
        });
        setErrorMessage(null);
        setErrorField(null);
      }
    }
  }, [embeddingsData, vectorA, vectorB, vectorC]);

  // Mutual exclusivity: If user types in words textbox, clear vector inputs and calculation
  useEffect(() => {
    if (wordsText.trim().length > 0) {
      if (vectorA || vectorB || vectorC || calculationResult) {
        setVectorA("");
        setVectorB("");
        setVectorC("");
        setCalculationResult(null);
        setErrorMessage(null);
        setErrorField(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsText]);

  // Mutual exclusivity: If user types in vector inputs, clear words textbox
  useEffect(() => {
    if (
      (vectorA.trim().length > 0 ||
        vectorB.trim().length > 0 ||
        vectorC.trim().length > 0) &&
      wordsText.trim().length > 0
    ) {
      setWordsText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vectorA, vectorB, vectorC]);

  // Parse words from text, limit to 50
  const manualWords = wordsText
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0)
    .slice(0, 50);

  // Combine manual words with vector calculation words (a, b, c)
  // NOTE: Don't include result word here - it's plotted separately as resultVector
  const vectorWords = [];
  if (vectorA.trim()) vectorWords.push(vectorA.trim().toLowerCase());
  if (vectorB.trim()) vectorWords.push(vectorB.trim().toLowerCase());
  if (vectorC.trim()) vectorWords.push(vectorC.trim().toLowerCase());

  // Combine all words, removing duplicates
  const allWords = [...new Set([...manualWords, ...vectorWords])].slice(0, 50);
  const words = allWords;

  // Handle vector calculation
  const handleCalculate = () => {
    setErrorMessage(null);
    setErrorField(null);
    setCalculationResult(null);

    if (!embeddingsData) {
      setErrorMessage("Embeddings not loaded yet. Please wait...");
      setErrorField(null);
      return;
    }

    // Parse equation to get full-dimensional result vector
    const {
      result: resultVectorFull,
      missingWords,
      inputWords,
      errorField: field,
    } = parseVectorEquation(vectorA, vectorB, vectorC, embeddingsData);

    if (missingWords.length > 0) {
      setErrorMessage(
        `Words not found in embeddings: ${missingWords.join(", ")}`
      );
      setErrorField(field);
      return;
    }

    if (!resultVectorFull || !Array.isArray(resultVectorFull)) {
      setErrorMessage("Invalid calculation. Please check your inputs.");
      setErrorField(null);
      return;
    }

    // Extract first 3 dimensions for visualization (the canvas only shows 3D)
    const vector3D = [
      resultVectorFull[0] || 0,
      resultVectorFull[1] || 0,
      resultVectorFull[2] || 0,
    ];

    // Find closest word using FULL vectors (important for accuracy)
    const closest = findClosestWord(
      resultVectorFull,
      embeddingsData,
      inputWords
    );

    setCalculationResult({
      vector3D: vector3D, // 3D for visualization
      vectorFull: resultVectorFull, // Full vector for accurate calculations
      closestWord: closest?.word,
      closestDistance: closest?.distance,
      similarity: closest?.similarity,
    });
  };

  return (
    <>
      <Drawer>
        <div className="justify-self-end me-4">
          <DrawerTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
              Learn about Vector Geometry
            </button>
          </DrawerTrigger>
        </div>

        <DrawerContent className="flex flex-col max-h-[90vh] custom-scroll">
          <div className="mx-auto w-full max-w-2xl overflow-y-auto flex-1 px-4 pt-4">
            <DrawerHeader>
              <DrawerTitle>Geometric Meaning of Embedding Vectors</DrawerTitle>
              <DrawerDescription>
                Vector math reveals semantic patterns. Word analogies work because geometric relationships encode meaning.
              </DrawerDescription>
            </DrawerHeader>

            <div className="space-y-3 pb-4">
              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                  Classic analogy
                </div>
                <div className="text-sm text-white mb-1">"king - man + woman"</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    king
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    -
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    man
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    +
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    woman
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-green-900/60 text-green-100">
                    ≈ queen
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                  Yellow arrows
                </div>
                <div className="text-sm text-white mb-1">Distance vectors show relationships</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-yellow-900/60 text-yellow-100">
                    a → b
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-yellow-900/60 text-yellow-100">
                    b → c
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-yellow-900/60 text-yellow-100">
                    c → result
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-neutral-800/40 border border-neutral-700/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                  Try these
                </div>
                <div className="text-sm text-white mb-1">More examples</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    paris - france + italy
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-neutral-700/60 text-neutral-100">
                    happy - sad + joy
                  </span>
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
          <VectorPlaygroundControls
            embeddingModel={embeddingModel}
            onEmbeddingModelChange={setEmbeddingModel}
            showGridlines={showGridlines}
            onShowGridlinesChange={setShowGridlines}
            wordsText={wordsText}
            onWordsTextChange={setWordsText}
            vectorA={vectorA}
            onVectorAChange={setVectorA}
            vectorB={vectorB}
            onVectorBChange={setVectorB}
            vectorC={vectorC}
            onVectorCChange={setVectorC}
            onCalculate={handleCalculate}
            calculationResult={calculationResult}
            errorMessage={errorMessage}
            errorField={errorField}
          />
        }
        rightCanvas={
          <VectorPlaygroundCanvas
            embeddingModel={embeddingModel}
            showGridlines={showGridlines}
            words={words}
            resultVector={calculationResult ? calculationResult.vector3D : null}
            resultLabel={calculationResult?.closestWord || "Result"}
            resultInfo={
              calculationResult
                ? {
                    closestWord: calculationResult.closestWord,
                    vector3D: calculationResult.vector3D,
                    similarity: calculationResult.similarity,
                    distance: calculationResult.closestDistance,
                  }
                : null
            }
            onEmbeddingsLoaded={setEmbeddingsData}
            vectorA={vectorA.trim().toLowerCase() || null}
            vectorB={vectorB.trim().toLowerCase() || null}
            vectorC={vectorC.trim().toLowerCase() || null}
          />
        }
      />
    </>
  );
}
