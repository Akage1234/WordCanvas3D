import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Chips, Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import { Link } from "@/i18n/navigation";
import s from "@/components/learn/learn.module.css";

const [RED, TEAL, , YELLOW] = CLUSTER_COLORS;

// Same data as the English guide (guides.jsx), with translated language names.
const GREETINGS = [
  ["英语", "Hello, world.", 4, 4, 4],
  ["阿拉伯语", "مرحباً بالعالم.", 15, 13, 6],
  ["印地语", "नमस्ते दुनिया।", 25, 15, 6],
  ["日语", "こんにちは世界。", 11, 5, 3],
];
const ENCODERS = [["gpt2", RED], ["cl100k_base", YELLOW], ["o200k_base", TEAL]];

export default function EmojiAndLanguages() {
  return (
    <>
      <p>
        在分词器里输入“Hello, world.”，你会得到 4 个词元（token）。用印地语输入同样的问候，根据分词器的不同，你可能得到 6 到 25 个。
        表情符号也类似：一个 🎉 可能占两个、三个甚至更多词元。这一切都不是随机的。它来自文本以字节形式存储的方式，以及分词器在训练中见过什么。
      </p>

      <h2>一切都从字节开始</h2>
      <p>
        计算机用一种编码来存储文本，这是一条把每个字符变成<strong>字节</strong>的固定规则（一个字节是 0 到 255 之间的一个小数字，是计算机内存的基本单位）。
        如今几乎所有东西都使用 <strong>UTF-8</strong>，它给每个字符分配 1 到 4 个字节：
      </p>
      <ul>
        <li>基本拉丁字母、数字和标点：每个 1 字节。</li>
        <li>阿拉伯文、希伯来文、希腊文和西里尔文字母：每个 2 字节。</li>
        <li>天城文（用于印地语）、中文和日文字符：每个 3 字节。</li>
        <li>大多数表情符号：每个 4 字节。</li>
      </ul>
      <p>
        你可以在分词器中看到这一点：输入框下方会显示<strong>码位</strong>数（Unicode 标准中编了号的字符，大致就是字符数）和 <strong>UTF-8 字节</strong>数。
        “Hello, world.”是 13 个字符、13 个字节。印地语的“नमस्ते दुनिया।”是 14 个码位，却有 40 个字节。
      </p>

      <h2>合并跟着训练数据走</h2>
      <p>
        GPT 分词器是<em>字节级</em>的 BPE 分词器。它们从单个字节出发，从一大堆训练文本中学习合并，保留出现最频繁的那些组合。
        （第一篇指南<Link href="/learn/what-is-a-token">什么是词元</Link>给出了简短版本；
        <ArticleLink slug="tokenization-algorithms">分词器是怎样构建的</ArticleLink>则一步步讲解了合并过程。）
      </p>
      <p>
        如果训练文本大部分是英语，大多数合并最终都会是英语单词和单词片段。其他文字得到的合并较少，所以它们的文本仍然被切成更小的块。
        最坏的情况下，单个字符会被拆到几个词元里，因为它的字节从来没有被合并到一起。
      </p>
      <Fig caption="同一句问候的词元数，与本站分词器中显示的一致。每个短语都包括句末的标点。">
        <div className={s.legend}>
          {ENCODERS.map(([name, color]) => <span key={name} style={{ "--tc": color }}>{name}</span>)}
        </div>
        <dl className={s.bars}>
          {GREETINGS.map(([lang, text, ...counts]) => (
            <div key={lang} style={{ display: "contents" }}>
              <dt title={text}>{lang}</dt>
              <dd>
                {counts.map((n, i) => (
                  <span key={i} className={s.bar} style={{ "--tc": ENCODERS[i][1], "--n": n }}>
                    <i />{n}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Fig>
      <p>
        有两点很突出。第一，英语在哪里都是同样的 4 个词元，因为这几份词表早就学会了 <code>Hello</code>、<code>,</code> 和 <code>·world</code>。
        第二，较新的 <code>o200k_base</code> 处理其他文字要好得多。它的词表大约是 <code>cl100k_base</code> 的两倍，
        多出来的条目包括更多非英语文本的片段。<code>世界</code>（日语里的“世界”）在 <code>o200k_base</code> 中是一个词元，而 <code>cl100k_base</code> 需要三个，把 <code>世</code> 拆成了原始字节。
      </p>

      <h2>表情符号：好几个字节，有时还是好几个字符</h2>
      <p>
        🎉 这个表情符号是一个字符，存储为四个字节：<code>F0 9F 8E 89</code>。如果分词器没有把这些字节合并成一块，就得花好几个词元来表示它。
        分词器把只占一个字符一部分的片段显示为十六进制字节，这样你就能准确看到在哪里切开的。
      </p>
      <Fig caption="🎉 的四个字节，以及两个分词器如何给它们分组。每个小块下面的数字是词元 ID。">
        <Chips label="cl100k_base · 3 个词元" items={[["F0 9F", 9468], ["8E", 236], ["89", 231]]} />
        <Chips label="o200k_base · 2 个词元" items={[["F0 9F 8E", 71344], ["89", 231]]} />
        <Chips label="o200k_base 中的 👍 · 1 个词元" items={[["👍", 82514]]} />
      </Fig>
      <p>
        像 👍 和 ✅ 这样流行的表情符号在 <code>o200k_base</code> 中是单个词元，而在 <code>cl100k_base</code> 中仍然要占两到三个。
      </p>
      <p>
        有些表情符号甚至不止一个字符。🛠️ 是锤子和扳手符号，再加上一个看不见的<strong>变体选择符</strong>，用来要求彩色的表情符号样式。
        这在两个 GPT-4 时代的分词器中都是 4 个词元。像 👨‍👩‍👧 这样的家庭表情符号，是几个人用看不见的“零宽连接符”粘在一起的：
        5 个码位、18 个字节，在 <code>o200k_base</code> 中是 8 个词元，而看起来只是一个符号。
      </p>

      <h2>为什么词元数很重要</h2>
      <ul>
        <li><strong>成本。</strong>许多 AI API 按词元收费，所以同样一条消息，用一种语言可能比用另一种语言更贵。</li>
        <li><strong>上下文。</strong>模型的上下文窗口是一份词元预算。需要更多词元的文本会更快把它填满。</li>
        <li><strong>速度。</strong>模型一次生成一个词元，所以需要更多词元的回复写得更慢。</li>
      </ul>
      <p>
        这也是分词器的更换很重要的原因。从 <code>cl100k_base</code> 换到 <code>o200k_base</code>，上面那句印地语问候从 15 个词元降到了 6 个，文本一个字都没改。
      </p>

      <h2>实用要点</h2>
      <ul>
        <li><strong>用对的分词器来数。</strong>同样的文本在不同的词表中计数不同，所以一个模型的计数不能套用到另一个模型上。</li>
        <li><strong>装饰不是免费的。</strong>提示词中的表情符号、制表符和花哨的符号，每个都可能花掉好几个词元，却几乎不增加意义。</li>
        <li><strong>没有什么是“未知”的。</strong>由于字节级分词器总能退回到单个字节，任何文本都能被编码。罕见的文本不会被拒绝，只是比较贵。</li>
      </ul>

      <h2>试一试</h2>
      <p>
        分词器有两个专为本文准备的预设：<strong>多种文字</strong>和<strong>表情符号</strong>。
        加载其中一个，然后在各分词器之间切换，看看词元数如何变化。也打开 LLaMA 分词器看看：对这些文字它大约每个字符用一个词元，
        对大多数表情符号则退回到原始字节。
      </p>
    </>
  );
}

export const faq = [
  { q: "为什么表情符号要用这么多 token？", a: "大多数表情符号在 UTF-8 中占四个字节，有些还是几个表情符号拼在一起的，比如肤色或家庭表情符号。罕见的表情符号没有自己的词元，所以字节级分词器会把它们拆成字节片段写出来。一个表情符号可能花掉一个到十几个词元。" },
  { q: "为什么非英语的语言更费 token？", a: "分词器从训练文本中学习片段，而训练文本往往以英语为主，所以英语单词能得到又长又高效的词元。出现较少的文字，或者在 UTF-8 中每个字符需要更多字节的文字，会被切成更小的块。同一句话用印地语、泰语或缅甸语写，可能比英语多用好几倍的词元。" },
  { q: "新的分词器能消除语言之间的差距吗？", a: "能缩小一部分。在更多多语言文本上训练的更大词表，比如 GPT-4o 使用的 o200k_base，与 cl100k_base 等较旧的分词器相比，减少了许多语言的词元数。差距缩小了，但没有消失，因为各语言的训练数据仍然不均衡。" },
  { q: "用的 token 越多，花的钱就越多吗？", a: "对大多数 AI API 来说是的。价格按输入和输出的词元收取，上下文窗口也按词元计量，所以切成更多片段的文本花费更多，也更快填满上下文窗口。" },
];
