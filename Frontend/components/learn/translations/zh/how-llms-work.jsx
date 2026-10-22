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
        你输入 <em>“The cat sat on the”</em>（猫坐在……上），聊天机器人接上一个 <em>“mat”</em>（垫子）。感觉就像模型读懂了你的句子、想了想，然后作答。
        实际发生的，是一串固定的简单步骤：把文本变成数字，对这些数字做算术，再把结果变回文本。
        本文从头到尾把这条链路走一遍，不需要任何数学基础。
      </p>
      <p>
        <strong>语言模型</strong>是一个经过训练、用来续写文本的程序。<strong>大</strong>语言模型（LLM）是同一个想法放大到极致：
        数十亿个可调的数字，用人类写下的大量文本训练而成。下面的内容适用于 ChatGPT、Claude、Gemini 或 Llama 背后的模型。
      </p>
      <Callout title="一句话总结">
        语言模型把你的文本切成词元（token），把每个词元变成一串数字，让这些数字串在许多层中交换信息，
        然后给每一个可能的下一个词元打分，选出一个，加到文本末尾，再重复。
      </Callout>

      <h2>LLM 的完整流程（简化版）</h2>
      <figure className={h.wide}>
        <PipelineFigure />
        <figcaption>对“The cat sat on the”跑一遍得到“ mat”，再跑第二遍加上“.”。词元 ID 是真实的（o200k_base 分词器，GPT-4o 使用）。向量、注意力权重、层数、分数和概率都是示意，并非取自真实模型。</figcaption>
      </figure>
      <p>文章接下来把这些步骤一个一个拆开讲。</p>

      <h2>1. 文本变成词元</h2>
      <p>
        模型没法直接处理字母，所以第一步是<strong>分词器</strong>：一个独立的程序，把文本切成叫作<strong>词元</strong>的小块。
        一个词元常常是一个完整的常见词，有时是词的一部分、一个标点或一个空格。罕见的词由几个更小的块拼成。
      </p>
      <Fig caption="o200k_base 分词器对同一个词的两种切法。在文本最开头它很少见，所以由三块拼成。跟在空格后面（它通常的样子）时，它常见到足以成为一个词元。圆点表示空格。">
        <Chips label="“unbelievable”在文本开头 · 3 个词元" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="“ unbelievable”在空格之后 · 1 个词元" items={[["·unbelievable"]]} />
      </Fig>
      <p>
        为什么用小块而不是字母或整词，这本身就是一个故事：参见<ArticleLink slug="why-tokens">为什么模型读的是词元，而不是字母或单词</ArticleLink>，
        以及挑选这些小块的算法：<ArticleLink slug="tokenization-algorithms">分词器是怎样构建的</ArticleLink>。
      </p>

      <h2>2. 词元变成 ID 数字</h2>
      <p>
        每个分词器都有一份固定的<strong>词表</strong>：它认识的所有小块组成的编号列表。<code>o200k_base</code> 的词表大约有 200,000 项。
        每个词元都被替换成它在列表中的编号，也就是<strong>词元 ID</strong>。我们的句子变成了 <code>976 9059 10139 402 290</code>。
      </p>
      <p>
        这些数字只是列表里的位置，就像座位号。词元 9059（<code>·cat</code>）并不在任何有用的意义上比词元 402（<code>·on</code>）“更大”或“更多”。
        模型需要更丰富的东西来处理。
      </p>

      <h2>3. ID 变成向量</h2>
      <p>
        模型内部有一张巨大的表，词表里每一项占一行。每一行是一个<strong>向量</strong>：一串数字，在大模型里通常有几千个。
        查出一个词元对应的那一行，就得到它的<strong>嵌入</strong>。这些数字没有人手写。它们一开始是随机的，在训练中不断调整，
        直到用法相似的词元拥有相似的行。
      </p>
      <Fig caption="把嵌入表看作查找表：每个词元 ID 选中一行。颜色代表数字（青色为正，红色为负）。仅为示意：几千列中只画了 8 列，数值也是编的。">
        <div className={h.table} role="img" aria-label="一张嵌入表：词元 ID 290、402、976、9059 和 10139 各占一行，每行八个彩色格子。9059（·cat）这一行被高亮。">
          <p className={h.sub}>行 = 词元 ID · 列 = 向量中的数字</p>
          <Gap />
          {TABLE_ROWS.map(([id, t]) => (
            <div key={id}>
              <Cells label={`${id} ${t}`} values={vec(id)} hit={id === 9059} />
              <Gap />
            </div>
          ))}
          <Gap>总共约 200,000 行</Gap>
        </div>
      </Fig>
      <p>
        “意义就是数字空间中的位置”这个想法，是<ArticleLink slug="what-are-embeddings">什么是嵌入</ArticleLink>的核心；
        <ArticleLink slug="latent-space">潜在空间</ArticleLink>则探讨这个空间里的方向能捕捉到什么。
      </p>

      <h2>4. Transformer：词元彼此相看</h2>
      <p>
        到这一步，每个向量只描述它自己那个词元。“bank”这个词在“river bank”（河岸）和“bank account”（银行账户）里拿到的初始向量完全一样。
        模型的主体 <strong>Transformer</strong> 负责解决这个问题。它是一摞看起来一模一样的<strong>层</strong>，大模型里有几十层。
      </p>
      <p>
        每一层做两件事。首先是<strong>注意力</strong>：每个词元回头看它前面的词元，判断哪些对自己重要，并从中混入信息。
        然后一个小型神经网络分别更新每个向量。经过许多层之后，每个向量描述的就是<em>处在上下文中</em>的那个词元。
      </p>
      <Fig caption="同一个词元“·bank”在两个句子里以完全相同的向量进入各层。注意力混入周围的词之后，两个向量变得不同。示意数值。">
        <div className={l.pair} role="img" aria-label="两个句子，river bank（河岸）和 bank account（银行账户）。进入各层之前两个 bank 向量完全相同；经过各层之后它们不同了。">
          {[["I sat by the river bank（我坐在河岸边）", 11], ["I opened a bank account（我开了一个银行账户）", 29]].map(([sentence, seed]) => (
            <div key={seed} className={h.table}>
              <h3>{sentence}</h3>
              <Cells label="·bank 输入" values={vec(4101)} />
              <Cells label="·bank 输出" values={vec(4101 * seed)} />
            </div>
          ))}
        </div>
      </Fig>
      <p>
        注意力是让现代语言模型表现如此出色的关键想法。<ArticleLink slug="attention-and-transformers">从零讲清注意力机制与 Transformer</ArticleLink>一文会一步一步完整讲解它。
      </p>

      <h2>5. 只有最后一个位置负责预测</h2>
      <p>
        最后一层之后，每个词元仍然各有一个向量。为了选出下一个词元，模型只用<strong>最后一个位置</strong>的向量，在我们的例子里就是 <code>·the</code> 的那个。
        因为注意力让它从前面每个词元收集了信息，这一个向量现在承载着模型对整句话的理解。
      </p>

      <h2>6. 每个词元一个分数：logits</h2>
      <p>
        最后这个向量会和词表中的每一项做比较，为每个词元算出一个分数：大约 200,000 个数字。
        这些原始分数叫作 <strong>logits</strong>。logit 越高，说明模型认为这个词元越适合接在后面。单看 logits 很难读懂：
        它们可以是负数，加起来也不等于什么特定的值。
      </p>

      <h2>7. 分数变成概率：softmax</h2>
      <p>
        一个叫作 <strong>softmax</strong> 的函数把 logits 变成<strong>概率</strong>。它让每个值都变成正数，并缩放到总和为 100%。
        logit 越大，分到的份额就大得多，因为 softmax 会对每个分数取指数：logit 高 2 分，概率大约高 7 倍。
      </p>
      <Fig caption="在“The cat sat on the”之后最可能的五个词元的 logits，以及 softmax 由它们算出的概率。示意数字，但彼此一致；其余约 200,000 个词元分掉剩下的 27%。">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>下一个词元</th><th>logit</th><th>概率</th></tr></thead>
            <tbody>
              {PROBS.map(([t, p]) => (
                <tr key={t}><td>{t}</td><td>{(Math.log(p) + 10).toFixed(1)}</td><td>{Math.round(p * 100)}%</td></tr>
              ))}
              <tr><td>其余所有词元</td><td>更低</td><td>27%</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>8. 选出一个词元</h2>
      <p>
        现在模型为每个词元都给出了概率，接下来得有东西来做选择。最简单的规则是<strong>贪心解码</strong>，总是取排名第一的那个。
        大多数聊天系统则是<strong>采样</strong>：按概率加权随机抽取，所以同一个提示词可能得到不同的回答。
      </p>
      <p>
        一些设置会影响这次抽取。<strong>top-k</strong> 采样只保留最可能的 k 个词元，把它们重新缩放到 100% 再抽，这样极不可能的词元永远不会出现。
        <strong>温度</strong>让概率分布更尖锐或更平坦。<ArticleLink slug="next-token-prediction">从最后一个向量到下一个词</ArticleLink>用交互示例逐一演示了这些设置。
      </p>

      <h2>9. 追加，然后重复</h2>
      <p>
        选中的词元 <code>·mat</code>（ID 2450）被加到文本末尾。然后<em>整条</em>流程在更长的文本上再跑一遍，选出再下一个词元，
        之后再跑一遍。一段 300 个词元的回复就是 300 遍。正是这个循环让回答在屏幕上一个词一个词地冒出来。
      </p>
      <Fig caption="每一遍都读入目前为止的全部内容，并添加一个词元。当模型生成一个特殊的文本结束词元，或达到长度上限时，循环停止。">
        <div className={h.growth}>
          <Chips label="第 1 遍读入 5 个词元 → 添加 ·mat" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"]]} />
          <Chips label="第 2 遍读入 6 个词元 → 添加 ." items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"]]} />
          <Chips label="第 3 遍读入 7 个词元 → …" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"], ["."]]} />
        </div>
      </Fig>
      <p>
        实际系统会把已经处理过的词元的中间结果存下来，避免每一遍都重做全部工作，但逻辑是一样的：
        跑一遍，得到一个新词元。
      </p>

      <h2>这些数字从哪里来</h2>
      <p>
        模型用到的每一个数字，无论是嵌入表、注意力层还是最后的打分，都是在训练中学到的<strong>参数</strong>。
        训练时给模型看海量文本，让它预测每一个下一个词元，然后把所有参数都轻轻推一下，让真正的下一个词元变得更可能一点。
        在数万亿个词元上重复下去，这些微调累积成一个擅长续写文本的模型。聊天助手还会在对话数据上进一步训练，让它的续写读起来像有用的回答。
      </p>

      <h2>常见误解</h2>
      <ul>
        <li>
          <strong>“它一次写出整个回答。”</strong>并不是。它只预测一个词元，加上去，再跑一遍。
          它没有事先写好的答案在等着；每个词元都只根据目前为止的文本来选。
        </li>
        <li>
          <strong>“它是在查答案。”</strong>它内部没有问答数据库。只有一组固定的、学来的参数，
          每次的答案都是用它们重新算出来的。这也是为什么模型会信心十足地说出错误的内容：没有任何东西拿结果去和来源核对。
        </li>
        <li>
          <strong>“它像人一样理解。”</strong>模型拥有的是从文本中学到的统计规律，丰富到足以捕捉语法、事实和一定的推理。
          这算不算理解还有争议。可以肯定的是，它是从文本中学习的，而不是通过观看、触摸或生活在这个世界中。
        </li>
      </ul>

      <h2>接下来读什么</h2>
      <p>
        上面每一步都有专门的文章：<ArticleLink slug="why-tokens">词元</ArticleLink>、<ArticleLink slug="tokenization-algorithms">分词器</ArticleLink>、
        <ArticleLink slug="what-are-embeddings">嵌入</ArticleLink>、<ArticleLink slug="latent-space">潜在空间</ArticleLink>、
        <ArticleLink slug="attention-and-transformers">注意力</ArticleLink>和<ArticleLink slug="next-token-prediction">选择下一个词元</ArticleLink>。
        在本站，你可以用<Link href="/tokenizer">分词器</Link>切分自己的文本，也可以在<Link href="/embedding">词嵌入浏览器</Link>中探索词向量。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.youtube.com/watch?v=wjZofJX0v4M", title: "But what is a GPT? Visual intro to transformers", source: "3Blue1Brown，YouTube", note: "对整条流程最好的可视化讲解（现标题为“Transformers, the tech behind LLMs”）" },
  { href: "https://jalammar.github.io/illustrated-gpt2/", title: "The Illustrated GPT-2", source: "Jay Alammar", note: "把同一条流程一步步画出来，并深入一层" },
  { href: "https://bbycroft.net/llm", title: "LLM Visualization", source: "Brendan Bycroft", note: "以 3D 方式走遍一个小型真实 GPT 里的每一个数字" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "大语言模型是怎么生成文字的？", a: "它把你的文本切成词元，把每个词元 ID 变成一个向量，再让这些向量经过 Transformer。最后一个位置的输出变成词表中每个词元的分数。softmax 把分数变成概率，选出一个词元追加到文本末尾，然后循环往复，直到回答完成。" },
  { q: "ChatGPT 真的理解自己在说什么吗？", a: "它不像人那样阅读或思考。它从海量文本中学到了哪些词元往往跟在哪些词元后面，这些规律涵盖了大量语法、事实和推理。这算不算理解还有争议，但从机制上说，每一条回复都是一次预测一个词元拼出来的。" },
  { q: "为什么同一个问题，AI 每次回答都不一样？", a: "在每一步，模型给出的是一组概率，而不是一个固定答案，大多数聊天应用会按这些概率采样，而不是总取排名第一的词元。温度和 top-p 等设置控制允许多少随机性。关闭采样后，同一个模型、同一个提示词会给出相同的输出。" },
  { q: "语言模型的知识是从哪里来的？", a: "来自训练。模型阅读一个非常庞大的文本集合，并调整数十亿个数字（也就是它的参数），以便更好地预测下一个词元。事实以隐含的方式存储在这些数字里。回答时它不会去查任何东西，除非外层应用额外加入了搜索或检索步骤。" },
];
