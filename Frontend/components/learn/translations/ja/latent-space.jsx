import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { WalkBetween } from "./latent-space.figures";
import s from "@/components/learn/articles/latent-space.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE] = CLUSTER_COLORS;

// All numbers below were computed offline from the site's GloVe file (10,000 words x 300 numbers, vectors scaled to length 1).

// The "gender direction": average of (woman - man), (girl - boy), (queen - king), (mother - father),
// (sister - brother), (aunt - uncle), (actress - actor), scaled to length 1. Its 300 components:
const GDIR = [0.01,-0.02,0.06,0.04,-0.13,-0.02,0.05,0.03,0.01,-0.02,-0.01,0.05,0.03,-0.06,-0.04,-0.07,-0.06,0.08,0.09,-0.13,0.02,-0.01,0.06,0.03,-0.05,0.02,0.03,0.1,0.03,-0.01,0.06,-0.16,0.02,0.08,-0.03,0.02,0.05,0.06,0.01,0.03,-0.02,0.15,0.06,0.03,0.02,0.03,0.1,-0.02,0.05,0.05,-0.04,0.01,-0.04,0,0.02,0.1,-0.04,0.2,0.04,0.02,-0.08,-0.12,0.01,0.02,0,0.02,0.09,0.07,0.1,0.01,-0.05,-0.03,-0.07,0,0.03,0.01,-0.06,0.03,-0.06,0.02,-0.01,0.02,0.02,0.02,-0.01,-0.02,0,-0.09,0.04,-0.07,0.03,-0.07,-0.03,0.03,-0.01,0.06,0.11,-0.08,0.09,0.04,-0.07,-0.14,0.06,0.04,0.03,0.08,-0.07,0.07,0.01,0,-0.05,0.08,0.04,0.11,-0.06,-0.11,-0.04,-0.08,0.01,0,0.02,0.02,-0.05,-0.01,0.03,-0.01,0.07,0.01,-0.02,-0.06,-0.06,-0.05,-0.02,0.07,-0.03,-0.07,0.03,-0.04,0.12,0.03,-0.04,-0.01,-0.03,-0.11,-0.04,-0.02,0.05,-0.12,0.07,-0.05,0.02,0.1,0.03,-0.01,0,0.01,0.07,-0.01,0.08,-0.01,0.01,-0.05,-0.1,-0.01,-0.02,0.11,0,0.12,-0.03,0,-0.03,-0.07,0,-0.12,-0.06,0.08,-0.01,-0.04,-0.03,0.06,0.02,0,0.02,-0.07,-0.1,0.04,-0.01,-0.11,-0.07,0.03,-0.14,-0.06,0.03,-0.11,-0.04,0.03,0,0.07,0.03,-0.04,-0.02,-0.06,-0.09,0,0.07,-0.06,-0.01,-0.12,0.08,-0.04,-0.03,0.02,-0.01,0.02,0.09,0.03,-0.04,0.03,0.04,0.04,0.07,-0.02,-0.07,0.03,-0.02,0.07,0.04,0.09,0.05,-0.01,0.03,0.08,-0.03,0.03,0.12,0.03,-0.04,0.11,0.04,-0.01,-0.04,-0.02,0.06,-0.08,0.03,-0.04,-0.02,-0.05,0.02,0.07,0.02,-0.05,-0.09,0.08,0.07,-0.05,-0.01,0.05,-0.04,-0.06,-0.04,0.02,-0.04,0.02,0.05,-0.05,0.05,-0.03,0.03,-0.02,-0.05,-0.02,0.03,-0.1,-0.01,-0.01,-0.07,-0.13,0.06,-0.09,0.07,-0.06,0.03,0,-0.03,-0.01,-0.05,0.06,0.02,0.01,0,0,0.12,0.02,-0.03,0.01,0.05,0,-0.01,0.04];

function DirectionStrip() {
  const W = 600, mid = 60;
  return (
    <Fig caption="本物のデータです。GloVe の「性別の方向」を構成する 300 個の数値（woman − man のような 7 つの差の平均）。突出した次元は 1 つもありません。最も大きい次元でも方向全体の約 4% しか担っておらず、半分を説明するには 300 次元のうち 36 次元が必要です。">
      <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="300 個の小さな正負の値を並べた棒グラフ。突出した棒はありません。">
        <line x1="0" y1={mid} x2={W} y2={mid} className={s.axis} />
        {GDIR.map((v, i) => (
          <rect key={i} x={i * 2} width="1.5" y={v > 0 ? mid - v * 250 : mid} height={Math.abs(v) * 250} fill={v > 0 ? TEAL : RED} />
        ))}
        <text x="0" y="120" className={s.dimText}>1 次元目</text>
        <text x={W} y="120" textAnchor="end" className={s.dimText}>300 次元目</text>
      </svg>
    </Fig>
  );
}

// [a, b, a·x, a·y, b·x, b·y]: x = the gender direction, y = the main direction in which the pairs differ from each other.
const PROJ = [["man","woman",-0.272,-0.275,0.26,-0.263],["boy","girl",-0.182,-0.133,0.252,-0.184],["king","queen",-0.254,0.299,0.275,0.254],["father","mother",-0.278,0.226,0.239,0.194],["brother","sister",-0.405,0.316,0.308,0.345],["uncle","aunt",-0.371,0.41,0.285,0.426],["actor","actress",-0.25,-0.41,0.387,-0.339]];
const PAIR_COLORS = [SKY, TEAL, YELLOW, PURPLE, RED, INDIGO, "#26de81"];

function ParallelOffsets() {
  const px = (x) => 210 + x * 360, py = (y) => 150 - y * 300;
  return (
    <Fig caption="本物のデータを、選んだ 2 つの方向に射影したものです。横軸は「女性 − 男性」の平均の方向、縦軸はこれらのペア同士が互いに異なる主な方向です。横軸はまさにこれらのペアから作っているので、ある程度平行になるのは当然です。より強い証拠は 300 次元の中にあります。7 つの差ベクトル同士の平均コサイン類似度は 0.58 で、ランダムな単語ペアの差では 0.07 です。">
      <svg viewBox="0 0 420 300" className={l.big} role="img" aria-label="7 本の矢印。それぞれ左の男性を表す単語から右の対応する女性を表す単語へ伸び、どれもおおよそ同じ向きを指しています。">
        <defs>
          {PAIR_COLORS.map((col, i) => (
            <marker key={i} id={`ls-arrow-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" fill={col} />
            </marker>
          ))}
        </defs>
        {PROJ.map(([a, b, ax, ay, bx, by], i) => (
          <g key={a}>
            <line x1={px(ax)} y1={py(ay)} x2={px(bx)} y2={py(by)} stroke={PAIR_COLORS[i]} strokeWidth="2" markerEnd={`url(#ls-arrow-${i})`} />
            {a === "king"
              ? <text x={px(ax) + 2} y={py(ay) + 17} className={s.label}>{a}</text>
              : <text x={px(ax) - 8} y={py(ay) + (a === "brother" ? 0 : 5)} textAnchor="end" className={s.label}>{a}</text>}
            <text x={px(bx) + 8} y={py(by) + 5} className={s.label}>{b}</text>
          </g>
        ))}
      </svg>
    </Fig>
  );
}

// a − b + c, nearest words excluding the three inputs (standard practice), and the nearest word when inputs are NOT excluded.
const ANALOGIES = [
  ["king", "man", "woman", [["queen", 0.715], ["princess", 0.601], ["throne", 0.584]], "king"],
  ["paris", "france", "italy", [["rome", 0.783], ["milan", 0.68], ["italian", 0.666]], "rome"],
  ["bigger", "big", "small", [["smaller", 0.818], ["larger", 0.806], ["large", 0.652]], "smaller"],
  ["cats", "cat", "dog", [["dogs", 0.78], ["animals", 0.618], ["pet", 0.519]], "dogs"],
  ["brother", "man", "woman", [["daughter", 0.809], ["mother", 0.77], ["wife", 0.761]], "daughter"],
  ["walked", "walk", "swim", [["swimming", 0.525], ["raced", 0.423], ["ran", 0.423]], "swim"],
];

function AnalogyTable() {
  return (
    <Fig caption="GloVe での本物の結果です。「上位 3 件」は、類推のテストでふつう行うように、入力の 3 単語を除いています。最後の列は、入力を除かない場合に最も近い単語で、king − man + woman ではやはり king です。最後の 2 行は意図した答え（sister、swam）を外しています。sister は 6 位で、swam はこの 10,000 単語の語彙にありません。">
      <div className={l.scroll}>
        <table className={l.table}>
          <thead><tr><th>計算式</th><th>上位 3 件（コサイン）</th><th>入力を含む場合</th></tr></thead>
          <tbody>
            {ANALOGIES.map(([a, b, c, top, incl]) => (
              <tr key={a + c}>
                <td>{a} − {b} + {c}</td>
                <td>{top.map(([w, v]) => `${w} ${v.toFixed(2)}`).join(", ")}</td>
                <td>{incl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fig>
  );
}

const OCC = [["captain",-0.219],["engineer",-0.203],["pilot",-0.169],["soldier",-0.148],["lawyer",-0.139],["scientist",-0.117],["doctor",-0.058],["artist",-0.023],["teacher",0.029],["singer",0.092],["dancer",0.142],["nurse",0.253]];
const REF = [["he", -0.231], ["she", 0.213]];

function OccupationBias() {
  const row = ([w, v], ref) => (
    <div key={w} className={s.occRow} style={{ "--tc": v < 0 ? SKY : PURPLE, "--w": Math.abs(v) / 0.26 }}>
      <span className={ref ? s.ref : undefined}>{w}</span>
      <span>{v < 0 && <i className={s.neg} style={{ display: "block" }} />}</span>
      <span className={s.occMid}>{v > 0 && <i className={s.pos} style={{ display: "block" }} />}</span>
      <small>{v > 0 ? "+" : ""}{v.toFixed(2)}</small>
    </div>
  );
  return (
    <Fig caption="本物のデータです。職業を表す単語が性別の方向のどこに位置するか（その方向とのコサイン）。単語そのものは中立なのに、ベクトルはどちらかに傾いており、学習テキストでの使われ方を映しています。he（彼）と she（彼女）は目安として示しています。">
      <div className={s.occ} role="img" aria-label="左右に伸びる棒グラフ。captain、engineer、pilot は男性側に、nurse、dancer、singer は女性側に傾き、teacher と artist はほぼゼロです。">
        <div className={s.occHead}><span /><span>← 「he」寄り</span><span>「she」寄り →</span><span /></div>
        {row(REF[0], true)}
        {OCC.map((o) => row(o))}
        {row(REF[1], true)}
      </div>
    </Fig>
  );
}

export default function LatentSpace() {
  return (
    <>
      <p>
        <ArticleLink slug="what-are-embeddings">埋め込みとは何か？</ArticleLink>では、各単語を 300 個の数値のリストに変え、似た単語が近くに集まることを見ました。
        そのベクトルがある空間には名前があります。<strong>潜在空間</strong>です。「潜在」とは隠れているという意味です。その座標は誰かが設計したものではなく、学習されたものなので、
        意味は後から見つけ出すしかありません。この記事では、その隠れた構造がどんな姿をしているか、そこから何が読み取れるか、そしてどこで誤解を招くかを見ていきます。
      </p>

      <h2>「潜在空間」とは何か</h2>
      <p>
        入力を数値のベクトルに変えるモデルはどれも、潜在空間を定めます。そのモデルが出しうるすべてのベクトルの集まりです。
        単語埋め込みが古典的な例ですが、画像生成モデル、音声モデル、大規模言語モデルの内部のベクトルにも同じ言葉が使われます。
        重要な性質は、位置が入力について何かを表していることです。モデルが似ていると扱う 2 つの入力は、互いの近くに来ます。
      </p>
      <p>
        以下ではすべて本物の単語ベクトル（GloVe、300 次元、よく使われる英単語 10,000 語）を使います。細かい点は違っても、考え方は他の潜在空間にも当てはまります。
      </p>

      <h2>軸には名前がない</h2>
      <p>
        まず思いつくのは、300 個の数値がそれぞれ 1 つのことを測っているという考えです。12 次元目は「動物かどうか」、40 次元目は「王族かどうか」といった具合です。実際には、個々の次元がそこまですっきりしていることはほとんどありません。
      </p>
      <p>
        理由は単純です。学習が気にするのは、ベクトル同士の関係、つまり距離と角度だけです。空間全体を回転させても、距離も角度もすべて変わらず、
        モデルはまったく同じようにうまく働きます。だから、ある概念を特定の 1 本の軸にそろえようとする力は何も働きません。意味は、多くの次元に同時に広がることになります。
      </p>
      <DirectionStrip />
      <p>
        埋め込みを数値 1 つずつ読んでもほとんど何もわからないのはそのためです。意味は<strong>方向</strong>にあり、方向とは 300 個の数値すべての特定の組み合わせです。
      </p>

      <h2>方向は意味を持ちうる</h2>
      <p>
        <code>man</code>（男性）から <code>woman</code>（女性）への矢印、つまり 2 つのベクトルの差を考えてみましょう。次に <code>king</code>（王）から <code>queen</code>（女王）への矢印を考えます。
        空間が性別について一貫した何かを学んでいるなら、2 本の矢印はおおよそ同じ向きを指すはずです。実際にそうなっていて、boy→girl、uncle→aunt、actor→actress の矢印も同様です。
      </p>
      <ParallelOffsets />
      <p>
        この文の「おおよそ」には大事な意味があります。コサイン 0.58 は、矢印が共通の方向を持ちつつ、それぞれに独自のくせもあるということです。他の関係はもっと弱いものもあります。
        単数から複数への矢印（cat→cats、city→cities、child→children など）は互いにずっと一致しておらず、このデータでは平均コサインがわずか 0.23 です。
      </p>

      <h2>平行な矢印としての類推</h2>
      <p>
        ある矢印が「女性にする」を意味するなら、それを他の単語に足すことができます。これが有名な類推（アナロジー）の技です。<code>king − man + woman</code> は <code>queen</code> の近くに着地します。
        同じ計算で、首都（<code>paris − france + italy ≈ rome</code>）や比較級（<code>bigger − big + small ≈ smaller</code>）も見つかります。
      </p>
      <AnalogyTable />
      <p>
        正直に言っておくべき注意点が 2 つあります。1 つ目に、結果のベクトルはたいてい出発点の単語のどれかにまだ最も近いので、類推のテストは入力の単語をこっそり除外しています。
        2 つ目に、うまくいく類推だけを見せて、うまくいかないものを忘れるのは簡単です。この技は構造がある確かなしるしですが、信頼できる推論エンジンではありません。
        サイトガイドの<ArticleLink slug="king-man-woman">king − man + woman を解説</ArticleLink>では、自分で試せます。
      </p>

      <h2>近傍とクラスター</h2>
      <p>
        潜在空間で最も単純な構造は近傍です。色は色の近くに、数は数の近くに、首都はその国の近くにあります。
        k-means のようなアルゴリズムは、点が密集したかたまりを探すことで、こうしたグループを自動的に見つけられます。埋め込みを使って文書やカスタマーレビューを話題ごとにまとめるのは、この方法です。
      </p>
      <p>
        クラスターにはラベルがなく、境目もあいまいです。いくつもの意味を持つ単語はグループの間にあります。<code>apple</code> は果物とテクノロジー企業の間にあります。
        クラスターを何と呼ぶかはあなたの解釈であって、ベクトルの中に保存されているものではありません。
      </p>

      <h2>2 点の間を歩く</h2>
      <p>
        位置に意味があるなら、2 つの単語の<em>間</em>の空間はどうでしょうか？ 2 つのベクトルを混ぜ合わせ、たとえば <code>village</code>（村）を 70%、<code>city</code>（都市）を 30% にして、その混ぜたものに最も近い実在の単語を調べられます。
      </p>
      <Fig caption="本物の GloVe のデータです。各ステップで 2 つの単語ベクトルを混ぜ、10,000 単語の語彙の中で最も近い単語を挙げています。左：両端の単語との類似度。右：両端以外で最も近い単語で、1 位を太字にしています。スライダーか矢印キーで操作してください。">
        <WalkBetween />
      </Fig>
      <p>
        2 つのことがわかります。まず正直な事実から。どのステップでも、両端の単語のどちらかが依然として最も近い実在の単語です。真ん中に「半分村、半分都市」という隠れた単語が待っているわけではありません。
        でも、<em>2 位以下</em>の単語は筋の通った形で変わります。village と city の間では <code>town</code>（町）を通り、hot と cold の間では <code>cool</code> と <code>warm</code> を通り、
        king から queen へは <code>monarch</code>（君主）を通ります。空間は十分になめらかで、2 つの意味の間にある点は、両方を併せ持つ単語の近くにあるのです。
      </p>
      <p>
        画像生成モデルでは、このなめらかさが活用されています。多くの生成モデルには、2 枚の画像の間の点をデコードすると、もっともらしい中間の画像になる潜在空間があります。なめらかな「モーフィング」のアニメーションはこうして作られます。
      </p>

      <h2>単語だけではない</h2>
      <p>
        潜在空間は、モデルがデータをベクトルに変えるところならどこにでもあります。<strong>文埋め込み</strong>モデルは文全体をそれぞれ 1 つのベクトルに写すので、「How do I reset my password?」（パスワードをリセットするには？）は、
        共通の単語が 1 つもなくても「I forgot my login」（ログイン情報を忘れた）の近くに来ることがあります。画像モデルは画像をベクトルに写します。OpenAI の CLIP のように、写真とそれを説明するキャプションが
        1 つの共有空間で互いの近くに来るように学習したモデルもあり、これによってテキストで写真を検索できるようになります。画像や音声をまず断片に切り分ける方法は<ArticleLink slug="tokens-beyond-text">テキスト以外のトークン</ArticleLink>をご覧ください。
      </p>
      <p>
        大規模言語モデルの内部には、潜在空間が 1 つではなくたくさんあります。どの層も、すべてのトークンについて新しいベクトルを作るからです
        （<ArticleLink slug="attention-and-transformers">アテンションと Transformer</ArticleLink>を参照）。研究者はそこにも意味のある方向を見つけていますが、それを読み解くことは解決済みの問題ではなく、活発な研究分野です。
      </p>

      <h2>限界とバイアス</h2>
      <p>
        潜在空間は学習データを圧縮した記録であり、私たちが望まない部分も含んでいます。<code>nurse</code>（看護師）や <code>engineer</code>（エンジニア）のような単語は、定義には性別を含みませんが、
        性別と結びついた文脈によく現れたので、ベクトルがどちらかに傾いています。
      </p>
      <OccupationBias />
      <p>
        これは 2016 年の論文で丁寧に記録されており、その題名は実際の類推の結果を引用しています。「Man is to Computer Programmer as Woman is to Homemaker?」（男性にとってのプログラマーは、女性にとっての主婦？）。
        このデータでは、<code>doctor − man + woman</code> の 1 位は <code>physician</code>（医師）、2 位は <code>nurse</code> です。検索から採用ツールまで、埋め込みの上に作られたシステムはどれも、
        こうしたパターンを受け継ぐ可能性があります。それを減らす手法はありますが、完全に取り除けるものはありません。
      </p>
      <Callout title="覚えておきたいこと">
        潜在空間が示すのは、ある特定のテキストの山の中で単語がどう使われていたかです。それはそのテキストを映す鏡であって、真実の地図ではありません。
      </Callout>
      <p>
        もう 1 つの限界は私たちの側にあります。私たちはこれらの空間を平らな図を通してしか見られず、300 次元を 2 次元に押し縮めると必ず何かがゆがみます。
        <ArticleLink slug="dimensionality-reduction">高次元を見る</ArticleLink>では、そうした図の作り方と、だまされずに読む方法を説明しています。
        GloVe を自分で探索するには、<Link href="/embedding">埋め込みエクスプローラー</Link>を試すか、<Link href="/vector-playground">ベクトル・プレイグラウンド</Link>で単語の計算をしてみてください。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "埋め込みのセクションで、woman − man のような方向を視覚的に見せています" },
  { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "「linear substructures」（線形の部分構造）のセクションを参照" },
  { href: "https://arxiv.org/abs/1607.06520", title: "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", source: "Bolukbasi et al., 2016" },
  { href: "https://arxiv.org/abs/2103.00020", title: "Learning Transferable Visual Models From Natural Language Supervision", source: "Radford et al., 2021", note: "CLIP の論文：画像とテキストを 1 つの空間に" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "AI の潜在空間とは何ですか？", a: "潜在空間とは、モデルが入力を内部で表すのに使うベクトルの空間です。各点は埋め込みで、その位置は人が付けたラベルではなく、モデルが学習したパターンを反映しています。似た入力は互いの近くに来て、空間を通るいくつかの方向は、複数形、時制、性別といった概念と対応しています。" },
  { q: "埋め込みの次元にはそれぞれ意味があるのですか？", a: "1 つずつには、たいていありません。1 つの次元が 1 つのはっきりした概念に対応することはまれで、意味は多くの次元に同時に広がる傾向があります。解釈できるパターンは、名前の付いた 1 本の軸としてではなく、次元の組み合わせである方向として現れるのがふつうです。" },
  { q: "king − man + woman ≈ queen になるのはなぜですか？", a: "多くの単語埋め込みでは、man と woman の差が、king と queen の差とおおよそ同じ向きを指しています。man を引いて woman を足すと、king のベクトルがその方向に動き、結果に最も近い単語が queen になることがよくあります。うまくいく関係もありますが、すべての関係で確実にうまくいくわけではありません。" },
  { q: "埋め込みに偏りはありますか？", a: "あります。埋め込みは人が書いたテキストから学ぶので、その中にある結びつきを、ステレオタイプも含めて吸収します。たとえば、ある単語埋め込みが特定の職業をどちらかの性別とより強く結びつけていることが研究で示されています。このバイアス（偏り）を測り、減らすことは活発な研究分野です。" },
];
