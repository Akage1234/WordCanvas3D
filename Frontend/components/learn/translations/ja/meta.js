// Translated titles, summaries and CTAs for Learn articles in this locale, keyed by slug.
// Shape: { "why-tokens": { title, summary, cta: { label, text } } }. See ../README.md.
export default {
  "how-llms-work": {
    title: "言語モデルはあなたの言葉をどう答えに変えるのか",
    summary: "テキスト、トークン、ベクトル、Transformer、そして 1 トークンずつ。処理の流れ全体をやさしい言葉で。"
  },
  "why-tokens": {
    title: "モデルが文字でも単語でもなくトークンを読む理由",
    summary: "文字、単語、単語の断片のトレードオフと、現代のモデルがみな断片を選び、バイトをセーフティネットにした理由。"
  },
  "tokenization-algorithms": {
    title: "トークナイザーの作り方：BPE、WordPiece、Unigram",
    summary: "バイトペア符号化を一歩ずつたどり、WordPiece と Unigram がどう違う選び方をするかを見ます。"
  },
  "tokens-beyond-text": {
    title: "テキスト以外のトークン：画像、音声、動画",
    summary: "マルチモーダルモデルが画像をパッチに、音をフレームに切り分け、単語のように読めるようにする仕組み。"
  },
  "what-are-embeddings": {
    title: "埋め込みとは何か？",
    summary: "単語を数値のリストに変え、意味の似たものが近くに集まるようにする仕組み。"
  },
  "latent-space": {
    title: "潜在空間：数値に隠れた意味",
    summary: "埋め込みの次元が捉えているもの、方向が意味を持つ理由、そして直接は読み取れないもの。"
  },
  "dimensionality-reduction": {
    title: "高次元を見る：PCA、t-SNE、UMAP など",
    summary: "何百もの次元を 2 次元や 3 次元に押し縮める方法と、各手法が残すもの、こっそり捨てるもの。"
  },
  "attention-and-transformers": {
    title: "アテンションと Transformer をゼロから解説",
    summary: "各トークンが他のトークンを見て自分の意味を更新する仕組みと、それを積み重ねて Transformer ができるまで。"
  },
  "next-token-prediction": {
    title: "最後のベクトルから次の単語へ",
    summary: "ロジット、ソフトマックス、温度、top-k、top-p：モデルが次に何を言うかを選ぶ仕組み。"
  },
  "what-is-a-token": {
    title: "トークンとは何か、なぜ単語ではないのか？",
    summary: "トークナイザーがテキストを使い回せる断片に切り分ける仕組みと、その断片が単語とめったに一致しない理由。",
    cta: {
      label: "トークナイザーを開く",
      text: "好きな文を貼り付けて、GPT や LLaMA のトークナイザーがどう分割するかを、各トークンの ID と一緒に確かめましょう。"
    }
  },
  "why-emoji-cost-more-tokens": {
    title: "絵文字や他の言語でトークンが多くかかる理由",
    summary: "UTF-8 バイト、バイトレベル BPE、そして同じあいさつが 4 トークンにも 25 トークンにもなる理由。",
    cta: {
      label: "プリセットを試す",
      text: "「世界の文字」や「絵文字」のプリセットを読み込み、トークナイザーを切り替えて、トークン数が変わる様子を見てみましょう。"
    }
  },
};
