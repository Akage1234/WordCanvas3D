import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/why-tokens.module.css";
import { ThreeWaySplit } from "./why-tokens.figures";

const [RED, TEAL, , YELLOW] = CLUSTER_COLORS;

// Counts for the Austen sentence below: characters and words counted directly, tokens with o200k_base.
const LENGTHS = [["文字", 117, RED], ["単語", 23, TEAL], ["トークン（o200k_base）", 26, YELLOW]];

function Chips({ label, items }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {items.map((t, i) => {
        const [text, sub] = [].concat(t);
        return (
          <span key={i} className={l.chip} style={{ "--tc": text === "[UNK]" ? "#8a93a3" : CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
            <b>{text}</b>
            {sub && <small>{sub}</small>}
          </span>
        );
      })}
    </div>
  );
}

export default function WhyTokens() {
  return (
    <>
      <p>
        言語モデルは計算をするプログラムです。画面上の文字をそのまま読むことはできません。
        テキストに対して何かをする前に、テキストを小さな単位に切り分け、各単位を数値に置き換える必要があります。
        この単位を<strong>トークン</strong>と呼び、切り分けることを<strong>トークン化</strong>と呼びます。
      </p>
      <p>
        当然、次の疑問が浮かびます。単位は何にすべきでしょうか？ 1 文字？ 単語まるごと？ 現代のモデルはどれも「その中間」と答えます。この記事ではその理由を説明します。
        結局のところ、何種類の単位を許すかと、1 つの文を書くのにいくつの単位が必要かのトレードオフに行き着きます。
      </p>

      <h2>引っ張り合う 2 つの数</h2>
      <p>
        どんな単位を選んでも、結果は 2 つの数で表せます。
      </p>
      <ul>
        <li>
          <strong>語彙</strong>は、モデルが知っているすべての単位の決まったリストです。各項目には ID が振られ、モデルは項目ごとに別々の数値の組を学習します。
          語彙が大きいほど、学習して保存するものが増えます。
        </li>
        <li>
          <strong>系列長</strong>は、あるテキストを書くのに必要な単位の数です。系列が長いほど、モデルが読み書きするたびの作業が増えます。
        </li>
      </ul>
      <p>
        単位が小さいと語彙は小さくなりますが、系列は長くなります。単位が大きいと系列は短くなりますが、語彙は巨大になります。下で試してみてください。同じテキストを 3 通りに切り分けています。
      </p>
      <Fig caption="1 つのテキストを、文字ごと、単語ごと（空白のあるところ）、そして GPT-4o が使う o200k_base トークナイザーのサブワードトークンに分割したものです。例はあらかじめ計算してあります。自分でテキストを入力すると、本物のトークナイザーがブラウザで読み込まれます。· は空白を表し、<F0 9F> のようなラベルは、文字の一部でしかない生のバイトです。">
        <ThreeWaySplit />
      </Fig>
      <p>
        いくつかの例を見てみましょう。文字の行はいつも最も長くなります。英語では単語の行が最も短くなりますが、空白を入れずに書く日本語ではうまくいかず、
        文全体が 1 つの「単語」になってしまいます。サブワードの行は長さが単語の行に近く、それでいてどの例にも対応できています。
      </p>

      <h2>選択肢 1：文字</h2>
      <p>
        1 文字を 1 トークンにする方法には、確かな魅力があります。語彙は小さく、足りなくなることもありません。どんなテキストも文字の並びにすぎないので、モデルが書き表せないものに出会うことはありません。
      </p>
      <p>
        問題は長さです。1 文字だけではほとんど意味を持ちません。<code>t</code> という文字はモデルにほとんど何も伝えないので、モデルは意味を考える前に、文字を単語に組み立て直すことに労力を使わなければなりません。
        しかも、どのテキストも必要以上に何倍も長くなります。
      </p>
      <p>
        長さが問題になる具体的な理由は 2 つあります。1 つ目は計算量です。<ArticleLink slug="attention-and-transformers">Transformer</ArticleLink> では、すべてのトークンが他のすべてのトークンを見るので、
        その部分の作業は長さの 2 乗で増えます。長さが 2 倍になると、その部分のコストは約 4 倍になります。
        2 つ目は、モデルが一度に受け取れるトークン数の上限である<strong>コンテキストウィンドウ</strong>が、決まった予算だということです。1 トークンに入るテキストが少なければ、文書のうち収まる部分も少なくなります。
      </p>
      <Fig caption="同じ文（『高慢と偏見』の冒頭の一文）を 3 通りに数えたものです。文字数と単語数は正確な値で、トークン数は o200k_base トークナイザーによるものです。">
        <p className={s.quote}>“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”</p>
        <dl className={s.bars}>
          {LENGTHS.map(([name, n, c]) => (
            <div key={name} style={{ display: "contents" }}>
              <dt>{name}</dt>
              <dd style={{ "--tc": c }}><i style={{ "--w": `${(n / 117) * 85}%` }} />{n}</dd>
            </div>
          ))}
        </dl>
      </Fig>

      <h2>選択肢 2：単語まるごと</h2>
      <p>
        単語まるごとなら長さの問題は解決します。英語では、トークン数は単語数に近くなります。各単位にも意味があります。しかし、3 つの問題が出てきます。
      </p>
      <ul>
        <li>
          <strong>語彙が爆発的に増える。</strong> 複数形、時制、複合語（<code>run</code>、<code>runs</code>、<code>running</code>、<code>rerun</code>…）まで数えると、英語だけでも語形は何十万にもなります。
          さらに名前、数字、タイプミス、ハッシュタグ、コード、他の言語を加えると、どんなリストも完成することはありません。
        </li>
        <li>
          <strong>未知の単語。</strong> リストにないものは、すべて 1 つの何でも受けるトークンに置き換えるしかありません。ふつうは <code>[UNK]</code> と書かれます。
          モデルにはすべての未知の単語が同じに見えるので、その意味は失われてしまいます。
        </li>
        <li>
          <strong>すべての言語が空白を使うわけではない。</strong> 中国語、日本語、タイ語は単語の間に空白を入れないので、「空白で区切る」では単語が何かさえ決まりません。
        </li>
      </ul>
      <p>
        珍しい単語は、もっと目立たない問題も起こします。学習テキストにほんの数回しか出てこない単語にも語彙の項目が 1 つ与えられますが、モデルが目にする例が少なすぎて、その単語についてほとんど学べません。
      </p>
      <Fig caption="上の行（説明用）：英語のテキストだけで学習した単語単位のトークナイザーが、ドイツ語の文と絵文字をどう扱うか。見たことのないものはすべて同じ [UNK] トークンになります。下の行（本物）：同じテキストの o200k_base のサブワードトークン。何も失われていません。">
        <Chips label="単語単位、英語のみの語彙（説明用）" items={[["[UNK]", "Grüße"], ["[UNK]", "aus"], ["[UNK]", "München!"], ["[UNK]", "🦒"]]} />
        <Chips label="サブワードトークン、o200k_base（本物）" items={["Gr", "ü", "ße", "·aus", "·München", "!", "·<F0 9F>", "<A6>", "<92>"]} />
      </Fig>

      <h2>妥協案：サブワードの断片</h2>
      <p>
        サブワードによるトークン化は、両方の選択肢の良いところを取ります。よく使われる単語や、前に空白の付いたよく使われる単語は、それぞれ専用の 1 トークンになるので、日常的な英語は短いままです。
        珍しい単語は、それ自体はよく使われる、いくつかの小さな断片で綴られます。上の例では、<code>Tokenizers</code> が <code>Token</code> + <code>izers</code> になります。
        断片は使い回せるので、モデルは <code>izers</code> がふつう何を意味するかを、さまざまな単語から学べます。
      </p>
      <p>
        語彙は、モデルが扱える大きさに収まります。GPT-2 のトークナイザーは約 50,000 項目、GPT-4 が使う <code>cl100k_base</code> トークナイザーは約 100,000 項目、<code>o200k_base</code> は約 200,000 項目です。
        大きく聞こえますが、すべての単語のリストとは違い、決まった有限の大きさです。
      </p>
      <Callout title="ひとことで言うと">
        サブワードトークンなら、系列をほぼ単語並みに短く保ちつつ、書き表せない単語に出会うこともありません。
      </Callout>
      <p>
        どの断片をリストに入れるかを決めるのは、言語学者ではありません。トークナイザーが大量のテキストのサンプルから学習し、最もよく出てくるかたまりを残します。
        トークンが辞書の音節や接頭辞とめったに一致しないのはそのためです。この学習の仕組みは<ArticleLink slug="tokenization-algorithms">トークナイザーの作り方</ArticleLink>のテーマです。
      </p>

      <h2>バイト：セーフティネット</h2>
      <p>
        1 つ疑問が残ります。いちばん小さな断片さえ語彙にない場合はどうなるのでしょうか？ 世界の文字体系と絵文字をカバーする標準規格 Unicode には、100,000 をゆうに超える文字があります。
        そのすべてを語彙に入れると、ほとんど出てこない文字のために場所を無駄にしてしまいます。
      </p>
      <p>
        GPT 系のトークナイザーが使う工夫は、代わりに<strong>バイト</strong>を扱うことです。コンピューターは UTF-8 という符号化方式を使ってテキストをバイトとして保存します。普通の英字は 1 バイト、
        <code>ü</code> のようなアクセント付きの文字は 2 バイト、ほとんどの絵文字は 4 バイトです。バイトの値は 256 通りしかないので、256 個すべてを語彙に入れておけば、どんなテキストでも、必要なら 1 バイトずつ書き表せます。
      </p>
      <p>
        ドイツ語の例でそれを確認できます。キリンの絵文字 🦒 は珍しいので、専用のトークンがありません。代わりに生のバイトに分割されます。空白と最初の 2 バイト <code>F0 9F</code> を合わせたトークン、
        次に <code>A6</code>、そして <code>92</code> です。どの断片も単独では文字になりませんが、合わせると絵文字が正確に復元されます。
        未知のものは決してなく、珍しいものはトークンが多くかかるだけです（詳しくは<ArticleLink slug="why-emoji-cost-more-tokens">絵文字や一部の言語でトークンが多くかかる理由</ArticleLink>で見ていきます）。
      </p>
      <p>
        初期の LLaMA モデルが使った SentencePiece トークナイザーのように、まず文字単位で処理し、見たことのない文字のときだけバイトに降りるトークナイザーもあります。効果は同じで、表せないテキストは決してありません。
      </p>

      <h2>実際にはどういうことか</h2>
      <ul>
        <li><strong>上限も料金もトークン単位。</strong> コンテキストウィンドウやほとんどの API の料金は、単語ではなくトークンを数えます。英語ではよく 1 トークンが単語の約 4 分の 3 と言われますが、言語や内容によって大きく変わります。</li>
        <li><strong>同じテキストでもコストが違うことがある。</strong> モデルによって使うトークナイザーが違うので、同じ文でもトークン数が変わります。</li>
        <li><strong>モデルには文字が見えない。</strong> <code>·unbelievably</code> は ID が 1 つの 1 トークンです。モデルはその中の文字を直接見ることはありません。綴りや文字数を数える質問でモデルがつまずくことがあるのは、これが一因です。</li>
      </ul>
      <p>
        テキストがトークン ID のリストになったら、モデルの中の次のステップは、各 ID を意味のある数値のリストに変えることです。それが<ArticleLink slug="what-are-embeddings">埋め込み</ArticleLink>の考え方です。
        <ArticleLink slug="how-llms-work">言語モデルはあなたの言葉をどう答えに変えるのか</ArticleLink>では、この 2 つのステップが処理の流れ全体のどこに位置するかを示しています。
        自分のテキストを複数の本物のトークナイザーで並べて分割するには、<Link href="/tokenizer">トークナイザー</Link>を試してみてください。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM Course", note: "第 6 章でトークナイザーを詳しく扱っています（英語）" },
  { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · 動画" },
  { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "AI のトークンとは何ですか？", a: "トークンとは、言語モデルが 1 つの単位として扱うテキストの小さな断片です。よく使われる単語まるごと、珍しい単語の一部、句読点、あるいは 1 バイトのこともあります。各トークンにはモデルの語彙の中での ID 番号があり、モデルが扱うのは常にその番号で、文字を直接扱うことはありません。" },
  { q: "1,000 トークンは何文字・何単語くらいですか？", a: "普通の英語のテキストなら約 750 単語です。1 トークンは単語の約 4 分の 3 というのがよく使われる目安です。この比率はトークナイザー、言語、内容によって変わります。コード、数字、絵文字、英語以外の言語では、ふつう 1 単語あたりのトークンが多くなります。" },
  { q: "言語モデルはなぜ単語まるごとをトークンにしないのですか？", a: "単語のリストは決して完成しないからです。名前、タイプミス、新語、コード、他の言語がすべて 1 つの未知トークンになって意味を失ってしまいますし、中国語や日本語のように単語の間に空白を入れない言語もあります。サブワードトークンなら、よく使われる単語はまるごと保ち、珍しい単語は使い回せる小さな断片で綴れます。" },
  { q: "AI が単語の文字数を数えるのが苦手なのはなぜですか？", a: "モデルに見えているのは文字ではなくトークン ID だからです。「strawberry」のような単語は 1〜2 トークンで、それぞれが 1 つの番号なので、個々の文字は直接見えません。モデルは各トークンの綴りを学習テキストから覚えていなければならず、そのため文字数を数えたり綴りを扱ったりする作業は意外と間違えやすいのです。" },
];
