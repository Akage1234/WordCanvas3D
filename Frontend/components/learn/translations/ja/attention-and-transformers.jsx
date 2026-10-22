import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig, ArticleLink, Callout } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/attention-and-transformers.module.css";
import { AttentionLines, AttentionMatrix, AttentionSteps } from "./attention-and-transformers.figures";

const [RED, TEAL, , YELLOW, INDIGO] = CLUSTER_COLORS;

function Sentence({ label, words, hi, sub }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {words.map((w, i) => (
        <span key={i} className={l.chip} style={{ "--tc": i === hi ? YELLOW : "#ffffff30" }}>
          <b>{w}</b>
          {i === hi && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

function Box({ y, h = 30, text, color }) {
  return (
    <g>
      <rect x="50" y={y} width="180" height={h} rx="8" fill={color} fillOpacity=".22" stroke={color} />
      <text x="140" y={y + h / 2 + 4} textAnchor="middle" className={s.label}>{text}</text>
    </g>
  );
}

const Up = ({ y1, y2 }) => <line x1="140" y1={y1} x2="140" y2={y2} stroke="#cfd8e6" strokeWidth="1.5" markerEnd="url(#att-tip)" />;

function Plus({ cy }) {
  return (
    <g>
      <circle cx="140" cy={cy} r="10" fill="#0e1015" stroke="#cfd8e6" strokeWidth="1.5" />
      <path d={`M134 ${cy}h12M140 ${cy - 6}v12`} stroke="#fff" strokeWidth="1.5" />
    </g>
  );
}

function BlockDiagram() {
  const grey = "#9aa7ba";
  return (
    <svg viewBox="0 0 340 404" className={s.block} role="img"
      aria-label="Transformer ブロック 1 つ：入力は正規化とアテンションを通り、その結果が入力に足し戻されます。次に正規化とフィードフォワードネットワークを通り、その結果も足し戻されます。このブロックが N 回繰り返されます。">
      <defs>
        <marker id="att-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#cfd8e6" />
        </marker>
      </defs>
      <rect x="20" y="42" width="300" height="310" rx="14" fill="none" stroke="#ffffff24" strokeDasharray="6 5" />
      <text x="34" y="62" style={{ fill: grey }}>ブロック × N</text>

      <text x="140" y="20" textAnchor="middle" className={s.label}>更新されたベクトル</text>
      <Up y1={52} y2={28} />
      <Plus cy={62} />
      <Box y={90} text="フィードフォワード" color={TEAL} />
      <Up y1={90} y2={74} />
      <Box y={140} h={26} text="正規化" color={grey} />
      <Up y1={140} y2={122} />
      <Plus cy={200} />
      <Up y1={190} y2={168} />
      <Box y={228} text="マルチヘッドアテンション" color={INDIGO} />
      <Up y1={228} y2={212} />
      <Box y={278} h={26} text="正規化" color={grey} />
      <Up y1={278} y2={262} />
      <Box y={366} text="トークンのベクトル + 位置" color={YELLOW} />
      <Up y1={366} y2={306} />

      <g fill="none" stroke={RED} strokeWidth="1.5" strokeDasharray="5 4">
        <path d="M140 326H290V200H153" markerEnd="url(#att-tip)" />
        <path d="M140 180H290V62H153" markerEnd="url(#att-tip)" />
      </g>
      <text x="300" y="245" style={{ fill: RED }} transform="rotate(90 300 245)">残差</text>
      <text x="300" y="95" style={{ fill: RED }} transform="rotate(90 300 95)">残差</text>
    </svg>
  );
}

export default function AttentionAndTransformers() {
  return (
    <>
      <p>
        言語モデルがあなたのテキストについて考え始める時点で、各トークンはすでに数値のリスト、つまり<strong>埋め込み</strong>に置き換えられています
        （<ArticleLink slug="what-are-embeddings">埋め込みとは何か？</ArticleLink>を参照）。しかし、その最初のベクトルは表引きで得たものです。
        周りの文がどうであれ、そのトークンが現れるたびに同じものになります。この記事では、これを解決する考え方である<strong>アテンション</strong>と、
        それを組み込んだ <strong>Transformer</strong>、つまり現代のほぼすべての言語モデルの土台となる設計を説明します。
      </p>

      <h2>なぜ文脈が重要なのか</h2>
      <p>次の 2 つの文の「bank」という単語を見てください。</p>
      <Fig caption="同じトークンに 2 つの意味。区別できるのは周りの単語だけです。">
        <div className={s.contextRows}>
          <Sentence label="文 1（川岸に座った）" words={["We", "sat", "on", "the", "river", "bank"]} hi={5} sub="川岸" />
          <Sentence label="文 2（銀行に現金を預けた）" words={["She", "paid", "cash", "into", "the", "bank"]} hi={5} sub="お金" />
        </div>
      </Fig>
      <p>
        表引きでは、どちらの「bank」にも同じ 1 つのベクトルが与えられます。人なら「river」（川）を読んだ瞬間に、どの bank のことかわかります。
        代名詞はさらに文脈に頼っています。「The animal didn’t cross the street because it was too tired」（その動物は疲れすぎていたので通りを渡らなかった）では、「it」が「the animal」を指していると突き止めるまで、「it」には何の意味もありません。
      </p>
      <p>
        そこでモデルには、各トークンが<em>他のトークンから情報を集め</em>、自分のベクトルを更新する方法が必要です。それこそがアテンションの役割です。
      </p>

      <h2>アテンション：各トークンが質問をする</h2>
      <p>
        直感的にはこうです。各トークンが「他のトークンのうち、どれが自分にとって重要だろう？」と問います。見えるトークンそれぞれにスコアを付け、スコアを割合に変え、
        そのトークンたちの情報を、割合の高いものほど多く混ぜて取り込みます。この割合を<strong>アテンションの重み</strong>と呼びます。
      </p>
      <Fig caption="考え方を示すために手で書いた説明用の重みで、実際のモデルから取ったものではありません。左のトークンにカーソルを合わせるか、タップするか、Tab キーで移動すると、それが右の各トークンにどれだけ注意を向けているかがわかります。テキスト生成モデルと同じく、後ろのトークンは隠されています。">
        <AttentionLines />
      </Fig>
      <p>
        「it」を選ぶと、重みの大部分が「animal」に向かいます。このステップの後、「it」のベクトルは「animal」の意味をいくらか運ぶようになり、それがモデルの後の部分で必要になります。
        実際のモデルでは、これらの重みを人が手で書くことはありません。モデルが学習で得た数値を使って、ベクトル自体から計算されます。
      </p>

      <h2>クエリ、キー、バリュー</h2>
      <p>
        トークンは、誰が重要かをどうやって決めるのでしょうか？ 図書館の検索を思い浮かべてください。あなたは<strong>クエリ</strong>（query、探しているもの）を入力します。各本には背表紙のラベルのような<strong>キー</strong>（key、何についての本か）があります。
        クエリをすべてのラベルと比べ、よく一致するほど、その本の中身、つまり<strong>バリュー</strong>（value）を多く読みます。
      </p>
      <p>
        Transformer では、各トークンが 3 つの役割をすべて担います。トークンのベクトルに、学習済みの 3 つの異なる行列を掛けて、3 つの新しいベクトルを作ります。
      </p>
      <ul>
        <li><strong>クエリ</strong>：このトークンが探しているもの。</li>
        <li><strong>キー</strong>：このトークンが差し出すもの。他のトークンがそれを見つけられるようにします。</li>
        <li><strong>バリュー</strong>：誰かがこのトークンに注意を向けたときに渡す情報。</li>
      </ul>
      <p>
        そして、見る側のトークンについて、手順は 4 ステップです。<strong>比べる</strong>：<strong>内積</strong>を使ってクエリをすべてのキーと比べます。2 つのベクトルを数値ごとに掛けて結果を足し合わせるのです。
        向きが似ていれば大きな数になります。<strong>スケーリング</strong>：スコアをベクトルの長さの平方根で割って小さくします。<strong>ソフトマックス</strong>：どんな数値のリストも、合計が 1 になる正の数に変える関数にかけます。
        最後に、各バリューにその重みを掛けて<strong>混ぜ</strong>ます。
      </p>
      <Fig caption="計算が見えるように、2 つの数値からなるベクトルを使ったおもちゃの例です。数値は作ったものですが、どのステップも Transformer とまったく同じように計算しています。実際のモデルは、ヘッドあたり数十から数百の数値からなるベクトルを使います。">
        <AttentionSteps />
      </Fig>
      <p>
        すべてのトークンについてまとめて書くと、Transformer を発表した 2017 年の論文の数式 <code>softmax(QKᵀ / √d) · V</code> になります。
        Q、K、V はすべてのトークンのクエリ、キー、バリューを表に積み重ねたもので、d はキーベクトルの長さです。
      </p>

      <h2>因果マスク：先をのぞかない</h2>
      <p>
        GPT のようなテキスト生成モデルは、左から右へ 1 トークンずつ書きます（そのループは<ArticleLink slug="next-token-prediction">最後のベクトルから次の単語へ</ArticleLink>で扱っています）。
        学習中、モデルはテキストの次のトークンを一つひとつ予測することを学びます。もしトークンが自分より後ろの単語を見られたら、答えをそのまま写せてしまいます。
      </p>
      <p>
        そこでこうしたモデルは<strong>因果マスク</strong>を使います。ソフトマックスの前に、後ろのすべてのトークンのスコアをマイナス無限大にします。ソフトマックスはそれをちょうどゼロの重みに変えます。
        各トークンは自分自身とそれより前のすべてを見られますが、後ろは決して見られません。グリッドとして描くと、重みは三角形になります。
      </p>
      <Fig caption="同じ説明用の重みをグリッドにしたものです。各行が見る側のトークン、各列が見られる側のトークンです。明るいほど重みが大きいことを表します。斜線の入った右上の三角形はマスクされています。">
        <AttentionMatrix />
      </Fig>
      <p>
        すべての Transformer が因果的なわけではありません。BERT のように、テキストを書くためではなく理解するために作られたモデルでは、各トークンが文全体を両方向に見られます。
      </p>

      <h2>たくさんのヘッドを同時に</h2>
      <p>
        1 組の重みが一度に表せるのは、1 種類の関係だけです。でも、トークンが気にすることはいくつもあるかもしれません。代名詞がどの名詞を指すか、主語にどの動詞が対応するか、直前の単語は何だったか。
      </p>
      <p>
        そこで Transformer は、それぞれ独自のクエリ、キー、バリューの行列を持つアテンションの計算をいくつも並行して実行します。その 1 つひとつを<strong>ヘッド</strong>と呼びます。
        各ヘッドの出力はつなげられ、混ぜ合わされて 1 つのベクトルに戻ります。元の Transformer は 1 層あたり 8 個のヘッドを使い、GPT-2 の最小版は 12 個を使っています。
      </p>
      <Callout title="実際のアテンションはどう見えるか">
        「it」がはっきり「animal」を指す上のきれいな図は、教えるためのスケッチです。実際のモデルを調べる研究者は、直前のトークンに注意を向けるといった、読み取れる役割を持つヘッドも見つけています。
        しかし多くのヘッドは雑然として見え、休憩場所のように重みの大部分を最初のトークンに置くものもあり、仕事は多くのヘッドと層に分散しています。
        アテンションのパターンが示すのは情報がどこへ流れるかであって、モデルがなぜその答えを出したのかの完全な説明ではありません。
      </Callout>

      <h2>Transformer ブロック</h2>
      <p>
        アテンションはトークン同士に情報を共有させます。Transformer はそれを、さらに 3 つの要素と一緒に 1 つの<strong>ブロック</strong>に包みます。
      </p>
      <ul>
        <li>
          <strong>フィードフォワードネットワーク。</strong> アテンションがトークン<em>の間で</em>情報を混ぜた後、各トークンのベクトルは単独で小さなニューラルネットワークを通ります。
          ベクトルはより長いもの（元の設計では 4 倍の長さ）に広げられ、単純な非線形関数を通り、元の長さに縮められます。モデルが蓄えた知識の多くはここにあると考えられています。
        </li>
        <li>
          <strong>残差接続。</strong> トークンのベクトルを置き換えるのではなく、各サブ層の出力をそれに<em>足し</em>ます。ベクトルは、どの層も少しずつ書き換える、継続的な記録になります。
          これにより、とても深い積み重ねもずっと学習しやすくなります。
        </li>
        <li>
          <strong>正規化。</strong> 各サブ層の前に、ベクトルを標準的な大きさにそろえ直して、多くの層を通る間に数値が爆発したり消えたりしないようにします。
        </li>
      </ul>
      <Fig caption="Transformer ブロック 1 つを、下から上へ読む図です。GPT 系のほとんどのモデルが使う「先に正規化する」配置で描いています。赤い破線の経路が残差接続で、入力が各サブ層を迂回して足し戻されます。">
        <BlockDiagram />
      </Fig>

      <h2>ブロックを積み重ねる</h2>
      <p>
        モデルは、それぞれ独自の学習済みの数値を持つこうしたブロックを、たくさん積み重ねたものです。元の Transformer は前半・後半それぞれに 6 個、GPT-2 の最小版は 12 個、大きなモデルはさらに数十個多く持っています。
        各ブロックは前のブロックが作ったベクトルを読み、磨き上げます。前のほうの層は局所的で表面的なパターンを扱う傾向があり、後ろのほうの層はより抽象的な特徴を組み立てます。
      </p>
      <p>
        途中で形が変わることはありません。トークンごとに 1 つのベクトルが入り、トークンごとに 1 つのベクトルが出ます。いちばん上で、最後のトークンのベクトルが次のトークンの予想に変えられます。
      </p>

      <h2>語順はどこにあるのか？</h2>
      <p>
        1 つ落とし穴があります。アテンションはそれだけでは順序を無視します。すべてのトークンを他のすべてと比べるので、「dog bites man」（犬が人をかむ）と「man bites dog」（人が犬をかむ）が同じに見えてしまいます。
        Transformer は各トークンに<strong>位置の情報</strong>を与えることでこれを解決します。元の論文では、位置ごとに異なる正弦波の固定パターンを各埋め込みに足していました。
        GPT-2 は代わりに位置ベクトルを学習します。新しいモデルの多くは、位置に応じた角度でクエリとキーのベクトルを回転させ（RoPE という方法です）、アテンションのスコアに 2 つのトークンがどれだけ離れているかが反映されるようにしています。
      </p>

      <Callout title="ひとことで言うと">
        各トークンがクエリ、キー、バリューを作り、アテンションがクエリとキーを比べて各バリューをどれだけ混ぜるかを決めます。Transformer はそれに小さなトークンごとのネットワークを加えたものを、ブロックごとに繰り返します。
      </Callout>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.3blue1brown.com/lessons/attention", title: "Attention in transformers, step-by-step", source: "3Blue1Brown", note: "動画。最高の図解による解説" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "動画。全体像" },
  { href: "https://jalammar.github.io/illustrated-transformer/", title: "The Illustrated Transformer", source: "Jay Alammar" },
  { href: "https://arxiv.org/abs/1706.03762", title: "Attention Is All You Need", source: "Vaswani et al., 2017", note: "元の論文" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "Transformer のアテンションとは何ですか？", a: "アテンションは、各トークンがテキスト内の他のトークンを見て、それぞれが自分にとってどれだけ重要かを決める仕組みです。各トークンはクエリ、キー、バリューを作り、自分のクエリをすべてのキーと比べて重みを求め、新しいベクトルはバリューの重み付きの混ぜ合わせになります。こうして文脈が単語の意味を変えます。" },
  { q: "クエリ、キー、バリューとは何ですか？", a: "各トークンのベクトルから、学習済みの重みを使って計算される 3 つのベクトルです。クエリはそのトークンが探しているもの、キーはそのトークンが差し出すもの、バリューはそのトークンが渡す情報を表します。クエリとキーの一致度がアテンションの重みを決め、その重みでバリューを混ぜます。" },
  { q: "マルチヘッドアテンションとは何ですか？", a: "Transformer はアテンションを 1 回だけ実行するのではなく、それぞれ独自のクエリ、キー、バリューの重みを持つ複数のアテンションヘッドを並行して実行します。ヘッドごとに、近くの単語、文法、前に出てきた名前への参照など、異なる関係を追うように学習でき、それらの出力が組み合わされます。" },
  { q: "Transformer はどうやって語順を知るのですか？", a: "アテンションはそれだけでは入力を順序のない集合として扱うので、位置の情報を加える必要があります。元の Transformer は各埋め込みに固定の正弦波パターンを足し、GPT-2 は位置ベクトルを学習し、新しいモデルの多くは位置に応じた角度でクエリとキーを回転させる回転位置埋め込み（RoPE）を使っています。" },
];
