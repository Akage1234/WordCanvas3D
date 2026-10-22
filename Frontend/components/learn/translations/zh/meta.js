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
  "attention-and-transformers": {
    title: "从零讲清注意力机制与 Transformer",
    summary: "每个词元如何查看其他词元来更新自己的含义，以及把这个思想层层堆叠如何构成 Transformer。",
  },
  "next-token-prediction": {
    title: "从最后一个向量到下一个词",
    summary: "logits、softmax、温度、top-k 和 top-p：模型如何挑选接下来要说的话。",
  },
  "what-is-a-token": {
    title: "什么是词元？它为什么不是一个词？",
    summary: "分词器如何把文本切成可复用的片段，以及为什么这些片段很少和单词对齐。",
    cta: { label: "打开分词器", text: "粘贴任意句子，准确地看到 GPT 和 LLaMA 的分词器如何切分它，以及每个词元的 ID。" },
  },
  "why-emoji-cost-more-tokens": {
    title: "为什么表情符号和其他语言更费词元",
    summary: "UTF-8 字节、字节级 BPE，以及为什么同一句问候可能占 4 个词元，也可能占 25 个。",
    cta: { label: "试试预设", text: "加载“多种文字”或“表情符号”预设，再切换分词器，看看词元数如何变化。" },
  },
  "how-a-word-becomes-300-numbers": {
    title: "一个词如何变成 300 个数字",
    summary: "什么是词嵌入，GloVe、Word2Vec 和 FastText 如何学习它们，以及如何衡量相似度。",
    cta: { label: "探索词嵌入", text: "在来自 GloVe、Word2Vec 或 FastText 的数千个词中穿行，看看哪些词最终靠在一起。" },
  },
  "pca-vs-umap": {
    title: "PCA 与 UMAP：压平意义的两种方式",
    summary: "把 300 个维度压到 3 个的两种方式，各自保留了什么，以及怎样读结果。",
    cta: { label: "比较 PCA 和 UMAP", text: "在同一批词上切换两种投影，看看每种投影揭示了什么。" },
  },
  "king-man-woman": {
    title: "King − man + woman 详解",
    summary: "把词语类比看作箭头的算术：实验场计算的是什么，为什么有效，又在哪里失效。",
    cta: { label: "打开向量实验场", text: "在 a − b + c 框中输入 king、man 和 woman，然后试试你自己的类比。" },
  },
};
