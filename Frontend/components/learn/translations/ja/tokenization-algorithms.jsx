import { Link } from "@/i18n/navigation";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import s from "@/components/learn/articles/tokenization-algorithms.module.css";
import { BpeApply, BpeTrainer } from "./tokenization-algorithms.figures";

// Computed from the toy corpus low×5, lower×2, newest×6, widest×3.
// WordPiece score = pair count / (count of first part × count of second part), with ## on word-internal pieces.
const SCORES = [
  ["e + s", 9, "9 / (17 × 9)", "0.059"],
  ["s + t", 9, "9 / (9 × 9)", "0.111"],
  ["w + e", 8, "8 / (13 × 17)", "0.036"],
  ["l + o", 7, "7 / (7 × 7)", "0.143"],
  ["w + i", 3, "3 / (3 × 3)", "0.333"],
];

export default function TokenizationAlgorithms() {
  return (
    <>
      <p>
        <ArticleLink slug="why-tokens">モデルが文字でも単語でもなくトークンを読む理由</ArticleLink>では、現代の言語モデルがテキストを<strong>サブワード</strong>の断片として読むことを見ました。
        よく使われる単語はまるごと残り、珍しい単語は小さな部品から組み立てられます。では、<code>lowest</code> を <code>low</code> + <code>est</code> にすると決めるのは誰でしょうか？
      </p>
      <p>
        人が手で決めているわけではありません。トークナイザーは、言語モデル本体の学習より前に、<strong>学習コーパス</strong>と呼ばれる大量のテキストのサンプルから語彙を<em>学習</em>します。
        この記事では、ほぼすべてのモデルが使う 3 つの方法、<strong>バイトペア符号化</strong>（BPE）、<strong>WordPiece</strong>、<strong>Unigram</strong> を順に見ていきます。
      </p>

      <h2>バイトペア符号化：最も多いペアをマージする</h2>
      <p>
        BPE は、1994 年に Philip Gage がデータ圧縮の技法として考案したのが始まりです。2016 年に Rico Sennrich らが機械翻訳で単語を分割するために応用し、そこから広まりました。
        考え方はひとことで言えます。<strong>1 文字ずつから始め、最もよく現れる隣り合うペアを次々にくっつけていく</strong>ということです。
      </p>
      <p>もう少し詳しく言うと、学習では 3 つのステップを繰り返します。</p>
      <ul>
        <li><strong>ペアを数える。</strong> コーパスのすべての単語を現在の断片に分けて見て、隣り合う断片のペアがそれぞれ何回現れるかを数えます。</li>
        <li><strong>勝者をマージする。</strong> 最も多いペア、たとえば <code>e</code> + <code>s</code> を選び、つなげた断片 <code>es</code> を語彙に加え、コーパス中のそのペアをすべて置き換えます。</li>
        <li><strong>繰り返す。</strong> 語彙があらかじめ決めた大きさに達するまで続けます。</li>
      </ul>
      <p>
        出力は 2 つです。<strong>語彙</strong>（トークナイザーが知っているすべての断片）と、<strong>マージのリスト</strong>（学習した順に並べたマージ）です。4 つの単語だけの小さなコーパスで、一歩ずつ試してみましょう。
      </p>
      <Fig caption="4 つの単語からなる小さなコーパスでの BPE の学習です。「low」が 5 回、「lower」が 2 回、「newest」が 6 回、「widest」が 3 回現れます（Sennrich らの論文の例）。各ステップで、単語の出現回数で重み付けして隣り合うペアを数え、最も多いもの（強調表示）をマージします。同数のときは先に見つかったペアを選びます。数値はすべてコーパスからその場で計算しています。">
        <BpeTrainer />
      </Fig>
      <p>
        マージが何を見つけ出すかに注目してください。最初の 2 回で <code>est</code> ができます。<code>newest</code> にも <code>widest</code> にも現れるからです。
        次に <code>low</code>、その次に <code>new</code> ができ、7 回目のマージまでに、よく出てくる単語 <code>newest</code> が 1 トークンになります。あまり出てこない <code>lower</code> は、まだ <code>low</code> + <code>e</code> + <code>r</code> のままです。
        これこそ望ましい振る舞いです。よく出てくる文字列はまるごとのトークンになり、珍しいものは使い回せる部品のまま残ります。
      </p>
      <p>
        実際のトークナイザーは、同じことを何ギガバイトものテキストで行い、何万回ものマージの後で止まります。
        実際の GPT-2 トークナイザーで最初に学習されたマージは、空白 + <code>t</code>、空白 + <code>a</code>、続いて <code>he</code>、<code>in</code>、<code>re</code>、<code>on</code> でした。英語で最もよく現れる文字のペアです。
      </p>

      <h2>新しいテキストにマージを使う</h2>
      <p>
        学習が終わると、コーパスは捨てられます。新しい単語をトークン化するには、トークナイザーはその単語を文字に分け、マージのリストを<em>学習した順に</em>再生し、当てはまるところすべてに各マージを適用します。
        最後に残ったものがトークンのリストです。
      </p>
      <Fig caption="上で学習した 10 個のマージを新しい単語に適用したものです（説明用の小さな語彙）。「lowest」はコーパスに一度も出てきませんでしたが、low + est になります。実際の GPT-2 トークナイザーも、先頭に空白のない「lowest」をたまたま同じように分割します。">
        <BpeApply />
      </Fig>
      <p>
        サブワードのトークナイザーが本当に未知の単語に出会わないのはこのためです。最悪の場合でも、ここでの <code>rider</code> のように、単語が 1 文字ずつのまま残るだけです。
        ただし 1 つ落とし穴があります。この小さな語彙にはコーパスに現れた 10 文字しか入っていないので、<code>k</code> を含む単語はまったく書き表せません。実際のトークナイザーはこれをバイトで解決します。これについては後で触れます。
      </p>

      <h2>WordPiece：最も意外なペアをマージする</h2>
      <p>
        WordPiece は Google で開発され、<strong>BERT</strong> や DistilBERT など多くの BERT 系モデルのトークナイザーとして最もよく知られています。
        学習のループは BPE に似ています。文字から始め、ペアをマージし、繰り返します。違うのは、<em>どの</em>ペアをマージするかです。
      </p>
      <p>
        BPE は最もよく現れるペアを選びます。WordPiece はその回数を、それぞれの部品が単独で現れる回数で割ります。
      </p>
      <p style={{ textAlign: "center" }}>
        <code>score = count(pair) / (count(first) × count(second))</code>
      </p>
      <p>
        2 つの部品がほとんどいつも<em>一緒に</em>現れるとき、そのペアのスコアは高くなります。文字 <code>e</code> のようにとてもよく現れる断片は、何かの隣にあっても意外ではないので、不利になります。
        （正式には、WordPiece は学習データの尤度を最も高めるマージを選びます。Google は学習コードを公開しておらず、Hugging Face のものなど公開されている実装は、この比率で選んでいます。）
      </p>
      <Fig caption="同じ小さなコーパスでの最初のマージです。BPE は最も多いペアである e + s をマージします。WordPiece は w + i を選びます。3 回しか現れませんが、w と i が離れて現れることはないからです。回数はコーパスから計算しています。WordPiece では単語の内部の断片に ## という接頭辞が付くので、「low」の w と「widest」の先頭の w は別々に数えます。">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col">ペア</th><th scope="col">BPE：回数</th><th scope="col">回数 ÷（1 つ目 × 2 つ目）</th><th scope="col">WordPiece のスコア</th></tr>
            </thead>
            <tbody>
              {SCORES.map(([pair, n, calc, score]) => (
                <tr key={pair}>
                  <td>{pair}</td>
                  <td className={pair === "e + s" ? s.win : undefined}>{n}</td>
                  <td>{calc}</td>
                  <td className={pair === "w + i" ? s.win : undefined}>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fig>
      <p>
        WordPiece はトークンの書き方も違います。単語の続きの断片は <code>##</code> で始まるので、<code>hugs</code> のような単語は <code>hug</code> + <code>##s</code> と分割されることがあります。
        これで、単語の境目がトークン自体に見えるようになります。
        また、新しいテキストをトークン化するとき、WordPiece はマージを再生しません。各単語を左から読み、一致する<strong>語彙内で最も長い断片</strong>を繰り返し取っていきます。どこか一部でも一致しない場合は、単語全体が <code>[UNK]</code> になります。
      </p>

      <h2>Unigram：大きく始めて刈り込む</h2>
      <p>
        2018 年に工藤拓が発表した Unigram の方法は、逆方向に進みます。文字から語彙を育てるのではなく、たとえばコーパス内のよく現れる部分文字列を多数集めた、とても<em>大きな</em>語彙から始めて、それを縮めていきます。
      </p>
      <ul>
        <li>語彙の各断片には、コーパスから推定した確率が付きます。</li>
        <li>単語はたいてい何通りにも分割できます（<code>low</code>+<code>est</code>、<code>lo</code>+<code>west</code>、<code>l</code>+<code>owest</code>…）。トークナイザーは、断片の確率を合わせたものが最も高くなる分割を選びます。</li>
        <li>学習の各ラウンドでは、各断片を取り除いたらコーパスへの当てはまりがどれだけ悪くなるかを計算し、最も影響の小さい断片、ふつうは 10〜20% を削除します。1 文字の断片は常に残すので、どの単語も書き表せるままです。</li>
        <li>これを、語彙が目標の大きさになるまで繰り返します。</li>
      </ul>
      <p>
        Unigram は確率モデルなので、学習中に同じ単語のさまざまな分割を<em>サンプリング</em>することもできます。サブワード正則化と呼ばれるこの工夫で、モデルは変わった綴りに強くなります。
      </p>
      <p>
        Unigram はふつう、Google のライブラリ <strong>SentencePiece</strong> を通して使われます。SentencePiece は生のテキストで直接学習し、空白を普通の記号（<code>▁</code> と書きます）として扱うので、空白のある言語でもない言語でも同じように動きます。
        SentencePiece は Unigram と BPE の両方を実装しています。T5、ALBERT、XLNet は Unigram を使い、初期の LLaMA モデルは SentencePiece の BPE モードを使っていました。
      </p>

      <h2>バイトレベル BPE：未知は決してない</h2>
      <p>
        先ほどの落とし穴に戻りましょう。文字ベースの語彙では、見たことのない文字は書き表せません。2019 年に GPT-2 とともに導入された<strong>バイトレベル BPE</strong> は、文字ではなくテキストの<strong>バイト</strong>（UTF-8 での符号化）に BPE をかけることでこれを解決します。
        バイトの値は 256 通りしかなく、最初からすべてが語彙に入っているので、どの言語のどんな文字列でも、絵文字も含めてトークン化できます。<code>[UNK]</code> トークンはありません。
      </p>
      <p>
        実際にうまく動かすための工夫がさらに 2 つあります。1 つ目に、テキストは<strong>事前トークン化</strong>されます。BPE を実行する前に、パターンによっておおまかなかたまり（先頭の空白付きの単語、数字、句読点）に分けるので、マージがある単語の末尾と次の単語の先頭をくっつけることはありません。
        2 つ目に、空白は後ろの単語の一部として扱われます。GPT 系のトークンが <code>·the</code> のような形になるのはそのためです。GPT-2、RoBERTa、GPT-3/GPT-4 系のトークナイザーは、どれもバイトレベル BPE を使っています。
      </p>

      <h2>3 つを並べて比べる</h2>
      <Fig caption="3 つのアルゴリズムのまとめです。実際のトークナイザーは、特殊トークン、正規化、事前トークン化のルールなどの細部をさらに加えています。">
        <div className={s.tableWrap}>
          <table className={`${s.tbl} ${s.compare}`}>
            <thead>
              <tr><th scope="col"></th><th scope="col">BPE</th><th scope="col">WordPiece</th><th scope="col">Unigram</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">学習</th><td>育てる：最も多いペアをマージ</td><td>育てる：スコアが最も高いペアをマージ</td><td>縮める：最も役に立たない断片を刈り込む</td></tr>
              <tr><th scope="row">トークン化</th><td>マージを順番どおりに再生</td><td>左から右へ最長一致</td><td>最も確率の高い分割</td></tr>
              <tr><th scope="row">未知のテキスト</th><td>バイトレベル：未知は決してない</td><td>単語ごと <code>[UNK]</code></td><td>1 文字ずつ。見たことのない文字は、バイトフォールバックがオンでなければ <code>&lt;unk&gt;</code></td></tr>
              <tr><th scope="row">使用例</th><td>GPT-2、RoBERTa、GPT-4（バイトレベル）、LLaMA（SentencePiece 経由）</td><td>BERT、DistilBERT</td><td>T5、ALBERT、XLNet（SentencePiece 経由）</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>
      <Callout title="覚えておきたいこと">
        これらのアルゴリズムはどれも文法を知りません。<code>est</code> がトークンになったのは、接尾辞だからではなく、コーパスによく出てきたからです。学習テキストを変えれば、違う語彙ができます。
      </Callout>
      <p>
        この最後の点は、実際に影響があります。主に英語で学習したトークナイザーは、他の言語をより多くの小さな断片に分割するので、処理が遅くなり、コストも高くなります。<ArticleLink slug="why-emoji-cost-more-tokens">絵文字や一部の言語でトークンが多くかかる理由</ArticleLink>をご覧ください。
        テキストがトークンになると、各トークン ID はベクトルに変えられます。これについては<ArticleLink slug="what-are-embeddings">埋め込みとは何か？</ArticleLink>で説明しています。
        <Link href="/tokenizer">トークナイザー</Link>では、自分のテキストで複数の本物の BPE トークナイザーの分割を比べられます。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM Course", note: "6 節と 7 節で WordPiece と Unigram を扱っています（英語）" },
  { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · 動画", note: "バイトレベル BPE をゼロから作ります" },
  { href: "https://arxiv.org/abs/1508.07909", title: "Neural Machine Translation of Rare Words with Subword Units", source: "Sennrich, Haddow & Birch · arXiv" },
  { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "バイトペア符号化（BPE）とは何ですか？", a: "バイトペア符号化は、データからトークナイザーの語彙を作る方法です。1 文字または 1 バイトから始め、学習テキストで最もよく現れる隣り合うペアを見つけて新しいトークンにマージし、語彙が目標の大きさになるまで繰り返します。GPT のモデルは、バイトレベル版の BPE を使っています。" },
  { q: "BPE、WordPiece、Unigram の違いは何ですか？", a: "BPE は最もよく現れる断片のペアをマージします。BERT が使う WordPiece は、学習テキストの尤度を最も高めるペアをマージするので、意外なほど一緒に現れるペアが選ばれやすくなります。T5 などのモデルで SentencePiece を通して使われる Unigram は、大きな語彙から始め、最も影響の小さい断片を取り除いていきます。" },
  { q: "GPT-4 はどのトークナイザーを使っていますか？", a: "GPT-4 と GPT-3.5 は、約 100,000 トークンのバイトレベル BPE トークナイザーである cl100k_base を使っています。GPT-4o は約 200,000 トークンの o200k_base を使い、英語以外の多くの言語をより効率よく扱えます。どちらも OpenAI のオープンソースライブラリ tiktoken で使えます。" },
  { q: "トークナイザーが未知のテキストで失敗することはありますか？", a: "バイトレベルのトークナイザーなら失敗しません。256 通りのバイト値がすべて語彙に入っているので、より大きな断片が一致しなくても、絵文字や珍しい文字体系を含むどんなテキストも 1 バイトずつ書き表せます。単語単位のトークナイザーや一部の文字単位のトークナイザーは、見たことのない入力を未知トークンに置き換えてしまいます。" },
];
