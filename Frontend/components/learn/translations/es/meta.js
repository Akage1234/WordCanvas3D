// Translated titles, summaries and CTAs for Learn articles in this locale, keyed by slug.
// Shape: { "why-tokens": { title, summary, cta: { label, text } } }. See ../README.md.
export default {
  "how-llms-work": {
    title: "Cómo un modelo de lenguaje convierte tus palabras en una respuesta",
    summary: "Texto, tokens, vectores, un transformer y un token a la vez: todo el proceso explicado en lenguaje sencillo.",
  },
  "why-tokens": {
    title: "Por qué los modelos leen tokens y no letras ni palabras",
    summary: "El equilibrio entre letras, palabras y pedazos de palabra, y por qué todos los modelos modernos se quedaron con los pedazos, con los bytes como red de seguridad.",
  },
  "tokenization-algorithms": {
    title: "Cómo se construyen los tokenizadores: BPE, WordPiece y Unigram",
    summary: "Paso a paso por byte-pair encoding, y en qué decisiones se distinguen WordPiece y Unigram.",
  },
  "tokens-beyond-text": {
    title: "Tokens más allá del texto: imágenes, audio y video",
    summary: "Cómo los modelos multimodales cortan las imágenes en parches y el sonido en tramas para poder leerlos como palabras.",
  },
  "what-are-embeddings": {
    title: "¿Qué son los embeddings?",
    summary: "Convertir una palabra en una lista de números para que los significados parecidos queden cerca.",
  },
  "latent-space": {
    title: "El espacio latente: el significado oculto en los números",
    summary: "Qué capturan las dimensiones de un embedding, por qué las direcciones llevan significado y qué no podemos leer directamente.",
  },
  "dimensionality-reduction": {
    title: "Ver muchas dimensiones: PCA, t-SNE, UMAP y compañía",
    summary: "Cómo aplastar cientos de dimensiones en 2 o 3, qué conserva cada método y qué desecha sin avisar.",
  },
  "attention-and-transformers": {
    title: "La atención y el transformer, explicados desde cero",
    summary: "Cómo cada token mira a los demás para actualizar su significado, y cómo apilar esa idea construye un transformer.",
  },
};
