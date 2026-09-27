import { ARTICLES as CATALOG, TRACKS } from "./catalog";
import { GUIDE_BODIES } from "./guides";
import HowLlmsWork from "./articles/how-llms-work";
import WhyTokens from "./articles/why-tokens";
import TokenizationAlgorithms from "./articles/tokenization-algorithms";
import TokensBeyondText from "./articles/tokens-beyond-text";
import WhatAreEmbeddings from "./articles/what-are-embeddings";
import LatentSpace from "./articles/latent-space";
import DimensionalityReduction from "./articles/dimensionality-reduction";
import AttentionAndTransformers from "./articles/attention-and-transformers";
import NextTokenPrediction from "./articles/next-token-prediction";

// Article bodies by slug. Only the article page should import this module; everything else uses ./catalog.
const BODIES = {
  "how-llms-work": HowLlmsWork,
  "why-tokens": WhyTokens,
  "tokenization-algorithms": TokenizationAlgorithms,
  "tokens-beyond-text": TokensBeyondText,
  "what-are-embeddings": WhatAreEmbeddings,
  "latent-space": LatentSpace,
  "dimensionality-reduction": DimensionalityReduction,
  "attention-and-transformers": AttentionAndTransformers,
  "next-token-prediction": NextTokenPrediction,
  ...GUIDE_BODIES,
};

export { TRACKS };
export const ARTICLES = CATALOG.map((a) => ({ ...a, Body: BODIES[a.slug] }));
