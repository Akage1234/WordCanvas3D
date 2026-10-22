import { TRACKS, articlesFor } from "./catalog";
import { GUIDE_BODIES, GUIDE_FAQ } from "./guides";
import * as HowLlmsWork from "./articles/how-llms-work";
import * as WhyTokens from "./articles/why-tokens";
import * as TokenizationAlgorithms from "./articles/tokenization-algorithms";
import * as TokensBeyondText from "./articles/tokens-beyond-text";
import * as WhatAreEmbeddings from "./articles/what-are-embeddings";
import * as LatentSpace from "./articles/latent-space";
import * as DimensionalityReduction from "./articles/dimensionality-reduction";
import * as AttentionAndTransformers from "./articles/attention-and-transformers";
import * as NextTokenPrediction from "./articles/next-token-prediction";
import zh from "./translations/zh";
import ja from "./translations/ja";
import es from "./translations/es";

// Article content by slug: { default: Body, faq, reading }. Only the article page should import this module;
// everything else uses ./catalog.
const EN = {
  "how-llms-work": HowLlmsWork,
  "why-tokens": WhyTokens,
  "tokenization-algorithms": TokenizationAlgorithms,
  "tokens-beyond-text": TokensBeyondText,
  "what-are-embeddings": WhatAreEmbeddings,
  "latent-space": LatentSpace,
  "dimensionality-reduction": DimensionalityReduction,
  "attention-and-transformers": AttentionAndTransformers,
  "next-token-prediction": NextTokenPrediction,
  ...Object.fromEntries(Object.entries(GUIDE_BODIES).map(([slug, Body]) => [slug, { default: Body, faq: GUIDE_FAQ[slug] }])),
};

// Translated content, same shape as EN, by locale then slug. Each locale registers its own articles in
// translations/<locale>/index.js, so translations for different languages never touch the same file.
const TRANSLATED = { zh, ja, es };

export { TRACKS };

// Every article for one locale. `translated` is false when the body falls back to English.
export function getArticles(locale) {
  return articlesFor(locale).map((a) => {
    const own = TRANSLATED[locale]?.[a.slug];
    const c = own ?? EN[a.slug];
    return { ...a, Body: c.default, faq: c.faq ?? [], reading: c.reading ?? [], translated: locale === "en" || !!own };
  });
}
