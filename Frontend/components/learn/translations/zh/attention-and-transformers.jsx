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
      aria-label="一个 Transformer 块：输入先经过归一化和注意力，结果加回到输入上；再经过归一化和前馈网络，结果同样加回去。这个块重复 N 次。">
      <defs>
        <marker id="att-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#cfd8e6" />
        </marker>
      </defs>
      <rect x="20" y="42" width="300" height="310" rx="14" fill="none" stroke="#ffffff24" strokeDasharray="6 5" />
      <text x="34" y="62" style={{ fill: grey }}>块 × N</text>

      <text x="140" y="20" textAnchor="middle" className={s.label}>更新后的向量</text>
      <Up y1={52} y2={28} />
      <Plus cy={62} />
      <Box y={90} text="前馈网络" color={TEAL} />
      <Up y1={90} y2={74} />
      <Box y={140} h={26} text="归一化" color={grey} />
      <Up y1={140} y2={122} />
      <Plus cy={200} />
      <Up y1={190} y2={168} />
      <Box y={228} text="多头注意力" color={INDIGO} />
      <Up y1={228} y2={212} />
      <Box y={278} h={26} text="归一化" color={grey} />
      <Up y1={278} y2={262} />
      <Box y={366} text="词元向量 + 位置" color={YELLOW} />
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
        在语言模型开始“思考”你的文本时，每个词元（token）都已经被换成了一串数字，也就是它的<strong>嵌入</strong>
        （参见<ArticleLink slug="what-are-embeddings">什么是嵌入？</ArticleLink>）。但这第一个向量来自一张查找表。
        无论周围是什么句子，同一个词元每次出现时拿到的都是同一个向量。本文讲解解决这个问题的思想：<strong>注意力</strong>（注意力机制），
        以及它如何被组装进 <strong>Transformer</strong>，也就是几乎所有现代语言模型背后的架构。
      </p>

      <h2>为什么上下文很重要</h2>
      <p>看看下面两个句子里的“bank”。</p>
      <Fig caption="同一个词元，两种意思。只有周围的词能把它们区分开。">
        <div className={s.contextRows}>
          <Sentence label="句子 1" words={["We", "sat", "on", "the", "river", "bank"]} hi={5} sub="河岸" />
          <Sentence label="句子 2" words={["She", "paid", "cash", "into", "the", "bank"]} hi={5} sub="银行" />
        </div>
      </Fig>
      <p>
        查找表在两句话里给“bank”的都是同一个向量。而人一读到“river”（河），立刻就知道说的是哪个 bank。
        代词对上下文的依赖更强：在“The animal didn’t cross the street because it was too tired”（那只动物没有过马路，因为它太累了）里，“it”这个词毫无意义，直到你弄清楚它指回的是“the animal”。
      </p>
      <p>
        所以模型需要一种办法，让每个词元<em>从其他词元那里收集信息</em>，并更新自己的向量。这正是注意力所做的事。
      </p>

      <h2>注意力：每个词元都在提问</h2>
      <p>
        直观来说是这样的。每个词元都在问：“其他词元中，哪些对我重要？”它给自己能看到的每个词元打一个分，把分数变成百分比，
        然后把这些词元的信息混合起来，百分比越高的混入得越多。这些百分比叫作<strong>注意力权重</strong>。
      </p>
      <Fig caption="示意权重，为了说明思路而手写，并非取自真实模型。把鼠标悬停在、轻点或用 Tab 键选中左边的一个词元，看看它对右边每个词元的关注程度。它后面的词元被遮蔽了，就像在文本生成器中一样。">
        <AttentionLines />
      </Fig>
      <p>
        选中“it”时，大部分权重都给了“animal”。经过这一步，“it”的向量就带上了“animal”的一部分意思，而这正是模型后面的部分所需要的。
        在真实模型中，这些权重不是谁手写的。它们是用模型在训练中学到的数字，从向量本身计算出来的。
      </p>

      <h2>查询、键和值</h2>
      <p>
        一个词元是怎么决定谁重要的？想想在图书馆里搜索。你输入一个<strong>查询</strong>（query，你在找什么）。每本书都有一个<strong>键</strong>（key），就像书脊上的标签（它讲的是什么）。
        你把查询和每个标签做比较，匹配得越好，你就从这本书的内容，也就是它的<strong>值</strong>（value）里读得越多。
      </p>
      <p>
        在 Transformer 中，每个词元同时扮演这三种角色。它的向量分别乘以三个不同的、学到的矩阵，得到三个新向量：
      </p>
      <ul>
        <li><strong>查询</strong>：这个词元在找什么；</li>
        <li><strong>键</strong>：这个词元能提供什么，好让别人找到它；</li>
        <li><strong>值</strong>：如果有人关注它，它会交出的信息。</li>
      </ul>
      <p>
        然后，对于正在查看的那个词元，计算分四步。<strong>比较</strong>：用<strong>点积</strong>把它的查询和每个键做比较，也就是把两个向量逐个数字相乘，再把结果加起来。
        方向越相近，得数越大。<strong>缩放</strong>：把分数除以向量长度的平方根。<strong>softmax</strong>：用这个函数把任意一串数字变成总和为 1 的正数。
        最后，<strong>混合</strong>：把每个值乘以它的权重，再加起来。
      </p>
      <Fig caption="一个用 2 个数字组成的向量的玩具例子，让算术一目了然。数字是编的，但每一步都完全按照 Transformer 的方式计算。真实模型每个头使用的向量有几十到几百个数字。">
        <AttentionSteps />
      </Fig>
      <p>
        把所有词元一起写成紧凑的形式，就是 2017 年提出 Transformer 的那篇论文中的公式：<code>softmax(QKᵀ / √d) · V</code>。
        Q、K 和 V 是把所有词元的查询、键和值叠成的表格，d 是键向量的长度。
      </p>

      <h2>因果掩码：不许偷看后面</h2>
      <p>
        像 GPT 这样的文本生成器一次写一个词元，从左到右（<ArticleLink slug="next-token-prediction">从最后一个向量到下一个词</ArticleLink>讲解了这个循环）。
        训练时，模型学习预测一段文本中的每一个下一个词元。如果一个词元能看到它后面的词，它就可以直接抄答案。
      </p>
      <p>
        所以这些模型使用<strong>因果掩码</strong>：在 softmax 之前，把所有后面词元的分数设为负无穷，softmax 会把它变成恰好为零的权重。
        每个词元只能看自己和它前面的一切，永远看不到后面。画成网格的话，权重构成一个三角形。
      </p>
      <Fig caption="同样的示意权重，画成网格。每一行是发出查看的词元；每一列是被查看的词元。越亮表示权重越大。画了斜线的上三角被遮蔽了。">
        <AttentionMatrix />
      </Fig>
      <p>
        并不是所有 Transformer 都是因果的。为理解文本而不是写文本而构建的模型，比如 BERT，允许每个词元双向看到整个句子。
      </p>

      <h2>同时用许多个头</h2>
      <p>
        一组权重一次只能表达一种关系。但一个词元可能关心好几件事：代词指的是哪个名词，哪个动词和主语搭配，前一个词是什么。
      </p>
      <p>
        所以 Transformer 会并排运行好几组注意力计算，每组都有自己的查询、键和值矩阵。每一组叫作一个<strong>头</strong>（注意力头）。
        它们的输出被拼接起来，再混合回一个单独的向量。最初的 Transformer 每层用 8 个头；GPT-2 最小的版本用 12 个。
      </p>
      <Callout title="真实的注意力是什么样子">
        上面那张“it”清清楚楚指向“animal”的整洁图片，只是一张教学示意图。检查真实模型的研究人员确实发现有些头的工作是看得懂的，
        比如关注前一个词元。但许多头看起来杂乱无章，有些把大部分权重放在第一个词元上，当作一种“歇脚处”，而工作是分散在许多头和许多层之间的。
        注意力模式显示的是信息往哪里流动，而不是对模型为什么这样回答的完整解释。
      </Callout>

      <h2>Transformer 块</h2>
      <p>
        注意力让词元之间共享信息。Transformer 把它包进一个<strong>块</strong>里，再加上另外三样东西：
      </p>
      <ul>
        <li>
          <strong>前馈网络。</strong>注意力在词元<em>之间</em>混合信息之后，每个词元的向量会单独经过一个小型神经网络：
          向量先被扩展成更长的向量（在最初的设计中是四倍长），经过一个简单的非线性函数，再缩回原来的长度。人们认为模型存储的大部分知识就在这里。
        </li>
        <li>
          <strong>残差连接。</strong>每个子层的输出不是替换掉词元的向量，而是<em>加</em>到它上面。向量变成一份持续更新的记录，每一层都在上面改动一点点。
          这也让非常深的堆叠容易训练得多。
        </li>
        <li>
          <strong>归一化。</strong>在每个子层之前，把向量重新缩放到标准大小，这样数字在穿过许多层时既不会爆炸，也不会衰减消失。
        </li>
      </ul>
      <Fig caption="一个 Transformer 块，从下往上读，采用大多数 GPT 类模型使用的“先归一化”排列。红色虚线是残差连接：输入绕过每个子层，再被加回来。">
        <BlockDiagram />
      </Fig>

      <h2>堆叠多个块</h2>
      <p>
        一个模型就是许多这样的块一层层叠起来，每个块都有自己学到的数字。最初的 Transformer 每一半有 6 个；GPT-2 最小的版本有 12 个，大模型则多出几十个。
        每个块读取前一个块产生的向量，并对它们进行精炼。较早的层往往处理局部的、表面的模式；较后的层构建更抽象的特征。
      </p>
      <p>
        一路上形状从不改变：每个词元一个向量进去，每个词元一个向量出来。在最顶端，最后一个词元的向量被变成对下一个词元的猜测。
      </p>

      <h2>词序在哪里？</h2>
      <p>
        这里有个问题。注意力本身会忽略顺序：它把每个词元和其他所有词元做比较，所以“dog bites man”（狗咬人）和“man bites dog”（人咬狗）看起来会是一样的。
        Transformer 通过给每个词元加上<strong>位置信息</strong>来解决这个问题。最初的论文给每个嵌入加上一个固定的正弦波模式，每个位置的模式都不同。
        GPT-2 则学习一个位置向量。许多较新的模型把查询和键向量旋转一个取决于位置的角度（一种叫 RoPE 的方法），这样注意力分数就能反映两个词元相距多远。
      </p>

      <Callout title="一句话总结">
        每个词元构建一个查询、一个键和一个值；注意力把查询和键做比较，决定每个值混入多少；Transformer 在一个又一个块中重复这一过程，外加一个针对每个词元的小型网络。
      </Callout>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.3blue1brown.com/lessons/attention", title: "Attention in transformers, step-by-step", source: "3Blue1Brown", note: "视频，最好的可视化讲解" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "视频，全局概览" },
  { href: "https://jalammar.github.io/illustrated-transformer/", title: "The Illustrated Transformer", source: "Jay Alammar" },
  { href: "https://arxiv.org/abs/1706.03762", title: "Attention Is All You Need", source: "Vaswani et al., 2017", note: "原始论文" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "Transformer 中的注意力机制是什么？", a: "注意力让每个词元查看文本中的其他词元，并决定每个词元对自己有多重要。每个词元都生成一个查询、一个键和一个值；用它的查询和每个键比较得到权重，它的新向量就是这些值的加权混合。上下文就是这样改变一个词的意思的。" },
  { q: "查询、键和值（Q、K、V）是什么？", a: "它们是用学到的权重从每个词元的向量计算出的三个向量。查询描述这个词元在找什么，键描述它能提供什么，值是它传递出去的信息。查询与键的匹配程度决定注意力权重，再用这些权重来混合值。" },
  { q: "什么是多头注意力？", a: "Transformer 不是只运行一次注意力，而是并排运行好几个注意力头，每个头都有自己的查询、键和值权重。不同的头可以学会追踪不同的关系，比如邻近的词、语法或者对前文某个名字的指代，最后把它们的输出合并起来。" },
  { q: "Transformer 怎么知道词的顺序？", a: "注意力本身把输入当作一个无序的集合，所以必须额外加入位置。最初的 Transformer 给每个嵌入加上一个固定的正弦波模式，GPT-2 学习一个位置向量，许多较新的模型则使用旋转位置编码（RoPE），按位置把查询和键旋转一个角度。" },
];
