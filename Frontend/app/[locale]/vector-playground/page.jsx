"use client";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import VisualizerLayout from "@/components/VisualizerLayout";
import { useLayoutMode } from "@/components/LayoutContext";
import VectorPlaygroundCanvas from "@/components/VectorPlaygroundCanvas";
import { lookup, analogy, nearest, pca3, loadModel } from "@/components/vectorPlayground/vectorMath.mjs";
import { PageGuide } from "@/components/PageGuide";
import { HelpCircle, Database, Grid, FileText, Calculator, X, Eye, Radar } from "lucide-react";
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
import { cn } from "@/lib/utils";

const MODELS = {
  glove_300D: { label: "GloVe", url: "/glove_300d/glove_300D_full.json.gz" },
  fasttext_300D: { label: "FastText", url: "/FastText_300D/FastText_300D_full.json.gz" },
  word2vec_300D: { label: "Word2Vec", url: "/Word2Vec_300D/Word2Vec_300D_full.json.gz" },
};

const PRESETS = [
  ["king", "man", "woman"],
  ["paris", "france", "italy"],
  ["bigger", "big", "small"],
  ["brother", "man", "woman"],
  ["tokyo", "japan", "germany"],
  ["walking", "walk", "swim"],
];

const WORD_COLORS = ["#45b7d1", "#ff6b6b", "#4ecdc4", "#a55eea", "#fd79a8", "#6c5ce7", "#fa8231", "#00aaff"];
const ANSWER_COLOR = "#26de81";
const HELPER_COLOR = "#f9ca24";
const FIELDS = ["a", "b", "c"];

// View label, origin text and hint live in messages under Vectors.views.<view>.

function PresetChips({ onPick }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.join()}
          type="button"
          onClick={() => onPick(p)}
          className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1 font-mono text-[11px] text-neutral-300 hover:border-neutral-600 hover:text-white transition-colors"
        >
          {p[0]} − {p[1]} + {p[2]}
        </button>
      ))}
    </div>
  );
}

function WordChips({ words, colors, modelLabel, dimmed }) {
  const t = useTranslations("Vectors");
  if (!words.length) return null;
  const missing = words.filter((w) => !colors[w]);
  return (
    <div className={cn("space-y-1.5", dimmed && "opacity-50")}>
      <div className="flex flex-wrap gap-1 font-mono text-xs">
        {words.map((w) => colors[w] ? (
          <span key={w} className="rounded px-1.5 py-0.5 text-white" style={{ background: `color-mix(in srgb, ${colors[w]} 30%, transparent)`, boxShadow: `inset 0 -2px 0 ${colors[w]}` }}>{w}</span>
        ) : (
          <span key={w} className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-300 line-through decoration-red-400/70">{w}</span>
        ))}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {t("wholeWords", { model: modelLabel })}{missing.length > 0 && t("struckOut")}
        {dimmed && t("hiddenWhileAnalogy")}
      </p>
    </div>
  );
}

function ResultCard({ result, onClose, top: topClass, open, onToggle }) {
  const t = useTranslations("Vectors");
  if (!result) return null;
  const [top, ...rest] = result.neighbors;
  const [a, b, c] = result.keys;
  return (
    <div className={`absolute right-3 bottom-28 md:bottom-auto ${topClass} z-40 w-[min(240px,calc(100%-24px))] rounded-xl border border-white/10 bg-neutral-950/85 p-2 md:p-3 shadow-2xl backdrop-blur-md space-y-1.5 md:space-y-2 animate-in fade-in slide-in-from-top-2 duration-500`}>
      <div className="hidden md:flex items-start justify-between gap-2">
        <p className="font-mono text-xs text-neutral-400">{a} − {b} + {c} ≈</p>
        <button type="button" onClick={onClose} aria-label={t("clearAnalogy")} className="-m-1 rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md px-2 py-0.5 text-base md:text-lg font-bold text-white" style={{ background: `color-mix(in srgb, ${ANSWER_COLOR} 55%, #0b0e14)` }}>{top.word}</span>
        <span className="font-mono text-xs text-emerald-300">cos {top.similarity.toFixed(2)}</span>
        <button type="button" onClick={onClose} aria-label={t("clearAnalogy")} className="md:hidden rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <button type="button" onClick={onToggle} aria-pressed={open} className={cn("flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] transition-colors", open ? "bg-sky-500/15 text-sky-200" : "text-neutral-400 hover:bg-white/5 hover:text-white")}>
        <Radar className="h-3.5 w-3.5" />
        <span>{t(open ? "hideNext" : "showNext", { count: rest.length })}</span>
      </button>
      {open && <ul className="space-y-0.5">
        {rest.map((n) => (
          <li key={n.word} className="flex items-center justify-between px-1 text-sm text-neutral-300">
            <span>{n.word}</span>
            <span className="font-mono text-xs text-neutral-500">{n.similarity.toFixed(2)}</span>
          </li>
        ))}
      </ul>}
    </div>
  );
}

function PlotLegend({ result, view }) {
  const t = useTranslations("Vectors");
  const [open, setOpen] = useState(false);
  if (!result) return null;
  const [a, b, c] = result.keys;
  const answer = result.neighbors[0].word;
  const bold = (chunks) => <b className="text-white">{chunks}</b>;
  const row = (mark, text) => (
    <li className="flex items-start gap-2">
      <svg width="26" height="12" viewBox="0 0 26 12" className="mt-0.5 shrink-0" aria-hidden="true">{mark}</svg>
      <span>{text}</span>
    </li>
  );
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="absolute bottom-3 left-3 z-40 hidden md:flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-200 backdrop-blur-md hover:bg-neutral-800">
      <HelpCircle className="h-3.5 w-3.5 text-sky-300" /> {t("howToRead")}
    </button>
  );
  return (
    <div className="absolute bottom-3 left-3 z-40 hidden md:block max-w-[300px] rounded-xl border border-white/10 bg-neutral-950/80 p-3 text-[11px] leading-snug text-neutral-300 backdrop-blur-md animate-in fade-in duration-300">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-white text-xs">{t("howToRead")}</p>
        <button type="button" onClick={() => setOpen(false)} aria-label={t("closeLegend")} className="-m-1 rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>
      <ul className="space-y-1.5">
        {view === "zero"
          ? row(<circle cx="6" cy="6" r="3.5" fill="#fff" />, t.rich("legendZero", { b: bold }))
          : row(<circle cx="6" cy="6" r="3.5" fill="#fff" />, t.rich("legendCentred", { b: bold }))}
        {row(<path d="M2 6h20m-5-4 5 4-5 4" stroke={HELPER_COLOR} strokeWidth="2" fill="none" />, t.rich("legendStep", { from: b, to: a, start: c, b: bold }))}
        {row(<circle cx="6" cy="6" r="4" fill={ANSWER_COLOR} />, t("legendPoint"))}
        {row(<path d="M2 6h22" stroke={ANSWER_COLOR} strokeWidth="2" strokeDasharray="3 3" />, t.rich("legendGap", { answer, b: bold }))}
      </ul>
    </div>
  );
}

// Captions live in messages under Vectors.operations.
const OPERATIONS = [
  {},
  { sign: "−" },
  { sign: "+" },
];
const OPERATION_STYLES = ["bg-sky-500/15 text-sky-300", "bg-red-500/15 text-red-300", "bg-emerald-500/15 text-emerald-300"];

function EquationInputs({ inputs, onInputChange, onCalculate, errorField }) {
  const captions = useTranslations("Vectors").raw("operations");
  return (
    <div>
      {FIELDS.map((field, i) => (
        <div key={field}>
          {OPERATIONS[i].sign && (
            <div className="flex h-5 items-center pl-9 text-sm font-semibold text-neutral-400" aria-hidden="true">
              <span className="flex-1 text-center">{OPERATIONS[i].sign}</span>
            </div>
          )}
          <label className="flex items-center gap-2">
            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-sm font-semibold", OPERATION_STYLES[i])}>
              {field}
            </span>
            <Input
              aria-label={`${field}: ${captions[i]}`}
              value={inputs[field]}
              onChange={(e) => onInputChange(field, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onCalculate(); }}
              placeholder={`${captions[i]}: ${["king", "man", "woman"][i]}`}
              className={cn("h-9 min-w-0 flex-1", errorField === field && "border-destructive focus-visible:ring-destructive")}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

function VectorPlaygroundControls({
  embeddingModel, onEmbeddingModelChange, showGridlines, onShowGridlinesChange,
  wordsText, onWordsTextChange, manualWords, wordColors, inputs, onInputChange, onPreset,
  onCalculate, calcDisabled, calcLabel, result, errorMessage, errorField,
}) {
  const t = useTranslations("Vectors");
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <h2 className="text-lg md:text-xl font-semibold mb-2 flex items-center gap-2">
        {t("heading")}{" "}
        <PageGuide page="vectors" />
      </h2>
      <p className="text-xs text-muted-foreground mb-3 md:mb-4">
        {t("intro")}
      </p>
      <Separator className="my-3 md:my-4" />

      <div className="space-y-2">
        <label htmlFor="embedding-select" className="text-sm font-medium">
          {t("model")}
        </label>
        <Select value={embeddingModel} onValueChange={onEmbeddingModelChange}>
          <SelectTrigger id="embedding-select" className="w-full">
            <SelectValue placeholder={t("modelPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="glove_300D">GloVe 300D</SelectItem>
            <SelectItem value="fasttext_300D">FastText 300D</SelectItem>
            <SelectItem value="word2vec_300D">Word2Vec 300D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-3 md:my-4" />

      <div className="flex items-center space-x-2">
        <Checkbox id="gridlines" checked={showGridlines} onCheckedChange={onShowGridlinesChange} />
        <label htmlFor="gridlines" className="text-sm font-medium cursor-pointer">
          {t("gridlines")}
        </label>
      </div>

      <Separator className="my-3 md:my-4" />

      <div className="space-y-2">
        <Label htmlFor="words-input" className="text-sm font-medium">
          {t("wordsToPlotLimit")}
        </Label>
        <Textarea
          id="words-input"
          value={wordsText}
          onChange={(e) => onWordsTextChange(e.target.value)}
          placeholder={t("wordsPlaceholder")}
          className="min-h-[80px] md:min-h-[100px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {t("wordCount", { count: Math.min(wordsText.split(/\s+/).filter((w) => w.trim().length > 0).length, 50) })}
        </p>
        <WordChips words={manualWords} colors={wordColors} modelLabel={MODELS[embeddingModel].label} dimmed={!!result} />
      </div>

      <Separator className="my-3 md:my-4" />

      <div className="space-y-2 max-w-full overflow-hidden">
        <Label className="text-sm font-medium">{t("analogy")}</Label>
        <p className="text-xs leading-snug text-muted-foreground">
          {t("analogyIntro")}
        </p>
        <EquationInputs inputs={inputs} onInputChange={onInputChange} onCalculate={onCalculate} errorField={errorField} />
        {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
        <Button onClick={onCalculate} variant="default" className="w-full" disabled={calcDisabled}>
          {calcLabel}
        </Button>
        <p className="pt-1 text-[11px] uppercase tracking-wide text-neutral-500">{t("orTryExample")}</p>
        <PresetChips onPick={onPreset} />
      </div>

      <Separator className="my-3 md:my-4" />
    </div>
  );
}

export default function PlaygroundPage() {
  const t = useTranslations("Vectors");
  const [embeddingModel, setEmbeddingModel] = useState("glove_300D");
  const [showGridlines, setShowGridlines] = useState(true);
  const [wordsText, setWordsText] = useState(() => t("defaultWords"));
  const [inputs, setInputs] = useState({ a: "", b: "", c: "" });
  const [equation, setEquation] = useState(null);
  const [models, setModels] = useState({});
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState("zero");
  const [showNearby, setShowNearby] = useState(false);
  const { isMinimalistMode } = useLayoutMode();

  const embeddings = models[embeddingModel] ?? null;
  const modelLabel = MODELS[embeddingModel].label;

  useEffect(() => {
    if (models[embeddingModel]) return;
    let alive = true;
    setProgress(0);
    loadModel(MODELS[embeddingModel].url, (p) => { if (alive) setProgress(p); })
      .then((data) => { if (alive) setModels((m) => ({ ...m, [embeddingModel]: data })); })
      .catch((error) => console.error("Error loading embeddings:", error));
    return () => { alive = false; };
  }, [embeddingModel, models]);

  // Replot once typing pauses briefly, not on every keystroke.
  const [plotText, setPlotText] = useState(wordsText);
  useEffect(() => {
    const id = setTimeout(() => setPlotText(wordsText), 150);
    return () => clearTimeout(id);
  }, [wordsText]);
  const manualWords = useMemo(
    () => [...new Set(plotText.split(/\s+/).map((w) => w.trim()).filter(Boolean))].slice(0, 50),
    [plotText]
  );

  // Equation state: which fields are missing in the current model, and the result if all three resolve.
  const calc = useMemo(() => {
    if (!equation || !embeddings) return null;
    const keys = FIELDS.map((f) => lookup(embeddings, equation[f]));
    const missing = FIELDS.find((f, i) => !keys[i]);
    if (missing) return { errorField: missing, error: t("notInModel", { word: equation[missing], model: modelLabel }) };
    const vector = analogy(...keys.map((k) => embeddings[k]));
    return { keys, vector, neighbors: nearest(vector, embeddings, keys, 5) };
  }, [equation, embeddings, modelLabel, t]);
  const result = calc?.neighbors ? calc : null;


  const scene = useMemo(() => {
    if (!embeddings) return { items: [], links: [] };
    const plotted = [];
    const add = (key, kind) => { if (key && !plotted.some((p) => p.key === key)) plotted.push({ key, kind }); };
    if (result) result.keys.forEach((k) => add(k, "word"));
    else manualWords.forEach((w) => add(lookup(embeddings, w), "word"));
    const answer = result?.neighbors[0].word;
    if (answer) {
      const existing = plotted.find((p) => p.key === answer);
      if (existing) existing.kind = "answer";
      else add(answer, "answer");
    }
    // Always fit the layout with the runner-ups so toggling them never moves the other arrows.
    if (result) result.neighbors.slice(1).forEach((n) => add(n.word, "nearby"));
    const vectors = plotted.map((p) => embeddings[p.key]);
    if (result) vectors.push(result.vector);
    if (!vectors.length) return { items: [], links: [] };
    const coords = pca3(vectors, view === "centred");
    const radius = Math.max(...coords.map((c) => Math.hypot(...c)), 1e-9);
    const pos = coords.map((c) => c.map((x) => (x / radius) * 2.4));
    let colorIndex = 0;
    const items = plotted.map((p, i) => ({
      id: p.key, label: p.key, pos: pos[i],
      color: p.kind === "answer" ? ANSWER_COLOR : WORD_COLORS[colorIndex++ % WORD_COLORS.length],
      kind: p.kind === "word" && result && showNearby ? "faded" : p.kind === "nearby" ? "word" : p.kind,
      delay: result ? (p.kind === "answer" ? 2.3 : p.kind === "nearby" ? 0.1 + (i % 4) * 0.12 : i * 0.25) : i * 0.04,
      hidden: p.kind === "nearby" && !showNearby,
    })).filter((item) => !item.hidden);
    const links = [];
    if (result) {
      const at = (key) => pos[plotted.findIndex((p) => p.key === key)];
      const point = pos[pos.length - 1];
      const [a, b, c] = result.keys;
      items.push({ id: "__result", label: "a − b + c", pos: point, kind: "point", color: ANSWER_COLOR, delay: 1.6 });
      links.push({ from: at(b), to: at(a), color: HELPER_COLOR, delay: 0.9, faded: showNearby });
      links.push({ from: at(c), to: point, color: HELPER_COLOR, delay: 1.3, faded: showNearby });
      links.push({ from: point, to: at(answer), color: ANSWER_COLOR, dashed: true, delay: 1.9 });
      if (view === "zero") links.push({ from: [0, 0, 0], to: point, color: ANSWER_COLOR, delay: 1.6 });
    }
    return { items, links };
  }, [embeddings, manualWords, result, view, showNearby]);

  const wordColors = useMemo(() => {
    const colors = {};
    if (!embeddings) return colors;
    let i = 0;
    for (const w of manualWords) {
      const key = lookup(embeddings, w);
      if (key) colors[w] = WORD_COLORS[i++ % WORD_COLORS.length];
    }
    return colors;
  }, [embeddings, manualWords]);

  const onInputChange = (field, value) => {
    setInputs((cur) => ({ ...cur, [field]: value }));
    if (calc?.errorField) setEquation(null);
  };
  const handleCalculate = () => {
    if (FIELDS.some((f) => !inputs[f].trim())) return;
    setEquation({ ...inputs });
    setShowNearby(false);
  };
  const handlePreset = ([a, b, c]) => {
    setInputs({ a, b, c });
    setEquation({ a, b, c });
    setShowNearby(false);
  };

  const incomplete = FIELDS.some((f) => !inputs[f].trim());
  const calcDisabled = !embeddings || incomplete;
  const calcLabel = embeddings ? t("calculate") : t("loadingProgress", { model: modelLabel, percent: Math.round(progress * 100) });
  const errorMessage = calc?.error ?? null;
  const errorField = calc?.errorField ?? null;

  return (
    <>

      <VisualizerLayout
        leftPanel={
          <VectorPlaygroundControls
            embeddingModel={embeddingModel}
            onEmbeddingModelChange={setEmbeddingModel}
            showGridlines={showGridlines}
            onShowGridlinesChange={setShowGridlines}
            wordsText={wordsText}
            onWordsTextChange={setWordsText}
            manualWords={manualWords}
            wordColors={wordColors}
            inputs={inputs}
            onInputChange={onInputChange}
            onPreset={handlePreset}
            onCalculate={handleCalculate}
            calcDisabled={calcDisabled}
            calcLabel={calcLabel}
            result={result}
            errorMessage={errorMessage}
            errorField={errorField}
          />
        }
        mobileControlSections={[
          {
            id: "model",
            icon: Database,
            label: t("tabs.model"),
            content: (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t("model")}</h3>
                  <div className="space-y-2">
                    <label htmlFor="mobile-embedding-select" className="text-sm font-medium">
                      {t("model")}
                    </label>
                    <Select value={embeddingModel} onValueChange={setEmbeddingModel}>
                      <SelectTrigger id="mobile-embedding-select" className="w-full">
                        <SelectValue placeholder={t("modelPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="glove_300D">GloVe 300D</SelectItem>
                        <SelectItem value="fasttext_300D">FastText 300D</SelectItem>
                        <SelectItem value="word2vec_300D">Word2Vec 300D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "display",
            icon: Grid,
            label: t("tabs.display"),
            content: (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t("displayOptions")}</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="mobile-gridlines" checked={showGridlines} onCheckedChange={setShowGridlines} />
                    <label htmlFor="mobile-gridlines" className="text-sm font-medium cursor-pointer">
                      {t("gridlines")}
                    </label>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "words",
            icon: FileText,
            label: t("tabs.words"),
            content: (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t("wordsToPlot")}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-words-input" className="text-sm font-medium">
                      {t("wordsToPlotLimit")}
                    </Label>
                    <Textarea
                      id="mobile-words-input"
                      value={wordsText}
                      onChange={(e) => setWordsText(e.target.value)}
                      placeholder={t("wordsPlaceholder")}
                      className="min-h-[120px] resize-none"
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("wordCount", { count: Math.min(wordsText.split(/\s+/).filter((w) => w.trim().length > 0).length, 50) })}
                    </p>
                    <WordChips words={manualWords} colors={wordColors} modelLabel={modelLabel} dimmed={!!result} />
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "calculation",
            icon: Calculator,
            label: t("tabs.calc"),
            content: (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t("calculation")}</h3>
                  <div className="space-y-4">
                    <EquationInputs inputs={inputs} onInputChange={onInputChange} onCalculate={handleCalculate} errorField={errorField} />
                    {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
                    <Button onClick={handleCalculate} variant="default" className="w-full" disabled={calcDisabled}>
                      {calcLabel}
                    </Button>
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">{t("orTryExample")}</p>
                    <PresetChips onPick={handlePreset} />
                  </div>
                </div>
              </div>
            ),
          },
        ]}
        rightCanvas={
          <div className="relative w-full h-full">
            {!embeddings && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
                <div className="flex w-56 flex-col items-center gap-3">
                  <p className="text-sm text-neutral-300">{t("loadingEmbeddings", { model: modelLabel })}</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                    <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                  <p className="font-mono text-xs text-neutral-500">{Math.round(progress * 100)}%</p>
                </div>
              </div>
            )}
            <ResultCard result={result} onClose={() => { setEquation(null); setShowNearby(false); }} open={showNearby} onToggle={() => setShowNearby(!showNearby)} top={isMinimalistMode ? "md:top-32" : "md:top-16"} />
            <PlotLegend result={result} view={view} />
            <button
              type="button"
              onClick={() => setView((v) => (v === "centred" ? "zero" : "centred"))}
              title={t(`views.${view}.hint`)}
              aria-label={t("changeView", { view: t(`views.${view}.label`) })}
              className={`absolute left-3 top-20 ${isMinimalistMode ? "md:top-20" : "md:top-3"} z-40 flex items-center gap-2 rounded-full border border-white/15 bg-neutral-950/80 py-1.5 pl-2.5 pr-3.5 text-xs font-medium text-neutral-200 backdrop-blur-md transition-colors hover:bg-neutral-800`}
            >
              <Eye className="h-4 w-4 text-sky-300" />
              <span className="text-neutral-400">{t("view")}</span> {t(`views.${view}.label`)}
            </button>
            <VectorPlaygroundCanvas showGridlines={showGridlines} items={scene.items} links={scene.links} originLabel={t(`views.${view}.origin`)} />
          </div>
        }
      />
    </>
  );
}
