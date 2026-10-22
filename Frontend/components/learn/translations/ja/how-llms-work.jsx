import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import h from "@/components/learn/articles/how-llms-work.module.css";
import { PipelineFigure } from "./how-llms-work.figures";

const [RED, TEAL] = CLUSTER_COLORS;

function Chips({ label, items }) {
  return (
    <div className={l.row}>
      {label && <span className={l.rowLabel}>{label}</span>}
      {items.map(([text, sub], i) => (
        <span key={i} className={l.chip} style={{ "--tc": CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
          <b>{text}</b>
          {sub !== undefined && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

// Illustrative numbers only: a fixed pseudo-random pattern per seed.
function vec(seed) {
  let x = seed % 233280;
  return Array.from({ length: 8 }, () => {
    x = (x * 9301 + 49297) % 233280;
    return (x / 233280) * 2 - 1;
  });
}

function Cells({ label, values, hit }) {
  return (
    <div className={`${h.trow} ${hit ? h.hit : ""}`}>
      <span>{label}</span>
      {values.map((v, i) => (
        <i key={i} style={{ background: `color-mix(in srgb, ${v >= 0 ? TEAL : RED} ${Math.round(Math.abs(v) * 80) + 12}%, transparent)` }} />
      ))}
    </div>
  );
}

const Gap = ({ children = "⋮" }) => <div className={h.gap}>{children}</div>;

const TABLE_ROWS = [[290, "·the"], [402, "·on"], [976, "The"], [9059, "·cat"], [10139, "·sat"]];

const PROBS = [["·mat", 0.38], ["·floor", 0.17], ["·bed", 0.08], ["·couch", 0.06], ["·rug", 0.04]];

export default function HowLlmsWork() {
  return (
    <>
      <p>
        <em>「The cat sat on the」</em>（猫が〜の上に座った）と入力すると、チャットボットが <em>「mat」</em>（マット）と続きを提案します。モデルが文を読み、考えて、答えたように感じられます。
        実際に起きているのは、テキストを数値に変え、その数値で計算をし、結果をテキストに戻す、という決まった単純なステップの連鎖です。
        この記事では、その連鎖を最初から最後まで一度たどります。数学の予備知識は必要ありません。
      </p>
      <p>
        <strong>言語モデル</strong>とは、テキストの続きを書くように学習させたプログラムです。<strong>大規模</strong>言語モデル（LLM）は同じ考え方を巨大な規模で行うもので、
        何十億もの調整可能な数値を持ち、人が書いてきたテキストのかなりの部分で学習しています。以下の内容は、ChatGPT、Claude、Gemini、Llama の背後にあるモデルすべてに当てはまります。
      </p>
      <Callout title="ひとことで言うと">
        言語モデルは、テキストをトークンに切り分け、各トークンを数値のリストに変え、そのリスト同士に多くの層を通して情報をやり取りさせ、
        次に来うるすべてのトークンにスコアを付けて 1 つを選び、テキストに追加し、これを繰り返します。
      </Callout>

      <h2>LLM の処理全体をざっくりと</h2>
      <figure className={h.wide}>
        <PipelineFigure />
        <figcaption>「The cat sat on the」→「 mat」の 1 回の処理と、「.」を加える 2 回目の処理です。トークン ID は本物です（GPT-4o が使う o200k_base トークナイザー）。ベクトル、アテンションの重み、層の数、スコア、確率は説明用の値で、実際のモデルから取ったものではありません。</figcaption>
      </figure>
      <p>この記事の残りでは、これらのステップを 1 つずつ見ていきます。</p>

      <h2>1. テキストがトークンになる</h2>
      <p>
        モデルは文字をそのまま扱えないので、最初のステップは<strong>トークナイザー</strong>です。これはテキストを<strong>トークン</strong>と呼ばれる断片に切り分ける、独立したプログラムです。
        トークンは、よく使われる単語まるごとであることが多く、ときには単語の一部、句読点、空白であることもあります。珍しい単語は、いくつかの小さな断片を組み合わせて表されます。
      </p>
      <Fig caption="同じ単語を o200k_base トークナイザーが 2 通りに切り分けた例です。テキストのいちばん最初に来るとこの形は珍しいので、3 つの断片で表されます。ふだんのように空白の後に来ると、1 トークンになるほどよく使われる形です。点（·）は空白を表します。">
        <Chips label="テキストの先頭の「unbelievable」（信じられない） · 3 トークン" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="空白の後の「 unbelievable」 · 1 トークン" items={[["·unbelievable"]]} />
      </Fig>
      <p>
        なぜ文字や単語まるごとではなく断片なのかは、それだけで 1 つの話になります。<ArticleLink slug="why-tokens">モデルが文字でも単語でもなくトークンを読む理由</ArticleLink>と、
        断片を選ぶアルゴリズムについては<ArticleLink slug="tokenization-algorithms">トークナイザーの作り方</ArticleLink>をご覧ください。
      </p>

      <h2>2. トークンが ID 番号になる</h2>
      <p>
        どのトークナイザーにも決まった<strong>語彙</strong>があります。知っている断片すべてに番号を振ったリストです。<code>o200k_base</code> の場合、このリストには約 200,000 項目あります。
        各トークンは、リスト内の番号、つまり<strong>トークン ID</strong> に置き換えられます。例文は <code>976 9059 10139 402 290</code> になります。
      </p>
      <p>
        これらの番号はリスト内の位置にすぎず、座席番号のようなものです。トークン 9059（<code>·cat</code>）が、トークン 402（<code>·on</code>）より意味のある形で「大きい」わけではありません。
        モデルには、もっと情報量のある表現が必要です。
      </p>

      <h2>3. ID がベクトルになる</h2>
      <p>
        モデルの中には、語彙の項目ごとに 1 行ある巨大な表があります。各行は<strong>ベクトル</strong>、つまり数値のリストで、大きなモデルでは通常数千個の数値が並びます。
        トークンの行を引くと、そのトークンの<strong>埋め込み</strong>が得られます。これらの数値を人が手で書くことはありません。最初はランダムで、学習の中で調整され、
        似た使われ方をするトークンが似た行になるまで変わっていきます。
      </p>
      <Fig caption="埋め込みの表を引く様子：各トークン ID が 1 つの行を選びます。色は数値を表します（ティールが正、赤が負）。説明用の図で、数千ある列のうち 8 列だけを描いており、値は作ったものです。">
        <div className={h.table} role="img" aria-label="埋め込みの表：トークン ID 290、402、976、9059、10139 の行があり、それぞれ 8 個の色付きセルが並んでいます。9059（·cat）の行が強調されています。">
          <p className={h.sub}>行 = トークン ID · 列 = ベクトル内の数値</p>
          <Gap />
          {TABLE_ROWS.map(([id, t]) => (
            <div key={id}>
              <Cells label={`${id} ${t}`} values={vec(id)} hit={id === 9059} />
              <Gap />
            </div>
          ))}
          <Gap>全部で約 200,000 行</Gap>
        </div>
      </Fig>
      <p>
        意味を数値の空間内の位置として表すというこの考え方は、<ArticleLink slug="what-are-embeddings">埋め込みとは何か</ArticleLink>の核心です。
        その空間の方向が何を捉えられるかは<ArticleLink slug="latent-space">潜在空間</ArticleLink>で探ります。
      </p>

      <h2>4. Transformer：トークン同士が互いを見る</h2>
      <p>
        この時点では、各ベクトルはそのトークン単体のことしか表していません。「bank」という単語は、「river bank」（川岸）でも「bank account」（銀行口座）でも同じ初期ベクトルを持ちます。
        モデルの本体である <strong>Transformer</strong> がこれを解決します。Transformer は見た目が同じ<strong>層</strong>を積み重ねたもので、大きなモデルでは数十層あります。
      </p>
      <p>
        各層は 2 つのことをします。まず<strong>アテンション</strong>です。各トークンが自分より前のトークンを振り返り、どれが自分にとって重要かを決め、そこから情報を混ぜ込みます。
        次に、小さなニューラルネットワークが各ベクトルを個別に更新します。多くの層を経ると、各ベクトルはそのトークンを<em>文脈の中で</em>表すようになります。
      </p>
      <Fig caption="同じトークン「·bank」は、どちらの文でも同じベクトルで層に入ります。アテンションが周りの単語の情報を混ぜ込んだ後は、2 つのベクトルは異なります。説明用の値です。">
        <div className={l.pair} role="img" aria-label="river bank（川岸）と bank account（銀行口座）の 2 つの文。層に入る前の 2 つの bank のベクトルは同じで、層を通った後は異なります。">
          {[["I sat by the river bank", 11], ["I opened a bank account", 29]].map(([sentence, seed]) => (
            <div key={seed} className={h.table}>
              <h3>{sentence}</h3>
              <Cells label="·bank 入力" values={vec(4101)} />
              <Cells label="·bank 出力" values={vec(4101 * seed)} />
            </div>
          ))}
        </div>
      </Fig>
      <p>
        アテンションは、現代の言語モデルがこれほどうまく働くようになった鍵となるアイデアです。詳しくは<ArticleLink slug="attention-and-transformers">アテンションと Transformer をゼロから解説</ArticleLink>で一歩ずつ説明しています。
      </p>

      <h2>5. 予測するのは最後の位置だけ</h2>
      <p>
        最後の層の後も、トークンごとに 1 つのベクトルが残っています。次のトークンを選ぶとき、モデルが使うのは<strong>最後の位置</strong>のベクトルだけで、この例では <code>·the</code> のものです。
        アテンションによってそれより前のすべてのトークンから情報を集めているので、この 1 つのベクトルには、モデルが文全体について読み取った内容が詰まっています。
      </p>

      <h2>6. すべてのトークンにスコア：ロジット</h2>
      <p>
        最後のベクトルを語彙のすべての項目と照らし合わせ、トークンごとに 1 つ、合計約 200,000 個のスコアを出します。
        この生のスコアを<strong>ロジット</strong>と呼びます。ロジットが高いほど、モデルはそのトークンを続きとして適していると評価しています。ロジットはそのままでは読み取りにくく、
        負の値にもなりますし、合計が特定の値になるわけでもありません。
      </p>

      <h2>7. スコアが確率になる：ソフトマックス</h2>
      <p>
        <strong>ソフトマックス</strong>という関数が、ロジットを<strong>確率</strong>に変えます。すべての値を正にし、合計が 100% になるように調整します。
        ソフトマックスは各スコアを指数関数にかけるので、大きなロジットほどはるかに大きな割合を得ます。ロジットが 2 高いと、確率はおよそ 7 倍になります。
      </p>
      <Fig caption="「The cat sat on the」の後に来る可能性が高い上位 5 トークンのロジットと、ソフトマックスがそこから作る確率です。互いに整合するように選んだ説明用の数値で、残りの約 200,000 トークンが最後の 27% を分け合います。">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>次のトークン</th><th>ロジット</th><th>確率</th></tr></thead>
            <tbody>
              {PROBS.map(([t, p]) => (
                <tr key={t}><td>{t}</td><td>{(Math.log(p) + 10).toFixed(1)}</td><td>{Math.round(p * 100)}%</td></tr>
              ))}
              <tr><td>その他すべて</td><td>より低い</td><td>27%</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>8. トークンを 1 つ選ぶ</h2>
      <p>
        これでモデルはすべてのトークンの確率を手にしましたが、何かが 1 つを選ばなければなりません。いちばん単純なルールである<strong>貪欲法</strong>（グリーディ・デコーディング）は、常に最上位のものを取ります。
        多くのチャットシステムは代わりに<strong>サンプリング</strong>を行います。確率で重み付けしてランダムに引くので、同じプロンプトでも異なる答えが返ることがあります。
      </p>
      <p>
        この引き方は設定で調整できます。<strong>top-k</strong> サンプリングは、可能性の高い上位 k 個のトークンだけを残し、合計が 100% になるように調整してから引くので、極端にありえないトークンは決して出てきません。
        <strong>温度</strong>は確率の分布を鋭くしたり平らにしたりします。<ArticleLink slug="next-token-prediction">最後のベクトルから次の単語へ</ArticleLink>では、それぞれをインタラクティブな例で紹介しています。
      </p>

      <h2>9. 追加して繰り返す</h2>
      <p>
        選ばれたトークン <code>·mat</code>（ID 2450）がテキストの末尾に追加されます。そして、長くなったテキストに対して処理の流れ<em>全体</em>がもう一度実行され、その次のトークンが選ばれます。
        さらにその後も同じです。300 トークンの返答は 300 回の処理です。答えが画面に一語ずつ現れるのは、このループのためです。
      </p>
      <Fig caption="各回の処理は、それまでのすべてを読んでトークンを 1 つ加えます。モデルが特別な終了トークンを出すか、長さの上限に達するとループは止まります。">
        <div className={h.growth}>
          <Chips label="1 回目：5 トークンを読む → ·mat を追加" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"]]} />
          <Chips label="2 回目：6 トークンを読む → . を追加" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"]]} />
          <Chips label="3 回目：7 トークンを読む → …" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"], ["."]]} />
        </div>
      </Fig>
      <p>
        実際のシステムでは、すでに処理したトークンの途中結果を保存しておくことで、毎回すべてをやり直す手間を省いています。それでも仕組みは同じで、
        1 回の処理で 1 つの新しいトークンです。
      </p>

      <h2>数値はどこから来るのか</h2>
      <p>
        埋め込みの表、アテンションの層、最後のスコア付けなど、モデルが使う数値はすべて、学習で得られた<strong>パラメータ</strong>です。
        学習では、モデルに膨大な量のテキストを見せて次のトークンを一つひとつ予測させ、正しい次のトークンが少しだけ出やすくなるように、すべてのパラメータをわずかに調整します。
        これを何兆ものトークンにわたって繰り返すと、そのわずかな調整が積み重なって、テキストをうまく続けられるモデルになります。チャットアシスタントは、その続きが役に立つ回答として読めるように、会話でさらに学習しています。
      </p>

      <h2>よくある誤解</h2>
      <ul>
        <li>
          <strong>「答え全体を一度に書いている」</strong> そうではありません。トークンを 1 つ予測して追加し、また実行します。
          完成した答えが待っているわけではなく、各トークンはそれまでのテキストだけをもとに選ばれます。
        </li>
        <li>
          <strong>「答えを調べている」</strong> 内部に質問と答えのデータベースはありません。あるのは学習で決まったパラメータの集合だけで、
          答えは毎回そこから新しく計算されます。モデルが誤ったことを自信満々に述べることがあるのもそのためで、結果を情報源と照らし合わせる仕組みがないのです。
        </li>
        <li>
          <strong>「人と同じように理解している」</strong> モデルが持っているのはテキストから学んだ統計的なパターンで、文法や事実、ある程度の推論を捉えられるほど豊かなものです。
          それを理解と呼べるかどうかは議論が分かれています。確かなのは、モデルがテキストから学んだのであって、世界を見たり触れたり、そこで暮らしたりして学んだのではないということです。
        </li>
      </ul>

      <h2>次に読むもの</h2>
      <p>
        上の各ステップには、それぞれ専用の記事があります：<ArticleLink slug="why-tokens">トークン</ArticleLink>、<ArticleLink slug="tokenization-algorithms">トークナイザー</ArticleLink>、{" "}
        <ArticleLink slug="what-are-embeddings">埋め込み</ArticleLink>、<ArticleLink slug="latent-space">潜在空間</ArticleLink>、{" "}
        <ArticleLink slug="attention-and-transformers">アテンション</ArticleLink>、<ArticleLink slug="next-token-prediction">次のトークンの選び方</ArticleLink>。
        このサイトでは、<Link href="/tokenizer">トークナイザー</Link>で自分のテキストを分割したり、<Link href="/embedding">埋め込みエクスプローラー</Link>で単語ベクトルを探索したりできます。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.youtube.com/watch?v=wjZofJX0v4M", title: "But what is a GPT? Visual intro to transformers", source: "3Blue1Brown, YouTube", note: "この処理の流れ全体を図解した最高の解説動画（現在のタイトルは「Transformers, the tech behind LLMs」、英語）" },
  { href: "https://jalammar.github.io/illustrated-gpt2/", title: "The Illustrated GPT-2", source: "Jay Alammar", note: "同じ処理の流れを一段深く、一歩ずつ図にしたもの（英語）" },
  { href: "https://bbycroft.net/llm", title: "LLM Visualization", source: "Brendan Bycroft", note: "小さな実在の GPT のすべての数値を 3D でたどれる" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "大規模言語モデルはどうやって文章を生成するのですか？", a: "テキストをトークンに分割し、各トークン ID をベクトルに変え、そのベクトルを Transformer に通します。最後の位置の出力が、語彙のすべてのトークンに対するスコアになります。ソフトマックスがスコアを確率に変え、トークンが 1 つ選ばれてテキストに追加され、答えが終わるまでこのループが繰り返されます。" },
  { q: "ChatGPT は自分の言っていることを理解しているのですか？", a: "人と同じように読んだり考えたりしているわけではありません。膨大なテキストから、どのトークンの後にどのトークンが来やすいかを学んでおり、そのパターンは文法や事実、推論の多くを捉えています。それを理解と呼べるかは議論がありますが、仕組みとしては、どの返答も予測したトークンを 1 つずつ積み上げて作られています。" },
  { q: "AI が同じ質問に違う答えを返すのはなぜですか？", a: "モデルは各ステップで 1 つの決まった答えではなく確率を出し、多くのチャットアプリは常に最上位のトークンを取るのではなく、その確率からサンプリングします。温度や top-p といった設定で、どれだけランダムさを許すかを調整します。サンプリングをオフにすれば、同じモデルと同じプロンプトからは同じ出力が得られます。" },
  { q: "言語モデルの知識はどこから来るのですか？", a: "学習からです。モデルは非常に大量のテキストを読み、次のトークンをうまく予測できるように、パラメータと呼ばれる何十億もの数値を調整します。事実はその数値の中に暗黙的に蓄えられます。周りのアプリが検索や情報取得のステップを加えない限り、回答中に何かを調べることはありません。" },
];
