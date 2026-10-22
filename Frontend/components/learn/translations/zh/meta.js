// Translated titles, summaries and CTAs for Learn articles in this locale, keyed by slug.
// Shape: { "why-tokens": { title, summary, cta: { label, text } } }. See ../README.md.
export default {
  "how-llms-work": {
    title: "语言模型如何把你的话变成回答",
    summary: "文本、词元、向量、Transformer，再一次一个词元地生成：用通俗的语言讲清整条流程。",
  },
  "why-tokens": {
    title: "为什么模型读的是词元，而不是字母或单词",
    summary: "在字母、单词和词的片段之间如何取舍，为什么所有现代模型都选了片段，并用字节兜底。",
  },
  "tokenization-algorithms": {
    title: "分词器是怎样构建的：BPE、WordPiece 和 Unigram",
    summary: "一步步走完字节对编码的过程，再看 WordPiece 和 Unigram 做出了哪些不同的选择。",
  },
  "tokens-beyond-text": {
    title: "文本之外的词元：图像、音频和视频",
    summary: "多模态模型如何把图片切成图像块、把声音切成帧，好让它们像词一样被读取。",
  },
  "what-are-embeddings": {
    title: "什么是嵌入？",
    summary: "把一个词变成一串数字，让意思相近的词彼此靠近。",
  },
  "latent-space": {
    title: "潜在空间：数字中隐藏的意义",
    summary: "嵌入的各个维度捕捉了什么，为什么方向能携带意义，以及哪些东西我们无法直接读出。",
  },
  "dimensionality-reduction": {
    title: "看见高维空间：PCA、t-SNE、UMAP 及其他方法",
    summary: "怎样把几百个维度压到 2 维或 3 维，每种方法保留了什么，又悄悄丢掉了什么。",
  },
};
