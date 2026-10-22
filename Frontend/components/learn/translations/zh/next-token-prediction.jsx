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
    ["最后一个向量", "768 个数字", <Strip key="v" values={VECTOR} color={TEAL} />],
    ["× 反嵌入", "768 × 50,257 的矩阵", null],
    ["logits", "50,257 个分数", <Strip key="l" values={LOGITS} color={YELLOW} />],
    ["softmax", "50,257 个概率", <Strip key="p" values={PROBS} color={PURPLE} />],
  ];
  return (
    <div className={s.pipe} role="img" aria-label="最后一个词元的向量（768 个数字）乘以一个 768 × 50,257 的反嵌入矩阵，得到 50,257 个 logits，softmax 再把它们变成 50,257 个概率。">
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
        语言模型把你的文本读成词元（token），把每个词元变成一个向量，再让这些向量穿过一摞 Transformer 块
        （<ArticleLink slug="attention-and-transformers">注意力机制与 Transformer</ArticleLink>讲解了这一部分）。到最后，每个词元都有一个精炼过的向量。
        但模型是要<em>写</em>出东西来的。本文跟随最后这一步：从一串数字到一个真正的下一个词，然后是再下一个，再下一个。
      </p>

      <h2>一个向量，一个问题</h2>
      <p>
        要预测接下来是什么，模型只需要<strong>最后一个</strong>词元的最终向量。多亏了注意力，这个向量已经从它前面的所有内容中收集好了所需的信息。
        在 GPT-2 最小的版本中，它有 768 个数字。
      </p>
      <p>
        模型的词表，也就是它认识的固定词元列表（参见<ArticleLink slug="why-tokens">为什么模型读的是词元</ArticleLink>），在 GPT-2 中有 50,257 项。
        现在的任务是给其中每一项打一个“接在后面有多合适”的分数。
      </p>

      <h2>从向量到分数：反嵌入</h2>
      <p>
        打分只需要一次乘法。模型有一张学到的大表，叫作<strong>反嵌入矩阵</strong>（unembedding，也叫输出层），词表中每个词元对应一列 768 个数字。
        把最后的向量乘以这个矩阵，就等于和每一列做<strong>点积</strong>：逐个数字相乘，再加起来。
        方向与这个向量相近的列会得到高分。
      </p>
      <p>
        结果是每个词元一个数字，总共 50,257 个。这些原始分数叫作 <strong>logits</strong>。它们可以是任意大小，也可以是负数；只有它们之间的差值才重要。
        在 GPT-2 中，反嵌入矩阵就是第一步里那张嵌入表，被重复使用了（这个技巧叫作权重共享）。许多较新的模型则保留两张独立的表。
      </p>
      <Fig caption="一个 GPT-2 大小的模型的最后一步。条形的形状只是装饰；尺寸（768 和 50,257）是 GPT-2 small 的真实数值。光是反嵌入矩阵就有 768 × 50,257 ≈ 3,860 万个数字。">
        <Pipeline />
      </Fig>

      <h2>从分数到概率：softmax</h2>
      <p>
        logits 很难直接使用。我们想要的是每个词元的<strong>概率</strong>：一个介于 0 和 1 之间的数，而且全部加起来等于 1。
        做这件事的函数就是 <strong>softmax</strong>。它对每个 logit 计算 <code>e</code> 的该 logit 次方（这会让每个数都变成正数，并拉大差距），然后除以总和。
      </p>
      <p>
        例如，logits 为 2.0、1.0 和 0.1 时，概率约为 65.9%、24.2% 和 9.9%。最大的 logit 赢得最多，但每一项都保留了一份。
        这份概率列表才是模型真正的输出：不是一个词，而是它接下来可能说出的每一个词上的<strong>概率分布</strong>。
      </p>

      <h2>选一个词：解码</h2>
      <p>
        把这个分布变成一个词元的过程叫作<strong>解码</strong>，有好几种做法。在下面试试。候选词和它们的 logits 是为了演示而编的，
        为了便于阅读，我们假装词表里只有这 12 个词。作用在它们上面的数学是货真价实的。
      </p>
      <Fig caption="“The cat sat on the”（猫坐在……上）之后那个词的示意 logits。移动滑块会精确地重新计算概率：先应用温度，再应用 top-k，然后是 top-p，最后把剩下的词重新缩放到总和 100%。被剔除的词会划上删除线。“采样一个词”会按显示的概率随机抽取一个词。">
        <SamplingPlayground />
      </Fig>
      <p>下面是每个控件的作用。</p>
      <ul>
        <li>
          <strong>贪心解码</strong>总是取最可能的那一个词元。把温度设为 0 就能看到：“mat”得到 100%，每次抽到的都一样。
          贪心解码结果可预测，但在长文本中往往会写出平淡、重复的内容。
        </li>
        <li>
          <strong>温度</strong>在 softmax 之前把每个 logit 除以一个数 T。小于 1 时差距变大，最受青睐的词会拿走更多概率。
          大于 1 时差距缩小，不太可能的词也有了真正的机会。它从不改变词的<em>顺序</em>，只改变概率集中的程度。
        </li>
        <li>
          <strong>top-k</strong> 只保留最可能的 k 个词元，其余的全部丢掉。它能防止模型从大词表的长尾中挑出极不可能的东西。
          它的弱点是 k 是固定的：有时只有两个词说得通，有时却有几百个。
        </li>
        <li>
          <strong>top-p</strong>，也叫<strong>核采样</strong>（nucleus sampling），保留概率加起来至少达到 p 的最小一组靠前的词元。模型有把握时，这组词很小；
          有很多词都合适时，它就会变大。在上面把 top-p 设为 0.50，只有“mat”和“floor”能留下来，因为“mat”单独占 41.3%，差一点不到一半。
        </li>
      </ul>
      <Fig caption="同样的 logits（2.0、1.0、0.1）在三种温度下经过 softmax 的结果。温度越低，分布越尖锐；温度越高，分布越平坦。">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>温度</th><th>logit 2.0</th><th>logit 1.0</th><th>logit 0.1</th></tr></thead>
            <tbody>
              {TEMPS.map(([t, ps]) => <tr key={t}><td>T = {t}</td>{ps.map((p) => <td key={p}>{p}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>为什么同一个问题会得到不同的回答</h2>
      <p>
        除非使用贪心解码，模型在每一个词元上都会随机抽取一次。一个概率 25% 的词，大约每四次会被选中一次。
        一旦选中了不同的词，后面的一切都是根据另一段文本来预测的，所以开头的小差别会逐渐变成完全不同的回答。
        这就是为什么同一个问题问聊天机器人两次，可能会得到两个不同的答复，也是温度这类设置存在的原因：它们让你在多样性和可预测性之间做取舍。
      </p>
      <Callout title="常见误解">
        低概率的词并不是“错误”的词，高概率的词也不是经过核实的事实。这些概率描述的是从训练数据中学到的、接下来往往会出现什么样的文本。
        模型可以非常自信，同时又是错的。
      </Callout>

      <h2>循环：追加，然后重复</h2>
      <p>
        模型跑一遍产生一个词元。要写出一句话，模型把选中的词元加到输入末尾，然后再跑一遍，预测再下一个词元。
        这叫作<strong>自回归</strong>生成：每一步都以自己之前的输出为输入。这也是回复会一个词一个词地出现在屏幕上的原因。
      </p>
      <Fig caption="生成循环的一次示意运行。每一步添加一个词元，再运行一次模型，直到它选中文本结束词元。">
        <div className={s.loop}>
          <Row label="第 1 步" words={["The", "cat", "sat", "on", "the"]} next="mat" />
          <Row label="第 2 步" words={["The", "cat", "sat", "on", "the", "mat"]} next="." />
          <Row label="第 3 步" words={["The", "cat", "sat", "on", "the", "mat", "."]} next="<|endoftext|>" stop />
        </div>
      </Fig>
      <p>生成会以下面两种方式之一停止：</p>
      <ul>
        <li>
          <strong>序列结束词元。</strong>词表中有一个特殊词元，意思是“这段文本结束了”。在 GPT-2 中它是 <code>&lt;|endoftext|&gt;</code>，ID 为 50256。
          模型在训练中学到文本以它结尾，所以能像预测其他词元一样预测它。一旦抽到它，生成就停止。
        </li>
        <li>
          <strong>长度上限。</strong>运行模型的程序会设定新词元的最大数量。如果先达到了这个上限，文本就会被截断，有时停在句子中间。
        </li>
      </ul>
      <p>
        实际系统还会加上一些改进，比如复用之前的计算结果，让每一步不必从头开始，或者同时搜索几个候选续写（束搜索）。
        但核心就是这样：向量、logits、softmax、选一个、追加、重复。
      </p>
      <p>
        想看看模型实际处理的词元吗？本站的<Link href="/tokenizer">分词器</Link>可以把任何文本切成 GPT 和 LLaMA 的词元，并显示它们的 ID。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/blog/how-to-generate", title: "How to generate text: using different decoding methods", source: "Hugging Face 博客", note: "贪心、束搜索、top-k 和 top-p，附代码" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "视频，涵盖反嵌入、softmax 和温度" },
  { href: "https://arxiv.org/abs/1904.09751", title: "The Curious Case of Neural Text Degeneration", source: "Holtzman et al., 2019", note: "提出核采样（top-p）的论文" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "语言模型中的 logits 是什么？", a: "logits 是模型为下一个位置给词表中每个词元打出的原始分数。它们由最终向量乘以反嵌入矩阵得到。分数越高越有可能，但只有经过 softmax 把它们变成介于 0 和 1 之间、总和为 1 的数之后，logits 才成为概率。" },
  { q: "大语言模型里的温度（temperature）有什么作用？", a: "温度在 softmax 之前重新缩放 logits。小于 1 时，分布变得更尖锐，排名靠前的词元占主导，回答更可预测。大于 1 时，分布变得更平坦，不太可能的词元有了更多机会，输出更多样，但也更容易出错。温度为 0 实际上就是总选排名第一的词元。" },
  { q: "top-k 采样和 top-p 采样有什么区别？", a: "top-k 只保留最可能的 k 个词元，并从中采样。top-p 也叫核采样，保留概率加起来达到 p（例如 0.9）的最小一组词元，所以模型不确定时候选项会变多，有把握时会变少。" },
  { q: "语言模型会提前规划好整个回答吗？", a: "不会明确地规划。它一次产生一个词元，每个新词元都被加入输入，然后再预测下一个。它的内部状态可以携带关于句子走向的信息，但并不存在一份写好的完整草稿让它照着读出来。" },
];
