import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";

// Everything about the Learn articles except their bodies. Index pages, the sitemap and link-preview images
// import this, not registry.js: pulling the article bodies (and their CSS) into those routes made the
// production build file the article stylesheet under the wrong route, so article pages rendered unstyled.
const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE, GREEN, PINK] = CLUSTER_COLORS;

// Track titles and blurbs live in messages under Learn.tracks.<id>.
export const TRACKS = ["start", "foundations", "guides"];

// Order here is reading order: it drives the index, the previous/next links and the static routes.
export const ARTICLES = [
  {
    slug: "how-llms-work", track: "start", tag: "Quick Start", color: SKY,
    title: "How a language model turns your words into an answer",
    summary: "Text, tokens, vectors, a transformer, and one token at a time: the whole pipeline in plain language.",
    minutes: 8,
  },
  {
    slug: "why-tokens", track: "foundations", topic: "Tokens", tag: "Tokens", color: YELLOW,
    title: "Why models read tokens, not letters or words",
    summary: "The trade-off between letters, words and word pieces, and why every modern model settled on pieces, with bytes as a safety net.",
    minutes: 6,
  },
  {
    slug: "tokenization-algorithms", track: "foundations", topic: "Tokens", tag: "Tokens", color: YELLOW,
    title: "How tokenizers are built: BPE, WordPiece and Unigram",
    summary: "Step by step through byte-pair encoding, and how WordPiece and Unigram make different choices.",
    minutes: 6,
  },
  {
    slug: "tokens-beyond-text", track: "foundations", topic: "Tokens", tag: "Tokens", color: PINK,
    title: "Tokens beyond text: images, audio and video",
    summary: "How multimodal models cut pictures into patches and sound into frames so they can be read like words.",
    minutes: 5,
  },
  {
    slug: "what-are-embeddings", track: "foundations", topic: "Embeddings", tag: "Embeddings", color: TEAL,
    title: "What are embeddings?",
    summary: "Turning a word into a list of numbers so that similar meanings end up close together.",
    minutes: 7,
  },
  {
    slug: "latent-space", track: "foundations", topic: "Embeddings", tag: "Embeddings", color: TEAL,
    title: "Latent space: the hidden meaning in numbers",
    summary: "What the dimensions of an embedding capture, why directions carry meaning, and what we can't read directly.",
    minutes: 7,
  },
  {
    slug: "dimensionality-reduction", track: "foundations", topic: "Embeddings", tag: "Embeddings", color: SKY,
    title: "Seeing high dimensions: PCA, t-SNE, UMAP and friends",
    summary: "How to squash hundreds of dimensions into 2 or 3, what each method keeps, and what it quietly throws away.",
    minutes: 7,
  },
  {
    slug: "attention-and-transformers", track: "foundations", topic: "Transformers", tag: "Transformers", color: INDIGO,
    title: "Attention and the transformer, explained from scratch",
    summary: "How each token looks at the others to update its meaning, and how stacking that idea builds a transformer.",
    minutes: 7,
  },
  {
    slug: "next-token-prediction", track: "foundations", topic: "Transformers", tag: "Transformers", color: PURPLE,
    title: "From the last vector to the next word",
    summary: "Logits, softmax, temperature, top-k and top-p: how a model picks what to say next.",
    minutes: 5,
  },

  {
    slug: "what-is-a-token", track: "guides",
    tag: "Tokens",
    color: YELLOW,
    title: "What is a token, and why isn’t it a word?",
    summary: "How tokenizers cut text into reusable pieces, and why those pieces rarely line up with words.",
    minutes: 4,
    cta: { href: "/tokenizer", label: "Open the Tokenizer", text: "Paste any sentence and see exactly how GPT and LLaMA tokenizers split it, with every token’s ID." },
  },
  {
    slug: "why-emoji-cost-more-tokens", track: "guides",
    tag: "Tokens",
    color: PINK,
    title: "Why emoji and other languages cost more tokens",
    summary: "UTF-8 bytes, byte-level BPE, and why the same greeting can take 4 tokens or 25.",
    minutes: 4,
    cta: { href: "/tokenizer", label: "Try the presets", text: "Load the World scripts or Emoji preset and switch tokenizers to watch the count change." },
  },
  {
    slug: "how-a-word-becomes-300-numbers", track: "guides",
    tag: "Embeddings",
    color: TEAL,
    title: "How a word becomes 300 numbers",
    summary: "What word embeddings are, how GloVe, Word2Vec and FastText learn them, and how to measure similarity.",
    minutes: 4,
    cta: { href: "/embedding", label: "Explore embeddings", text: "Fly through thousands of words from GloVe, Word2Vec or FastText and see which ones end up close together." },
  },
  {
    slug: "pca-vs-umap", track: "guides",
    tag: "Embeddings",
    color: SKY,
    title: "PCA vs UMAP: two ways to flatten meaning",
    summary: "Two ways to squeeze 300 dimensions into 3, what each one keeps, and how to read the result.",
    minutes: 4,
    cta: { href: "/embedding", label: "Compare PCA and UMAP", text: "Switch between the two projections on the same words and see what each one reveals." },
  },
  {
    slug: "king-man-woman", track: "guides",
    tag: "Vectors",
    color: PURPLE,
    title: "King − man + woman, explained",
    summary: "Word analogies as arrow arithmetic: what the Playground computes, why it works, and where it breaks.",
    minutes: 4,
    cta: { href: "/vector-playground", label: "Open the Playground", text: "Type king, man and woman into the a − b + c boxes, then try your own analogies." },
  },
];
