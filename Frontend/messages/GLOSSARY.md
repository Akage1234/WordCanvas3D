# Translation glossary

Fixed terms for translating `en.json` into Chinese (`zh`), Japanese (`ja`) and Spanish (`es`).
One term, one translation, everywhere on the site. All decisions are made (2026-09-27).

## Style

| | 中文 (zh) | 日本語 (ja) | Español (es) |
|---|---|---|---|
| Script / variant | Simplified Chinese only | Standard Japanese | Neutral Latin American |
| Register | Plain, friendly; no 您 | です・ます | Informal *tú* |
| Punctuation | Full-width （），。：；“” | Full-width 、。「」 | Opening ¿ and ¡; quotes “ ” |
| Numbers | Arabic numerals | Arabic numerals | Arabic numerals |

Number grouping (1,000 vs 1.000) is left to `Intl`: messages use `{count, number}`, so never hard-code separators.

## Never translate

WordCanvas3D, GloVe, Word2Vec, FastText, PCA, UMAP, t-SNE, BPE, WordPiece, Unigram, GPT, LLaMA, tiktoken,
SentencePiece, UTF-8, WebGL, GitHub, `<|endoftext|>`, `<unk>`, token IDs and example words inside the tools
(king, queen, paris…: the embedding data is English only).

## Tool names

Nav labels and page titles are translated. Only the brand WordCanvas3D stays in English.

| English | zh | ja | es |
|---|---|---|---|
| Tokenizer | 分词器 | トークナイザー | Tokenizador |
| Embedding (explorer) | 词嵌入（浏览器） | 埋め込み（エクスプローラー） | Embeddings (explorador) |
| Vector Playground | 向量实验场 | ベクトル・プレイグラウンド | Laboratorio de vectores |
| Learn | 学习 | 学ぶ | Aprender |


## Terms

| # | English | 中文 (zh) | 日本語 (ja) | Español (es) | Notes |
|---|---|---|---|---|---|
| 1 | token | 词元 | トークン | token (m.), pl. tokens | zh: 词元 everywhere; add “（token）” on first use in a given text. |
| 2 | tokenizer | 分词器 | トークナイザー | tokenizador | |
| 3 | tokenization | 分词（词元化） | トークン化 | tokenización | zh: 分词 in UI; 词元化 only where “word segmentation” would mislead. |
| 4 | token ID | 词元 ID | トークン ID | ID de token | |
| 5 | vocabulary | 词表 | 語彙 | vocabulario | |
| 6 | special token | 特殊词元 | 特殊トークン | token especial | |
| 7 | byte / UTF-8 bytes | 字节 / UTF-8 字节 | バイト / UTF-8 バイト | byte / bytes UTF-8 | |
| 8 | code point | 码位 | コードポイント | punto de código | |
| 9 | whitespace | 空白字符 | 空白文字 | espacios en blanco | “Show whitespace”: 显示空白字符 / 空白文字を表示 / Mostrar espacios |
| 10 | embedding | 嵌入（词嵌入） | 埋め込み | embedding (m.) | es: *incrustación* is correct but rarely used; keep embedding. ja: avoid エンベディング except in parentheses once. |
| 11 | word vector | 词向量 | 単語ベクトル | vector de palabra | |
| 12 | vector | 向量 | ベクトル | vector | |
| 13 | dimension / 300-D | 维度 / 300 维 | 次元 / 300 次元 | dimensión / 300 dimensiones | |
| 14 | dimensionality reduction | 降维 | 次元削減 | reducción de dimensionalidad | |
| 15 | projection | 投影 | 射影 | proyección | |
| 16 | cluster | 簇（聚类） | クラスター | clúster | zh: 簇 for a group, 聚类 for the act of grouping. es: RAE spelling clúster. |
| 17 | nearest neighbour | 最近邻 | 最近傍 | vecino más cercano | |
| 18 | cosine similarity | 余弦相似度 | コサイン類似度 | similitud coseno | “cos 0.73” stays as is. |
| 19 | analogy (king − man + woman) | 类比 | 類推（アナロジー） | analogía | |
| 20 | latent space | 潜在空间 | 潜在空間 | espacio latente | |
| 21 | origin / real zero | 原点 / 真正的零点 | 原点 / 本当のゼロ点 | origen / cero real | |
| 22 | group centre (average) | 组中心（平均点） | グループの中心（平均） | centro del grupo (promedio) | |
| 23 | language model / LLM | 语言模型 / 大语言模型 | 言語モデル / 大規模言語モデル | modelo de lenguaje / LLM | |
| 24 | transformer | Transformer | Transformer | transformer (m.) | Keep Latin script in zh/ja. |
| 25 | attention | 注意力（机制） | アテンション（注意機構） | atención | |
| 26 | next-token prediction | 下一个词元预测 | 次トークン予測 | predicción del siguiente token | |
| 27 | logits | logits | ロジット | logits | |
| 28 | softmax | softmax | ソフトマックス | softmax | |
| 29 | temperature / top-k / top-p | 温度 / top-k / top-p | 温度 / top-k / top-p | temperatura / top-k / top-p | |
| 30 | dataset | 数据集 | データセット | conjunto de datos | |
| 31 | model (embedding model) | 模型（嵌入模型） | モデル（埋め込みモデル） | modelo (modelo de embeddings) | |
| 32 | multimodal | 多模态 | マルチモーダル | multimodal | |

## Site words

| English | zh | ja | es |
|---|---|---|---|
| Quick Start | 快速入门 | クイックスタート | Inicio rápido |
| Foundations | 基础知识 | 基礎 | Fundamentos |
| Site guides | 站点指南 | サイトガイド | Guías del sitio |
| min read | 分钟阅读 | 分で読めます | min de lectura |
| Show labels / Motion / Clusters | 显示标签 / 动态 / 簇 | ラベル表示 / モーション / クラスター | Etiquetas / Movimiento / Clústeres |
| Calculate | 计算 | 計算 | Calcular |
| This article is in English (planned note) | 本文暂无中文版，以下为英文原文。 | この記事は英語のみです。 | Este artículo solo está disponible en inglés. |
