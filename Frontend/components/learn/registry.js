import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { GUIDES } from "./guides";
import HowLlmsWork, { minutes as HowLlmsWorkMinutes } from "./articles/how-llms-work";
import WhyTokens, { minutes as WhyTokensMinutes } from "./articles/why-tokens";
import TokenizationAlgorithms, { minutes as TokenizationAlgorithmsMinutes } from "./articles/tokenization-algorithms";
import TokensBeyondText, { minutes as TokensBeyondTextMinutes } from "./articles/tokens-beyond-text";
import WhatAreEmbeddings, { minutes as WhatAreEmbeddingsMinutes } from "./articles/what-are-embeddings";
import LatentSpace, { minutes as LatentSpaceMinutes } from "./articles/latent-space";
import DimensionalityReduction, { minutes as DimensionalityReductionMinutes } from "./articles/dimensionality-reduction";
import AttentionAndTransformers, { minutes as AttentionAndTransformersMinutes } from "./articles/attention-and-transformers";
import NextTokenPrediction, { minutes as NextTokenPredictionMinutes } from "./articles/next-token-prediction";

const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE, GREEN, PINK] = CLUSTER_COLORS;

export const TRACKS = [
  { id: "start", title: "Start here", blurb: "No background needed. The whole journey from your text to the model's answer, in one picture." },
  { id: "foundations", title: "Foundations", blurb: "General study material. Each article explains one idea properly, the way a good textbook chapter would." },
  { id: "guides", title: "Site guides", blurb: "Quick tours of what each WordCanvas3D tool shows, with links back to the foundations." },
];

// Order here is reading order: it drives the index, the previous/next links and the static routes.
export const ARTICLES = [
  {
    slug: "how-llms-work", track: "start", tag: "Quick Start", color: SKY,
    title: "How a language model turns your words into an answer",
    summary: "Text, tokens, vectors, a transformer, and one token at a time: the whole pipeline in plain language.",
    Body: HowLlmsWork, minutes: HowLlmsWorkMinutes,
  },
  {
    slug: "why-tokens", track: "foundations", topic: "Tokens", tag: "Tokens", color: YELLOW,
    title: "Why models read tokens, not letters or words",
    summary: "The trade-off between letters, words and word pieces, and why every modern model settled on pieces, with bytes as a safety net.",
    Body: WhyTokens, minutes: WhyTokensMinutes,
  },
  {
    slug: "tokenization-algorithms", track: "foundations", topic: "Tokens", tag: "Tokens", color: YELLOW,
    title: "How tokenizers are built: BPE, WordPiece and Unigram",
    summary: "Step by step through byte-pair encoding, and how WordPiece and Unigram make different choices.",
    Body: TokenizationAlgorithms, minutes: TokenizationAlgorithmsMinutes,
  },
  {
    slug: "tokens-beyond-text", track: "foundations", topic: "Tokens", tag: "Tokens", color: PINK,
    title: "Tokens beyond text: images, audio and video",
    summary: "How multimodal models cut pictures into patches and sound into frames so they can be read like words.",
    Body: TokensBeyondText, minutes: TokensBeyondTextMinutes,
  },
  {
    slug: "what-are-embeddings", track: "foundations", topic: "Embeddings", tag: "Embeddings", color: TEAL,
    title: "What are embeddings?",
    summary: "Turning a word into a list of numbers so that similar meanings end up close together.",
    Body: WhatAreEmbeddings, minutes: WhatAreEmbeddingsMinutes,
  },
  {
    slug: "latent-space", track: "foundations", topic: "Embeddings", tag: "Embeddings", color: TEAL,
    title: "Latent space: the hidden meaning in numbers",
    summary: "What the dimensions of an embedding capture, why directions carry meaning, and what we can't read directly.",
    Body: LatentSpace, minutes: LatentSpaceMinutes,
  },
  {
    slug: "dimensionality-reduction", track: "foundations", topic: "Embeddings", tag: "Embeddings", color: SKY,
    title: "Seeing high dimensions: PCA, t-SNE, UMAP and friends",
    summary: "How to squash hundreds of dimensions into 2 or 3, what each method keeps, and what it quietly throws away.",
    Body: DimensionalityReduction, minutes: DimensionalityReductionMinutes,
  },
  {
    slug: "attention-and-transformers", track: "foundations", topic: "Transformers", tag: "Transformers", color: INDIGO,
    title: "Attention and the transformer, explained from scratch",
    summary: "How each token looks at the others to update its meaning, and how stacking that idea builds a transformer.",
    Body: AttentionAndTransformers, minutes: AttentionAndTransformersMinutes,
  },
  {
    slug: "next-token-prediction", track: "foundations", topic: "Transformers", tag: "Transformers", color: PURPLE,
    title: "From the last vector to the next word",
    summary: "Logits, softmax, temperature, top-k and top-p: how a model picks what to say next.",
    Body: NextTokenPrediction, minutes: NextTokenPredictionMinutes,
  },
  ...GUIDES.map((g) => ({ ...g, track: "guides" })),
];
