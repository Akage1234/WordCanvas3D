import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { WordMap } from "./what-are-embeddings.figures";
import s from "@/components/learn/articles/what-are-embeddings.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW] = CLUSTER_COLORS;

// First 16 of the 300 numbers for each word in the site's GloVe file.
const DENSE = {
  cat: [-0.59, -0.05, 0.23, -0.78, 0.26, 0.03, 0.09, 0.46, -0.43, 0.55, -0.19, 0.16, -0.45, -0.43, -0.63, -0.51],
  dog: [-0.63, 0.14, 0.52, -0.71, 0.12, 0.4, 0.05, 0.18, -0.19, 0.64, -0.3, 0.83, -0.23, -0.84, -0.25, -0.44],
  car: [0.25, 0.51, -0.59, -0.39, 0.15, 0.32, -0.15, -0.32, -0.19, -0.04, -0.51, 0.17, -0.35, -0.06, 0.44, -0.3],
};
const ONE_HOT = { cat: 3, dog: 9, car: 13 };

function OneHotVsDense() {
  return (
    <Fig caption="上：one-hot ベクトル。10,000 個ではなく 16 個の枠で描いています（説明用）。各単語は自分の枠だけが点灯するので、どの 2 単語も何も共有しません。下：同じ単語の本物の GloVe の数値 300 個のうち最初の 16 個（ティールが正、赤が負）。cat（猫）と dog（犬）は似たパターンで、car（車）は異なります。">
      <div className={s.vecRows} role="img" aria-label="cat、dog、car の one-hot ベクトルは埋まった枠を共有しません。密な GloVe ベクトルでは、cat と dog が似たパターン、car が異なるパターンを示します。">
        <p className={s.vecNote}>one-hot · 語彙の単語ごとに 1 枠</p>
        {Object.entries(ONE_HOT).map(([w, on]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={s.slots} style={{ "--tc": SKY }}>
              {Array.from({ length: 16 }, (_, i) => <i key={i} data-on={i === on ? "" : undefined} />)}
            </span>
          </div>
        ))}
        <p className={s.vecNote}>埋め込み · 学習された数値（300 個のうち最初の 16 個）</p>
        {Object.entries(DENSE).map(([w, vals]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={`${s.slots} ${s.dense}`}>
              {vals.map((v, i) => <i key={i} style={{ "--tc": v < 0 ? RED : TEAL, "--a": Math.min(1, Math.abs(v) * 1.2) }} />)}
            </span>
          </div>
        ))}
      </div>
    </Fig>
  );
}

// Angles are arccos of the real cosine similarity between "cat" and each word.
const ANGLES = [["dog", 0.722, TEAL, 190], ["car", 0.282, YELLOW, 160], ["democracy", 0.148, RED, 200]];

function CosineFan() {
  const ox = 150, oy = 230, len = 190;
  return (
    <Fig caption="コサイン類似度は 2 本の矢印の間の角度についての量です。各矢印は、その単語の GloVe ベクトルと cat のベクトルの間の本物の角度で描いています（cat–dog は 0.72 で約 44°、cat–car は 0.28 で約 74°、cat–democracy〔民主主義〕は 0.15 で約 81°）。ここで意味があるのは角度だけで、長さには意味はありません。">
      <svg viewBox="0 0 420 260" className={l.big} role="img" aria-label="共通の原点から伸びる矢印：cat は底辺に沿って、dog は 44 度、car は 74 度、democracy は 81 度の向き。">
        <line x1={ox} y1={oy} x2={ox + len} y2={oy} stroke={SKY} strokeWidth="2.5" />
        <text x={ox + len + 6} y={oy + 4} className={s.label}>cat</text>
        {ANGLES.map(([w, c, col, arm]) => {
          const a = Math.acos(c);
          const x = ox + Math.cos(a) * arm, y = oy - Math.sin(a) * arm;
          const r = 60 + (w === "dog" ? 0 : w === "car" ? 22 : 44);
          const ax = ox + Math.cos(a) * r, ay = oy - Math.sin(a) * r;
          return (
            <g key={w}>
              <line x1={ox} y1={oy} x2={x} y2={y} stroke={col} strokeWidth="2.5" />
              <path d={`M${ox + r} ${oy} A${r} ${r} 0 0 0 ${ax} ${ay}`} fill="none" stroke={col} strokeOpacity=".5" />
              <text x={w === "democracy" ? x - 6 : x + 6} y={y - 4} textAnchor={w === "democracy" ? "end" : "start"} className={s.label}>{w} · {c.toFixed(2)}</text>
            </g>
          );
        })}
        <circle cx={ox} cy={oy} r="3.5" fill="#fff" />
      </svg>
    </Fig>
  );
}

function BankContexts() {
  return (
    <Fig caption="説明用の図。静的埋め込みでは、どちらの文の「bank」にも同じ 1 つのベクトルが与えられます。文脈埋め込みのモデルは同じベクトルから始めますが、層が周りの単語の情報を混ぜ込むので、2 つの使い方は別々の場所に行き着きます。">
      <div className={s.ctx}>
        <p className={s.sentence}>She sat on the river <b style={{ "--tc": TEAL }}>bank</b> and watched the water.（彼女は川岸に座って水を眺めた。）</p>
        <p className={s.sentence}>He moved his savings to another <b style={{ "--tc": YELLOW }}>bank</b>.（彼は貯金を別の銀行に移した。）</p>
        <svg viewBox="0 0 420 150" className={l.big} role="img" aria-label="図：1 つの静的な bank のベクトルが、川の文のものと貯金の文のものの 2 つの文脈ベクトルに分かれます。">
          <circle cx="60" cy="75" r="6" fill={SKY} />
          <text x="60" y="100" textAnchor="middle" className={s.label}>bank（静的）</text>
          <path d="M70 72 C140 40 180 30 240 32" fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="4 4" />
          <path d="M70 78 C140 110 180 120 240 118" fill="none" stroke={YELLOW} strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="248" cy="32" r="6" fill={TEAL} />
          <circle cx="248" cy="118" r="6" fill={YELLOW} />
          <text x="260" y="36" className={s.label}>bank + “river”</text>
          <text x="260" y="122" className={s.label}>bank + “savings”</text>
          <text x="160" y="80" textAnchor="middle" className={s.dimText}>文脈が混ざる</text>
        </svg>
      </div>
    </Fig>
  );
}

export default function WhatAreEmbeddings() {
  return (
    <>
      <p>
        コンピューターは数値には強いのですが、意味には弱いものです。モデルが <code>cat</code>（猫）という単語で何か役に立つことをする前に、それを数値に変えなければなりません。
        面白いのは、<em>どんな</em>数値にするかという問題です。<strong>埋め込み</strong>（エンベディング）は、現代の言語システムのほぼすべてが使っている答えです。
        各単語（またはトークン）に対する数値のリストで、テキストから学習され、意味の似た単語が似たリストになるように配置されています。
      </p>

      <h2>単語ごとに番号を付けるだけではだめなのか？</h2>
      <p>
        いちばん単純な考え方は、語彙に番号を振ることです。<code>the</code> が 1、<code>cat</code> が 2、という具合です。これはおおよそトークナイザーがしていることです
        （<ArticleLink slug="why-tokens">モデルが文字でも単語でもなくトークンを読む理由</ArticleLink>を参照）。しかし、この番号は恣意的なラベルにすぎません。下で使う 10,000 単語のリストでは、<code>cat</code> は 5,606 番、<code>dog</code> は 3,037 番ですが、
        それは猫や犬について何も語りません。モデルは平気で <code>dog</code> が <code>cat</code> より「小さい」と結論づけてしまうでしょう。これはナンセンスです。
      </p>
      <p>
        古典的な解決策は <strong>one-hot ベクトル</strong>です。語彙の単語ごとに 1 つの枠があるリストで、その単語の枠だけが 1、残りはすべて 0 です。
        語彙が 10,000 単語なら、どの単語も 10,000 個の数値になります。見せかけの順序はなくなりますが、新しい問題が出てきます。
        どの単語のペアも、他のどのペアともまったく同じだけ異なるのです。<code>cat</code> は <code>democracy</code>（民主主義）と比べて <code>dog</code> に近いわけではありません。
        この表現には意味がまったく含まれていません。
      </p>
      <OneHotVsDense />

      <h2>学習された数値の短いリスト</h2>
      <p>
        埋め込みは発想を逆にします。各単語には<strong>密な</strong>ベクトルが与えられます。ずっと短いリスト（100〜1,000 個の数値が多く、ここでは 300 個）で、どの位置にも何らかの値が入っています。
        これらの値を人が手で選ぶことはありません。最初はランダムで、学習の中で、似た使われ方をする単語が似たリストになるまで調整されます。
      </p>
      <p>
        300 個の数値の各リストを座標とみなすと、どの単語も 300 次元の空間の 1 点になります。すると「意味が似ている」は「近くにある」ということになります。
        300 次元は描けませんが、少数の単語を 2 次元に押し縮めて見ることはできます。
      </p>
      <Fig caption="本物の GloVe のデータです。42 単語を、互いの距離が 300 次元での距離にできるだけ合うように 2 次元に配置しています（MDS という手法を、この 42 単語だけに適用しているので、配置はおおよそのものです）。地図の下のリストは正確な値で、全 10,000 単語の中で、各単語にコサイン類似度で最も近い 6 単語を示しています。apple、rice、mouse を試してみてください。">
        <WordMap />
      </Fig>
      <p>
        グループはひとりでにできています。ベクトルは、動物や国が何であるかを一度も教わっていません。意外な結果も同じくらい学びになります。
        <code>apple</code>（りんご）は食べ物とテクノロジーの間にあり、最近傍はすべて企業です。学習テキストが果物よりも企業としての Apple についてはるかに多く語っているからです。
        <code>rice</code>（米）に最も近い単語は <code>condoleezza</code> で、元米国務長官のコンドリーザ・ライスにちなみます。<code>mouse</code>（ネズミ、マウス）はアニメやコンピューターのほうに引っ張られています。
        埋め込みが映し出すのは、単語が学習テキストの中でどう<em>使われている</em>かであって、辞書に何と書いてあるかではありません。
      </p>

      <h2>単語の意味は、その仲間を見ればわかる</h2>
      <p>
        なぜ「似た使われ方をする」が「意味が似ている」につながるのでしょうか？ これが<strong>分布仮説</strong>で、言語学者の J.R. Firth が 1957 年に
        「You shall know a word by the company it keeps.」（単語はその仲間によって知られる）という言葉でまとめています。「I poured some ___ into my cup.」（カップに ___ を注いだ）という空欄を考えてみましょう。<code>coffee</code>、<code>tea</code>、<code>milk</code> はどれも当てはまりますが、
        <code>bicycle</code>（自転車）は当てはまりません。何百万もの文で同じ空欄に当てはまる単語は、おそらく関係があります。そしてそれは、コンピューターが何も理解せずに測れることなのです。
      </p>

      <h2>数値はどう学習されるのか</h2>
      <p>
        2010 年代の有名な 2 つの手法が、この考え方をはっきり示しています。どちらも大量のテキストを読み、単語ごとに 1 つのベクトルを作ります。
      </p>
      <ul>
        <li>
          <strong>word2vec</strong>（Google の Mikolov ら、2013 年）は当てっこゲームをします。文から 1 つの単語を取り出し、その周りの単語を予測しようとします
          （またはその逆）。予測を外すたびに、関係するベクトルが少しずつ動かされます。何十億回も動かした後には、同じ近傍の単語を予測する単語同士が、似たベクトルへと押し寄せられています。
        </li>
        <li>
          <strong>GloVe</strong>（スタンフォード大学の Pennington、Socher、Manning、2014 年）は、まずコーパス全体で、あらゆる単語のペアが互いの近くに何回現れるかを数えます。
          そして、2 つの単語のベクトルを比べるとそれらが一緒に現れる頻度を予測できるように、ベクトルを当てはめます。
        </li>
      </ul>
      <p>
        作り方は違っても、結果は同じです。単語ごとに 1 行の数値が並んだ表です。これらは<strong>静的埋め込み</strong>と呼ばれます。どの文に現れても、各単語にはちょうど 1 つのベクトルしか与えられないからです。
      </p>

      <h2>1 つの単語、たくさんの意味：文脈埋め込み</h2>
      <p>
        静的なベクトルには明らかな弱点があります。<code>bank</code> は川の岸のことも、お金を預かる場所（銀行）のこともありますが、ベクトルは 1 つしかありません。
        この GloVe のデータでは、最近傍は <code>banks</code>、<code>banking</code>、<code>central</code>、<code>credit</code>、<code>financial</code> です。川の意味はほとんどかき消されています。
      </p>
      <BankContexts />
      <p>
        現代の言語モデルも、最初のステップとしてこの表引きを残しています。上とまったく同じように、各トークン ID が学習済みのベクトルに置き換えられます。
        しかしその後、ベクトルは何層もの<strong>アテンション</strong>を通り、そこで各トークンのベクトルが周りのトークンを使って更新されます
        （<ArticleLink slug="attention-and-transformers">アテンションと Transformer</ArticleLink>を参照）。後のほうの層では、川についての文の「bank」は、貯金についての文の「bank」とは別のベクトルになっています。
        これが<strong>文脈埋め込み</strong>です。ベクトルが単語だけでなく、文全体によって決まります。
      </p>
      <Callout title="同じ単語、違うベクトル">
        現代のモデルで「ある単語の埋め込み」と言われたら、どちらのことかを確かめましょう。入力の表にある固定のベクトルか、モデルの内部にある文脈によって変わるベクトルか。この 2 つは同じものではありません。
      </Callout>

      <h2>近さを測る：コサイン類似度</h2>
      <p>
        2 つの単語が「近い」と言うには、それを測る方法が必要です。最もよく使われるのが<strong>コサイン類似度</strong>です。各ベクトルを原点から伸びる矢印として思い浮かべてください。
        コサイン類似度は 2 本の矢印の間の角度のコサインで、同じ向きなら 1、直角なら 0、正反対の向きなら −1 になります。
      </p>
      <CosineFan />
      <p>
        実際には、2 つのリストを位置ごとに掛け合わせて足し合わせ（これを<strong>内積</strong>と呼びます）、両方の矢印の長さで割って計算します。
        長さで割るので、意味を持つのは向きだけになります。ベクトルの長さは、単語の意味よりも、その単語がどれだけよく現れるかといったことを反映する場合があるので、これは便利です。
        GloVe のデータでは、<code>cat</code> と <code>dog</code> は 0.72、<code>king</code> と <code>queen</code> は 0.70 ですが、1 文字しか違わない <code>cat</code> と <code>car</code> はわずか 0.28 です。
        埋め込みは綴りについては何も知らず、知っているのは使われ方だけです。
      </p>
      <p>
        直線距離（<strong>ユークリッド距離</strong>）でも測れます。すべてのベクトルを長さ 1 にそろえると、近傍の順位はコサイン類似度とまったく同じになります。
      </p>

      <h2>なぜこれが重要なのか</h2>
      <p>
        意味が位置になると、多くの作業が幾何学の問題になります。検索エンジンは、埋め込みがクエリの埋め込みに近い文書を見つけます。レコメンドシステムは、あなたが気に入ったものの近くにあるアイテムを提案します。
        あなたのファイルの中を調べるチャットボット（よく検索拡張生成と呼ばれます）は、テキストの各チャンクを埋め込み、質問に最も近いチャンクを取ってきます。
        そしてどの言語モデルの中でも、テキストが最初にネットワークに入るときの形が埋め込みです（<ArticleLink slug="how-llms-work">言語モデルはあなたの言葉をどう答えに変えるのか</ArticleLink>を参照）。
      </p>
      <p>
        これらのベクトルがある空間には、「近い」「遠い」以上の構造があります。方向も意味を持ちうるのです。それが{" "}
        <ArticleLink slug="latent-space">潜在空間</ArticleLink>のテーマです。自分をだまさずに 300 次元を平らな画面に描く方法は、{" "}
        <ArticleLink slug="dimensionality-reduction">高次元を見る</ArticleLink>で扱っています。本物の単語ベクトル 10,000 個を 3D で探索するには<Link href="/embedding">埋め込みエクスプローラー</Link>を開いてください。
        このサイトに沿った解説は<ArticleLink slug="how-a-word-becomes-300-numbers">単語が 300 個の数値になるまで</ArticleLink>にあります。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://jalammar.github.io/illustrated-word2vec/", title: "The Illustrated Word2vec", source: "Jay Alammar", note: "word2vec の学習の仕組みを図でたどる解説（英語）" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "単語埋め込みについての美しいセクションがあります" },
  { href: "https://arxiv.org/abs/1301.3781", title: "Efficient Estimation of Word Representations in Vector Space", source: "Mikolov et al., 2013", note: "word2vec の元の論文" },
  { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "論文とダウンロードのあるプロジェクトページ" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "機械学習でいう埋め込み（エンベディング）とは何ですか？", a: "埋め込みとは、単語、文、画像などを表す数値のリスト、つまりベクトルです。意味や使われ方の似たものが近くに集まるように数値が学習されているので、コンピューターは簡単な計算で類似度を測れます。" },
  { q: "トークンと埋め込みの違いは何ですか？", a: "トークンは ID 番号の付いたテキストの断片で、ID そのものには意味がありません。埋め込みは、モデルがその ID に対して引くベクトルです。何百、何千もの学習された数値で、似たトークンが近くに並ぶ空間の中にそのトークンを位置づけます。" },
  { q: "コサイン類似度とは何ですか？", a: "コサイン類似度は 2 つのベクトルの間の角度を測るものです。同じ向きなら 1、直角なら 0、正反対の向きなら −1 になります。ベクトルの長さを無視して向きだけを見るので、埋め込みを比べる最も一般的な方法になっています。" },
  { q: "埋め込みは何に使われていますか？", a: "埋め込みは、意味検索、レコメンド、クラスタリング、重複の検出、そして検索拡張生成（RAG）を支えています。RAG では文書をベクトルとして保存し、質問に最も近いものを言語モデルに渡します。どの言語モデルの中でも、最初のステップは各トークンを埋め込みに変えることです。" },
];
