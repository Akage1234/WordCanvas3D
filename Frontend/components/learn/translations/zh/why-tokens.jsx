import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/why-tokens.module.css";
import { ThreeWaySplit } from "./why-tokens.figures";

const [RED, TEAL, , YELLOW] = CLUSTER_COLORS;

// Counts for the Austen sentence below: characters and words counted directly, tokens with o200k_base.
const LENGTHS = [["字符", 117, RED], ["单词", 23, TEAL], ["词元（o200k_base）", 26, YELLOW]];

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
        语言模型是一个做算术的程序。它没法直接读你屏幕上的文字。
        在对你的文本做任何事之前，得先把文本切成小单位，再把每个单位换成一个数字。
        这些单位叫作<strong>词元</strong>（token），切分的过程叫作<strong>分词</strong>。
      </p>
      <p>
        显而易见的问题是：一个单位应该多大？一个字母？一个完整的单词？所有现代模型给出的答案都是“介于两者之间”，本文解释其中的原因。
        归根结底，这是一个权衡：允许多少种不同的单位，和写一句话需要多少个单位。
      </p>

      <h2>两个相互拉扯的数字</h2>
      <p>
        无论选择什么单位，结果都可以用两个数字来描述。
      </p>
      <ul>
        <li>
          <strong>词表</strong>是模型认识的所有单位组成的固定列表。每一项都有一个 ID，模型要为每一项单独学习一组数字。
          词表越大，要学习和存储的东西就越多。
        </li>
        <li>
          <strong>序列长度</strong>是写出某段文本需要多少个单位。序列越长，模型每次读或写的工作量就越大。
        </li>
      </ul>
      <p>
        单位小，词表就小，但序列长。单位大，序列短，但词表巨大。在下面试试：同一段文本，三种切法。
      </p>
      <Fig caption="同一段文本分别切成字符、单词（以空格为界）以及 o200k_base（GPT-4o 使用的分词器）的子词词元。示例是预先算好的；输入你自己的文本时，会在浏览器中加载真实的分词器。· 表示空格，<F0 9F> 这类标签是原始字节，只是一个字符的一部分。">
        <ThreeWaySplit />
      </Fig>
      <p>
        看几个例子。字符总是最长的一行。对英语来说单词是最短的一行，但碰到日语就不行了：日语书写时不加空格，
        所以整句话变成了一个“单词”。子词这一行的长度和单词那一行接近，却能应付每一个例子。
      </p>

      <h2>方案一：字符</h2>
      <p>
        每个字符一个词元确实有吸引力。词表很小，而且永远够用：任何文本都只是一串字符，所以模型永远不会遇到写不出来的东西。
      </p>
      <p>
        问题在于长度。单个字符本身携带的意义很少。字母 <code>t</code> 几乎什么也没告诉模型，所以模型得先花力气把字母重新拼成单词，才能去思考它们的意思。
        而且每段文本都会比实际需要的长好几倍。
      </p>
      <p>
        长度之所以重要，有两个具体原因。第一是计算量：在 <ArticleLink slug="attention-and-transformers">Transformer</ArticleLink> 中，每个词元都要看其他每一个词元，
        所以这部分工作量随长度的平方增长。长度翻倍，这部分的开销大约变成四倍。
        第二，<strong>上下文窗口</strong>，也就是模型一次能接收的最大词元数，是一个固定的预算。每个词元装的文本越少，你的文档能放进去的就越少。
      </p>
      <Fig caption="同一句话（《傲慢与偏见》的开篇第一句）的三种度量方式。字符数和单词数是精确值；词元数来自 o200k_base 分词器。">
        <p className={s.quote}>“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”（凡是有钱的单身汉，总想娶位太太，这已经成了一条举世公认的真理。）</p>
        <dl className={s.bars}>
          {LENGTHS.map(([name, n, c]) => (
            <div key={name} style={{ display: "contents" }}>
              <dt>{name}</dt>
              <dd style={{ "--tc": c }}><i style={{ "--w": `${(n / 117) * 85}%` }} />{n}</dd>
            </div>
          ))}
        </dl>
      </Fig>

      <h2>方案二：完整的单词</h2>
      <p>
        完整的单词解决了长度问题：在英语中，词元数接近单词数。每个单位也都有意义。但会冒出三个问题。
      </p>
      <ul>
        <li>
          <strong>词表会爆炸。</strong>算上复数、时态和复合词（<code>run</code>、<code>runs</code>、<code>running</code>、<code>rerun</code>……），光是英语就有几十万种词形。
          再加上人名、数字、拼写错误、话题标签、代码和其他语言，任何列表都不可能完整。
        </li>
        <li>
          <strong>未知词。</strong>列表里没有的东西，都只能用一个兜底的词元代替，通常写作 <code>[UNK]</code>。
          在模型看来每个未知词都一模一样，它们的意思就这样丢掉了。
        </li>
        <li>
          <strong>并非所有语言都用空格。</strong>中文、日语和泰语的词与词之间不加空格，所以“按空格切分”连什么是一个词都定义不了。
        </li>
      </ul>
      <p>
        罕见词还会带来一个不那么显眼的问题。一个在训练文本中只出现过寥寥几次的词，也会在词表里占一项，但模型见到的例子太少，学不到多少关于它的东西。
      </p>
      <Fig caption="上一行（示意）：一个只用英语文本训练的单词级分词器，会怎样处理一句德语和一个表情符号。凡是它没见过的，都变成同一个 [UNK] 词元。下一行（真实）：同一段文本的 o200k_base 子词词元；什么都没丢。">
        <Chips label="单词级、仅英语词表（示意）" items={[["[UNK]", "Grüße"], ["[UNK]", "aus"], ["[UNK]", "München!"], ["[UNK]", "🦒"]]} />
        <Chips label="子词词元，o200k_base（真实）" items={["Gr", "ü", "ße", "·aus", "·München", "!", "·<F0 9F>", "<A6>", "<92>"]} />
      </Fig>

      <h2>折中方案：子词</h2>
      <p>
        子词分词取了两种方案各自有用的那一半。常见词，以及前面带空格的常见词，各自拥有一个独立的词元，所以日常英语依然很短。
        罕见词则由几个本身很常见的小块拼写出来：在上面的例子里，<code>Tokenizers</code> 变成了 <code>Token</code> + <code>izers</code>。
        这些小块可以重复使用，所以模型能从许多不同的词中学到 <code>izers</code> 通常是什么意思。
      </p>
      <p>
        词表大小保持在模型负担得起的范围内。GPT-2 的分词器大约有 50,000 项，GPT-4 使用的 <code>cl100k_base</code> 分词器大约有 100,000 项，<code>o200k_base</code> 大约有 200,000 项。
        听起来很大，但它是固定、有限的，不像“所有单词的列表”那样没有尽头。
      </p>
      <Callout title="一句话总结">
        子词词元让序列几乎和单词一样短，同时永远不会碰到写不出来的词。
      </Callout>
      <p>
        哪些小块能进入列表，并不是由语言学家决定的。分词器从大量文本样本中学习它们，保留出现最频繁的片段。
        这就是为什么词元很少和词典里的音节或前缀对得上。这种学习是怎么进行的，正是<ArticleLink slug="tokenization-algorithms">分词器是怎样构建的</ArticleLink>一文的主题。
      </p>

      <h2>字节：安全网</h2>
      <p>
        还剩一个问题：如果连最小的小块都没有呢？Unicode 是涵盖世界各种书写系统和表情符号的标准，其中有远超 100,000 个字符。
        把它们全部放进词表，会在几乎从不出现的字符上浪费空间。
      </p>
      <p>
        GPT 系列分词器用的技巧是改为处理<strong>字节</strong>。计算机用一种叫 UTF-8 的编码把文本存成字节：一个普通的英文字母占 1 个字节，
        像 <code>ü</code> 这样带变音符号的字母占 2 个，大多数表情符号占 4 个。字节只有 256 种可能的取值，所以只要这 256 个都在词表里，任何文本都能写出来，必要时一次写一个字节。
      </p>
      <p>
        在德语的例子里就能看到这一点。长颈鹿表情符号 🦒 很少见，所以没有一个单独的词元对应它。它被拆成原始字节：一个词元包含空格加上前两个字节 <code>F0 9F</code>，
        然后是 <code>A6</code>，再然后是 <code>92</code>。这些小块单独看都不是字符，但合在一起能准确地还原这个表情符号。
        没有什么是未知的；罕见的东西只是要多花几个词元。（<ArticleLink slug="why-emoji-cost-more-tokens">为什么表情符号和其他语言更费词元</ArticleLink>会详细讨论这一点。）
      </p>
      <p>
        有些分词器，比如最初的 LLaMA 模型使用的 SentencePiece 分词器，先按字符处理，只有遇到从未见过的字符时才退回到字节。效果是一样的：没有任何文本无法表示。
      </p>

      <h2>这在实际中意味着什么</h2>
      <ul>
        <li><strong>限制和价格都按词元计算。</strong>上下文窗口和大多数 API 的价格计算的是词元，而不是单词。对英语来说，一个常见的经验法则是一个词元约等于四分之三个单词，但随语言和内容的不同差别很大。</li>
        <li><strong>同一段文本的开销可能不同。</strong>不同的模型使用不同的分词器，所以同一句话在每个模型里的词元数可能都不一样。</li>
        <li><strong>模型看不到字母。</strong><code>·unbelievably</code> 是一个词元，只有一个 ID。模型从来不会直接看到它里面的字母，这也是拼写和数字母这类问题容易难倒模型的原因之一。</li>
      </ul>
      <p>
        文本变成词元 ID 列表之后，模型内部的下一步是把每个 ID 变成一串有意义的数字。这就是<ArticleLink slug="what-are-embeddings">嵌入</ArticleLink>背后的思想；
        <ArticleLink slug="how-llms-work">语言模型如何把你的话变成回答</ArticleLink>则展示了这两步在整条流程中的位置。
        想用几个真实的分词器并排切分你自己的文本，可以试试<Link href="/tokenizer">分词器</Link>。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM 课程", note: "第 6 章深入讲解分词器" },
  { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · 视频" },
  { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "AI 里的 token（词元）是什么？", a: "词元是语言模型当作一个单位来处理的一小段文本：一个完整的常见词、一个罕见词的一部分、一个标点或单个字节。每个词元在模型的词表里都有一个 ID 编号，模型自始至终只处理这些数字，从不直接处理文字。" },
  { q: "1,000 个 token 大约是多少字？", a: "对普通英文文本来说，大约是 750 个单词：常见的经验法则是一个词元约等于四分之三个单词。这个比例会随分词器、语言和内容而变化。代码、数字、表情符号以及英语以外的语言，通常每个词需要更多词元。" },
  { q: "语言模型为什么不直接用完整的单词作为词元？", a: "单词列表永远不可能完整。人名、拼写错误、新词、代码和其他语言都会变成同一个未知词元，失去原本的意思；而且像中文和日语这样的语言，词与词之间不加空格。子词词元把常见词保留为整体，同时用更小、可复用的小块拼写出罕见词。" },
  { q: "为什么 AI 数不清一个单词里有几个字母？", a: "模型看到的是词元 ID，而不是字母。像“strawberry”这样的词可能只是一两个词元，每个词元就是一个数字，所以单个字母并不直接可见。模型必须从训练文本中学会每个词元的拼写，这让数字母和拼写类任务出人意料地容易出错。" },
];
