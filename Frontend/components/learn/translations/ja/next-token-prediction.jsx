import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig, ArticleLink, Callout } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/next-token-prediction.module.css";
import { SamplingPlayground } from "./next-token-prediction.figures";

const [RED, TEAL, , YELLOW, , PURPLE] = CLUSTER_COLORS;

// Decorative shapes for the pipeline figure (not real values).
const VECTOR = [0.6, -0.4, 0.9, -0.2, 0.3, -0.8, 0.5, 0.1, -0.6, 0.7, -0.3, 0.4];
const LOGITS = [0.3, 0.55, 0.2, 0.95, 0.4, 0.15, 0.6, 0.25, 0.45, 0.1, 0.35, 0.2];
const PROBS = [0.04, 0.1, 0.03, 0.75, 0.06, 0.02, 0.14, 0.03, 0.07, 0.02, 0.05, 0.03];

function Strip({ values, color }) {
  return (
    <span className={s.strip} aria-hidden="true">
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(Math.abs(v) * 100, 6)}%`, "--c": v < 0 ? RED : color }} />
      ))}
    </span>
  );
}

function Pipeline() {
  const stages = [
    ["最後のベクトル", "768 個の数値", <Strip key="v" values={VECTOR} color={TEAL} />],
    ["× アンエンベディング", "768 × 50,257 の行列", null],
    ["ロジット", "50,257 個のスコア", <Strip key="l" values={LOGITS} color={YELLOW} />],
    ["ソフトマックス", "50,257 個の確率", <Strip key="p" values={PROBS} color={PURPLE} />],
  ];
  return (
    <div className={s.pipe} role="img" aria-label="最後のトークンの 768 個の数値からなるベクトルに 768 × 50,257 のアンエンベディング行列を掛けると 50,257 個のロジットになり、ソフトマックスがそれを 50,257 個の確率に変えます。">
      {stages.map(([title, sub, viz], i) => (
        <span key={title} style={{ display: "contents" }}>
          {i > 0 && <span className={s.arrow} />}
          <span className={s.stage}>
            <strong>{title}</strong>
            {viz}
            <span>{sub}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

const TEMPS = [
  ["0.5", ["86.4%", "11.7%", "1.9%"]],
  ["1", ["65.9%", "24.2%", "9.9%"]],
  ["2", ["50.2%", "30.4%", "19.4%"]],
];

function Row({ label, words, next, stop }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {words.map((w, i) => (
        <span key={i} className={l.chip} style={{ "--tc": "#ffffff30" }}><b>{w}</b></span>
      ))}
      <span className={l.chip} style={{ "--tc": stop ? RED : PURPLE }}><b>{next}</b></span>
      {stop && <span className={s.stop}>停止</span>}
    </div>
  );
}

export default function NextTokenPrediction() {
  return (
    <>
      <p>
        言語モデルはテキストをトークンとして読み、各トークンをベクトルに変え、そのベクトルを Transformer ブロックの積み重ねに通します
        （その部分は<ArticleLink slug="attention-and-transformers">アテンションと Transformer</ArticleLink>で説明しています）。最後には、どのトークンも磨き上げられたベクトルを持っています。
        でも、モデルの仕事は何かを<em>書く</em>ことです。この記事では、最後のステップを追います。数値のリストから実際の次の単語へ、そしてその次、さらにその次へ。
      </p>

      <h2>1 つのベクトル、1 つの問い</h2>
      <p>
        次に何が来るかを予測するのに、モデルが必要とするのは<strong>最後の</strong>トークンの最終的なベクトルだけです。アテンションのおかげで、そのベクトルはそれより前のすべてから必要なものをすでに集めています。
        GPT-2 の最小版では、その長さは 768 個の数値です。
      </p>
      <p>
        モデルの語彙、つまりモデルが知っているトークンの決まったリスト（<ArticleLink slug="why-tokens">モデルが文字でも単語でもなくトークンを読む理由</ArticleLink>を参照）は、GPT-2 では 50,257 項目あります。
        ここでの仕事は、その全項目に「次に来るものとしてどれくらい合うか」のスコアを付けることです。
      </p>

      <h2>ベクトルからスコアへ：アンエンベディング</h2>
      <p>
        スコア付けは 1 回の掛け算です。モデルは<strong>アンエンベディング行列</strong>（出力層とも呼ばれます）という学習済みの大きな表を持っていて、語彙のトークンごとに 768 個の数値からなる列が 1 つあります。
        最後のベクトルにこの行列を掛けることは、各列との<strong>内積</strong>を取ること、つまり数値ごとに掛けて足し合わせることと同じです。
        ベクトルと似た向きを指す列は高いスコアを得ます。
      </p>
      <p>
        結果はトークンごとに 1 つ、全部で 50,257 個の数値です。この生のスコアを<strong>ロジット</strong>と呼びます。どんな大きさにもなり、負にもなりえます。意味があるのは差だけです。
        GPT-2 では、アンエンベディング行列は最初のステップの埋め込みの表と同じ表を再利用しています（重み共有と呼ばれる工夫です）。新しいモデルの多くは 2 つの表を別々に持っています。
      </p>
      <Fig caption="GPT-2 サイズのモデルの最後のステップです。棒の形は飾りですが、サイズ（768 と 50,257）は GPT-2 small のものです。アンエンベディング行列だけで 768 × 50,257 ≈ 3,860 万個の数値を持っています。">
        <Pipeline />
      </Fig>

      <h2>スコアから確率へ：ソフトマックス</h2>
      <p>
        ロジットはそのままでは使いにくいものです。欲しいのは各トークンの<strong>確率</strong>、つまり 0 から 1 の間の数で、すべてを合わせると 1 になるものです。
        これを行う関数が<strong>ソフトマックス</strong>です。各ロジットについて <code>e</code> のロジット乗を計算し（これですべての数が正になり、差が広がります）、合計で割ります。
      </p>
      <p>
        たとえば 2.0、1.0、0.1 というロジットは、約 65.9%、24.2%、9.9% の確率になります。最も大きいロジットが最も多くを得ますが、どれも分け前を持ち続けます。
        この確率のリストこそがモデルの本当の出力です。単語ではなく、次に言いうるすべての単語にわたる<strong>確率分布</strong>なのです。
      </p>

      <h2>単語を選ぶ：デコーディング</h2>
      <p>
        その分布を 1 つのトークンに変えることを<strong>デコーディング</strong>と呼び、いくつかのやり方があります。下で試してみてください。候補の単語とそのロジットは説明用に作ったもので、
        見やすくするために、語彙にこの 12 単語しかないことにしています。そこに適用している計算は本物です。
      </p>
      <Fig caption="「The cat sat on the」（猫が〜の上に座った）の次の単語の、説明用のロジットです。スライダーを動かすと確率が正確に計算し直されます。まず温度、次に top-k、次に top-p を適用し、残った単語の合計が 100% になるように調整します。除外された単語には取り消し線が引かれます。「単語をサンプリング」を押すと、表示中の確率に従ってランダムに 1 単語を引きます。">
        <SamplingPlayground />
      </Fig>
      <p>それぞれの操作が何をするかを見ていきましょう。</p>
      <ul>
        <li>
          <strong>貪欲法</strong>（グリーディ・デコーディング）は、常に最も可能性の高いトークンを 1 つ取ります。温度を 0 にすると確認できます。「mat」が 100% になり、何度引いても同じ結果です。
          貪欲法は予測しやすいのですが、長いテキストでは平凡で繰り返しの多い文章になりがちです。
        </li>
        <li>
          <strong>温度</strong>は、ソフトマックスの前にすべてのロジットを数 T で割ります。1 より小さいと差が広がり、本命がさらに多くの確率を取ります。
          1 より大きいと差が縮まり、可能性の低い単語にも本当のチャンスが生まれます。単語の<em>順位</em>は決して変わらず、確率がどれだけ鋭く集中するかだけが変わります。
        </li>
        <li>
          <strong>top-k</strong> は、可能性の高い上位 k 個のトークンだけを残し、残りを捨てます。大きな語彙の長いすそ野から、極端にありえないものをモデルが選ぶのを防ぎます。
          弱点は k が固定されていることです。意味の通る単語が 2 つしかないこともあれば、何百もあることもあります。
        </li>
        <li>
          <strong>top-p</strong> は<strong>ニュークリアスサンプリング</strong>とも呼ばれ、確率の合計が p 以上になる上位トークンの最小のグループを残します。モデルに自信があるときはそのグループはとても小さく、
          当てはまる単語が多いときは大きくなります。上で top-p を 0.50 にすると「mat」と「floor」だけが残ります。「mat」だけでは 41.3% で、半分にわずかに届かないからです。
        </li>
      </ul>
      <Fig caption="同じロジット（2.0、1.0、0.1）を 3 つの温度でソフトマックスにかけたものです。温度が低いと分布は鋭くなり、高いと平らになります。">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>温度</th><th>ロジット 2.0</th><th>ロジット 1.0</th><th>ロジット 0.1</th></tr></thead>
            <tbody>
              {TEMPS.map(([t, ps]) => <tr key={t}><td>T = {t}</td>{ps.map((p) => <td key={p}>{p}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>同じ質問に違う答えが返る理由</h2>
      <p>
        デコーディングが貪欲法でない限り、モデルはトークンごとに毎回ランダムに引いています。25% の単語は、およそ 4 回に 1 回選ばれます。
        いったん別の単語が選ばれると、その後はすべて異なるテキストから予測されるので、序盤の小さな違いがまったく異なる答えへと育っていきます。
        チャットボットに同じ質問を 2 回すると違う返事が返ることがあるのはそのためで、温度のような設定があるのもそのためです。多様さと予測しやすさを引き換えにできるのです。
      </p>
      <Callout title="よくある誤解">
        確率の低い単語が「間違った」単語だというわけではなく、確率の高い単語が確かめられた事実だというわけでもありません。確率が表しているのは、学習データから学んだ、次に来やすいテキストです。
        モデルはとても自信があっても、間違っていることがあります。
      </Callout>

      <h2>ループ：追加して繰り返す</h2>
      <p>
        モデルを 1 回通すと、トークンが 1 つできます。文を書くには、モデルは選んだトークンを入力の末尾に加えてもう一度実行し、その次のトークンを予測します。
        これを<strong>自己回帰</strong>型の生成と呼びます。各ステップに、自分自身の前の出力が入力されるのです。返事が画面に一語ずつ現れるのもこのためです。
      </p>
      <Fig caption="生成ループを実行した説明用の例です。各ステップでトークンを 1 つ加えてモデルをもう一度実行し、テキスト終了トークンを選ぶまで続けます。">
        <div className={s.loop}>
          <Row label="ステップ 1" words={["The", "cat", "sat", "on", "the"]} next="mat" />
          <Row label="ステップ 2" words={["The", "cat", "sat", "on", "the", "mat"]} next="." />
          <Row label="ステップ 3" words={["The", "cat", "sat", "on", "the", "mat", "."]} next="<|endoftext|>" stop />
        </div>
      </Fig>
      <p>生成が止まるのは、次の 2 つのどちらかのときです。</p>
      <ul>
        <li>
          <strong>系列終了トークン。</strong> 語彙には「このテキストはここで終わり」を意味する特殊トークンが入っています。GPT-2 では <code>&lt;|endoftext|&gt;</code>（ID 50256）です。
          モデルは学習の中で、テキストがこれで終わることを学んでいるので、他のトークンと同じように予測できます。これが引かれると生成は止まります。
        </li>
        <li>
          <strong>長さの上限。</strong> モデルを動かしているプログラムが、新しいトークンの最大数を決めています。先にそれに達すると、テキストは途中で、ときには文の途中で切れます。
        </li>
      </ul>
      <p>
        実際のシステムは、各ステップを一から始めずに済むよう前の計算を再利用したり、いくつかの続きの候補を同時に探したり（ビームサーチ）といった改良を加えています。
        それでも中心にあるのはまさにこれです。ベクトル、ロジット、ソフトマックス、1 つ選んで、追加して、繰り返す。
      </p>
      <p>
        モデルが実際に扱っているトークンを見てみたいですか？ このサイトの<Link href="/tokenizer">トークナイザー</Link>は、どんなテキストも GPT や LLaMA のトークンに ID 付きで分割します。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/blog/how-to-generate", title: "How to generate text: using different decoding methods", source: "Hugging Face blog", note: "貪欲法、ビームサーチ、top-k、top-p をコード付きで解説（英語）" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "動画。アンエンベディング、ソフトマックス、温度も扱っています" },
  { href: "https://arxiv.org/abs/1904.09751", title: "The Curious Case of Neural Text Degeneration", source: "Holtzman et al., 2019", note: "ニュークリアス（top-p）サンプリングを提案した論文" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "言語モデルのロジットとは何ですか？", a: "ロジットとは、モデルが次の位置について語彙のすべてのトークンに付ける生のスコアです。最後のベクトルにアンエンベディング行列を掛けて得られます。高いほど可能性が高いことを意味しますが、ソフトマックスによって合計 1 になる 0〜1 の数に変えられて、はじめて確率になります。" },
  { q: "LLM の温度（temperature）は何をするのですか？", a: "温度はソフトマックスの前にロジットの尺度を変えます。1 より小さいと分布が鋭くなって上位のトークンが支配的になり、答えが予測しやすくなります。1 より大きいと分布が平らになって可能性の低いトークンにもチャンスが増え、出力は多様になりますが間違いも起きやすくなります。温度 0 は、実質的に常に最上位のトークンを選ぶことを意味します。" },
  { q: "top-k サンプリングと top-p サンプリングの違いは何ですか？", a: "top-k は可能性の高い上位 k 個のトークンだけを残し、その中からサンプリングします。top-p はニュークリアスサンプリングとも呼ばれ、確率の合計が 0.9 などの p に達するトークンの最小の集合を残すので、モデルに自信がないときは選択肢が増え、自信があるときは減ります。" },
  { q: "言語モデルは答え全体を前もって計画しているのですか？", a: "はっきりとした形ではしていません。モデルは 1 トークンずつ出力し、新しいトークンはそれぞれ入力に加えられてから次のトークンが予測されます。内部の状態が文の向かう先についての情報を運ぶことはありますが、読み上げるだけの完成した下書きが別にあるわけではありません。" },
];
