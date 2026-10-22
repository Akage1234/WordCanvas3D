import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import { Link } from "@/i18n/navigation";
import s from "@/components/learn/learn.module.css";

const [RED, TEAL] = CLUSTER_COLORS;

const KING = {
  king: [-0.07, -0.37, -0.21, -0.88, 0.06, -0.26, 0.34, -0.23],
  queen: [-0.08, -0.3, -0.18, -0.81, -0.66, 0.07, 0.21, -0.34],
  man: [-0.02, -0.02, -0.4, 0.27, 0.18, 0.28, -0.27, 0.1],
  apple: [-0.17, 0.13, 0.34, -0.71, -0.21, -0.77, -0.44, 0.26],
};
const SIMS = [["cat", "dog", 0.722], ["king", "queen", 0.696], ["king", "man", 0.468], ["cat", "car", 0.282], ["king", "apple", 0.269]];

export default function WordToNumbers() {
  return (
    <>
      <p>
        トークナイザーはテキストを ID に変えますが、ID はリスト内の位置にすぎません。9059 という数のどこにも「cat」（猫）を表すものはありません。
        意味を扱うには、似た単語が似て見えるような表現が必要です。その表現が<strong>埋め込み</strong>で、単語やトークンごとに、ふつう数百個の数値が並んだリストです。
        このようなリストは<strong>ベクトル</strong>とも呼ばれ、その中の各位置を<strong>次元</strong>と呼びます。
      </p>
      <p>
        このガイドは、このサイトの埋め込みのページに表示されるものに絞っています。考え方そのものをゼロから組み立てる解説は<ArticleLink slug="what-are-embeddings">埋め込みとは何か？</ArticleLink>をお読みください。
      </p>
      <p>
        このサイトの埋め込みのページでは、単語埋め込みの古典的な 3 つのセット、<strong>GloVe</strong>、<strong>Word2Vec</strong>、<strong>FastText</strong> を表示しています。
        3 つとも、どの単語もちょうど 300 個の数値のリストです。
      </p>

      <h2>300 個の数値はどんな姿か</h2>
      <p>このサイトが使っている GloVe のデータから、4 つの単語について 300 個の数値のうち最初の 8 個を取り出しました。</p>
      <Fig caption="300 個の GloVe の値のうち最初の 8 個（四捨五入）。ティールが正、赤が負で、色が濃いほど値が大きいことを表します。">
        <div className={s.cells}>
          {Object.entries(KING).map(([word, values]) => (
            <div key={word} style={{ display: "contents" }}>
              <span>{word}</span>
              {values.map((v, i) => (
                <span key={i} className={s.cell} style={{ background: `color-mix(in srgb, ${v < 0 ? RED : TEAL} ${Math.round(Math.abs(v) * 90)}%, #1a1d24)` }}>
                  {v.toFixed(2)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Fig>
      <p>
        「王族」や「果物」を意味する数値が 1 つあるわけではありません。意味は 300 個すべてに同時に広がっています。それでも、このほんの一部からでもパターンがうかがえます。
        <code>king</code>（王）と <code>queen</code>（女王）はいくつかの位置で似た形をしていますが、<code>man</code>（男性）と <code>apple</code>（りんご）はそれぞれ別の動きをしています。
        次元が何を捉え、何を捉えないかは<ArticleLink slug="latent-space">潜在空間</ArticleLink>のテーマです。
      </p>

      <h2>数値はどこから来るのか</h2>
      <p>
        3 つのモデルはどれも同じ考え方に基づいています。言語学者の J.R. Firth の言葉によく要約される考え方です。
        「You shall know a word by the company it keeps.」（単語はその仲間によって知られる）。似た文脈に現れる単語は、似た意味を持つ傾向があります。
        モデルは膨大なテキストを読み、似た近傍を持つ単語が似たリストになるまで、各単語の数値を調整します。
      </p>
      <ul>
        <li>
          <strong>Word2Vec</strong>（Google、2013 年）は、単純な当てっこゲームで小さなニューラルネットワークを学習させます。ある単語の周りの単語を予測する、あるいは周りの単語からその単語を予測するゲームです。
          学習後、各単語に対するネットワークの内部の重みが、その単語の埋め込みになります。
        </li>
        <li>
          <strong>GloVe</strong>（スタンフォード大学、2014 年）は、まずコーパス全体で、各単語のペアが互いの近くに何回現れるかを数えます。
          そして、2 つの単語のベクトルの関係が、それらが一緒に現れる頻度を反映するように、ベクトルを当てはめます。
        </li>
        <li>
          <strong>FastText</strong>（Facebook、2016〜17 年）は Word2Vec を拡張し、単語の中の文字のかたまりについてもベクトルを学習します。そのため <code>walk</code>、<code>walking</code>、<code>walked</code> は部品を共有します。
          これは珍しい単語や綴りの揺れに役立ちます。
        </li>
      </ul>
      <p>
        データにも細かな違いがあります。ここでの GloVe のベクトルはすべて小文字です。Word2Vec と FastText は大文字を残しているので、<code>Paris</code> と <code>paris</code> が別の項目になることがあり、
        Word2Vec のセットには <code>prime_minister</code>（首相）のようにつなげたフレーズまで入っています。
      </p>

      <h2>類似度を測る</h2>
      <p>
        各単語が 300 次元の空間の 1 点なら、「意味が似ている」は「似た方向を指している」ということになります。
        ふつう使われる尺度は<strong>コサイン類似度</strong>で、1 は 2 つのベクトルが同じ向きを指していること、0 は無関係（直角）であることを意味します。
      </p>
      <Fig caption="単語のペアのコサイン類似度で、このサイトの GloVe のベクトルから計算したものです。">
        <table className={s.table}>
          <thead><tr><th>ペア</th><th>類似度</th></tr></thead>
          <tbody>
            {SIMS.map(([a, b, v]) => <tr key={a + b}><td>{a} · {b}</td><td>{v.toFixed(2)}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        数値は直感と一致します。<code>cat</code> と <code>car</code>（車）は 1 文字しか違わないのに、<code>cat</code> は <code>car</code> よりも <code>dog</code>（犬）にずっと近いのです。
        埋め込みは綴りについては何も知らず、知っているのは使われ方だけです。
      </p>

      <h2>埋め込みが間違えること</h2>
      <p>
        意外な結果が生まれるのも、使われ方のせいです。この GloVe のデータでは、<code>apple</code> の最近傍は <code>microsoft</code>、<code>google</code>、<code>intel</code> です。
        学習テキストは果物よりも企業のことをはるかに多く語っていたのです。
      </p>
      <p>
        反対の意味の単語が近いこともあります。<code>good</code>（良い）と <code>bad</code>（悪い）の類似度は約 0.72 です。「the food was good」（料理はおいしかった）と「the food was bad」（料理はまずかった）のように、ほとんど同じ文に現れるからです。
      </p>
      <p>
        これらのモデルは<strong>静的</strong>でもあります。どんな文でも、各単語にはちょうど 1 つのベクトルしか与えられません。川の <code>bank</code>（岸）と、お金を預ける <code>bank</code>（銀行）は、1 つの点を共有しています。
        現代の言語モデルは、各トークンのベクトルを周りの単語に応じて層ごとに調整することで、これを解決しています
        （その仕組みは<ArticleLink slug="attention-and-transformers">アテンションと Transformer</ArticleLink>で紹介しています）。それでも最初のステップはここと同じで、
        各トークン ID のベクトルを大きな表から引くことです。
      </p>

      <h2>なぜ 300 なのか</h2>
      <p>
        リストの長さは、学習の前に決める設計上の選択です。数値が多いほど、モデルは細かな違いを記録する余地を得ますが、
        より多くの学習データ、メモリ、計算が必要になります。このような古典的な単語埋め込みでは、300 がよく使われるサイズになりました。
        ここで各モデルに付いている 10,000 単語全体では、モデルあたり 300 万個の数値になります。
      </p>
      <p>
        大規模言語モデルも同じ考え方をもっと大きな規模で使っており、トークンのベクトルは数千個の数値になることがよくあります。
      </p>

      <h2>空間を見る</h2>
      <p>
        300 次元を思い描ける人はいません。埋め込みのページでは、モデルから 1,000、5,000、10,000 単語を取り出し、そのベクトルを 3D に押し縮めて、その中を飛び回れるようにしています。
        その押し縮め方と、それが隠してしまうものは、<Link href="/learn/pca-vs-umap">PCA と UMAP</Link>で扱っています。
      </p>
    </>
  );
}

export const faq = [
  { q: "GloVe、Word2Vec、FastText の違いは何ですか？", a: "Word2Vec は、周りの単語からある単語を、あるいはある単語から周りの単語を予測することでベクトルを学習します。GloVe は、単語が一緒に現れる頻度をまとめた全体の表から学習します。FastText は Word2Vec と同じように働きますが、単語の断片も使うので、学習中に見なかった単語のベクトルも作れます。" },
  { q: "単語埋め込みはなぜ 300 次元なのですか？", a: "300 という数に特別な意味はありません。品質と、メモリや学習時間とのバランスが取れていたので、元の Word2Vec や GloVe の公開版でよく使われた設定です。次元が少ないと細かなニュアンスを捉えきれず、ずっと多くしても単語単位のベクトルでは効果が頭打ちになります。" },
  { q: "静的な単語埋め込みにできないことは何ですか？", a: "各単語にちょうど 1 つのベクトルしか与えないので、「bank」のように複数の意味を持つ単語は、ぼやけた平均の 1 つになります。FastText を除けば語彙にない単語のベクトルはなく、学習テキストのバイアスも反映します。現代の言語モデルは、文に応じて変わる文脈埋め込みを使っています。" },
  { q: "2 つの単語の類似度はどうやって測るのですか？", a: "ふつうはコサイン類似度を使い、2 つのベクトルの向きを比べます。1 に近い値は、単語がとてもよく似た文脈に現れることを意味します。似た文脈は似た意味であることが多いのですが、「hot」（熱い）と「cold」（冷たい）のような反対語も同じ場所で使われるので、高いスコアになることがあります。" },
];
