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
  "next-token-prediction": {
    title: "Del último vector a la siguiente palabra",
    summary: "Logits, softmax, temperatura, top-k y top-p: cómo un modelo elige qué decir a continuación.",
  },
  "what-is-a-token": {
    title: "¿Qué es un token y por qué no es una palabra?",
    summary: "Cómo los tokenizadores cortan el texto en pedazos reutilizables, y por qué esos pedazos rara vez coinciden con las palabras.",
    cta: { label: "Abrir el Tokenizador", text: "Pega cualquier frase y mira exactamente cómo la dividen los tokenizadores de GPT y LLaMA, con el ID de cada token." },
  },
  "why-emoji-cost-more-tokens": {
    title: "Por qué los emoji y otros idiomas cuestan más tokens",
    summary: "Bytes UTF-8, BPE a nivel de bytes y por qué el mismo saludo puede ocupar 4 tokens o 25.",
    cta: { label: "Prueba los ejemplos", text: "Carga el ejemplo Escrituras del mundo o Emoji y cambia de tokenizador para ver cómo cambia el conteo." },
  },
  "how-a-word-becomes-300-numbers": {
    title: "Cómo una palabra se convierte en 300 números",
    summary: "Qué son los embeddings de palabras, cómo los aprenden GloVe, Word2Vec y FastText, y cómo se mide la similitud.",
    cta: { label: "Explorar embeddings", text: "Vuela entre miles de palabras de GloVe, Word2Vec o FastText y mira cuáles terminan cerca." },
  },
  "pca-vs-umap": {
    title: "PCA vs UMAP: dos maneras de aplanar el significado",
    summary: "Dos maneras de comprimir 300 dimensiones en 3, qué conserva cada una y cómo leer el resultado.",
    cta: { label: "Comparar PCA y UMAP", text: "Cambia entre las dos proyecciones con las mismas palabras y mira qué revela cada una." },
  },
};
