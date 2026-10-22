import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { WordMap } from "./what-are-embeddings.figures";
import s from "@/components/learn/articles/what-are-embeddings.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW] = CLUSTER_COLORS;

// First 16 of the 300 numbers for each word in the site's GloVe file.
const DENSE = {
  cat: [-0.59, -0.05, 0.23, -0.78, 0.26, 0.03, 0.09, 0.46, -0.43, 0.55, -0.19, 0.16, -0.45, -0.43, -0.63, -0.51],
  dog: [-0.63, 0.14, 0.52, -0.71, 0.12, 0.4, 0.05, 0.18, -0.19, 0.64, -0.3, 0.83, -0.23, -0.84, -0.25, -0.44],
  car: [0.25, 0.51, -0.59, -0.39, 0.15, 0.32, -0.15, -0.32, -0.19, -0.04, -0.51, 0.17, -0.35, -0.06, 0.44, -0.3],
};
const ONE_HOT = { cat: 3, dog: 9, car: 13 };

function OneHotVsDense() {
  return (
    <Fig caption="上：独热向量，用 16 个槽位代替 10,000 个来画（示意）。每个词点亮自己的那个槽位，所以任意两个词之间没有任何共同之处。下：同样这些词在 GloVe 中真实的 300 个数字里的前 16 个（青色为正，红色为负）。cat 和 dog 的图案相似；car 则不同。">
      <div className={s.vecRows} role="img" aria-label="cat、dog 和 car 的独热向量没有任何共同的填充槽位；它们稠密的 GloVe 向量显示 cat 和 dog 图案相似，car 的图案不同。">
        <p className={s.vecNote}>独热 · 词表中每个词一个槽位</p>
        {Object.entries(ONE_HOT).map(([w, on]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={s.slots} style={{ "--tc": SKY }}>
              {Array.from({ length: 16 }, (_, i) => <i key={i} data-on={i === on ? "" : undefined} />)}
            </span>
          </div>
        ))}
        <p className={s.vecNote}>嵌入 · 学到的数字（300 个中的前 16 个）</p>
        {Object.entries(DENSE).map(([w, vals]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={`${s.slots} ${s.dense}`}>
              {vals.map((v, i) => <i key={i} style={{ "--tc": v < 0 ? RED : TEAL, "--a": Math.min(1, Math.abs(v) * 1.2) }} />)}
            </span>
          </div>
        ))}
      </div>
    </Fig>
  );
}

// Angles are arccos of the real cosine similarity between "cat" and each word.
const ANGLES = [["dog", 0.722, TEAL, 190], ["car", 0.282, YELLOW, 160], ["democracy", 0.148, RED, 200]];

function CosineFan() {
  const ox = 150, oy = 230, len = 190;
  return (
    <Fig caption="余弦相似度关乎两个箭头之间的夹角。每个箭头都按该词的 GloVe 向量与 cat 的向量之间的真实夹角来画（cat–dog 0.72，约 44°；cat–car 0.28，约 74°；cat–democracy 0.15，约 81°）。这里只有角度有意义，长度没有意义。">
      <svg viewBox="0 0 420 260" className={l.big} role="img" aria-label="从同一原点出发的箭头：cat 沿底边，dog 在 44 度，car 在 74 度，democracy 在 81 度。">
        <line x1={ox} y1={oy} x2={ox + len} y2={oy} stroke={SKY} strokeWidth="2.5" />
        <text x={ox + len + 6} y={oy + 4} className={s.label}>cat</text>
        {ANGLES.map(([w, c, col, arm]) => {
          const a = Math.acos(c);
          const x = ox + Math.cos(a) * arm, y = oy - Math.sin(a) * arm;
          const r = 60 + (w === "dog" ? 0 : w === "car" ? 22 : 44);
          const ax = ox + Math.cos(a) * r, ay = oy - Math.sin(a) * r;
          return (
            <g key={w}>
              <line x1={ox} y1={oy} x2={x} y2={y} stroke={col} strokeWidth="2.5" />
              <path d={`M${ox + r} ${oy} A${r} ${r} 0 0 0 ${ax} ${ay}`} fill="none" stroke={col} strokeOpacity=".5" />
              <text x={w === "democracy" ? x - 6 : x + 6} y={y - 4} textAnchor={w === "democracy" ? "end" : "start"} className={s.label}>{w} · {c.toFixed(2)}</text>
            </g>
          );
        })}
        <circle cx={ox} cy={oy} r="3.5" fill="#fff" />
      </svg>
    </Fig>
  );
}

function BankContexts() {
  return (
    <Fig caption="示意。静态嵌入在两个句子里给“bank”的是同一个向量。上下文模型从同一个向量出发，然后它的各层混入周围的词，于是两种用法最终落在不同的位置。">
      <div className={s.ctx}>
        <p className={s.sentence}>She sat on the river <b style={{ "--tc": TEAL }}>bank</b> and watched the water.（她坐在河岸上看着流水。）</p>
        <p className={s.sentence}>He moved his savings to another <b style={{ "--tc": YELLOW }}>bank</b>.（他把存款转到了另一家银行。）</p>
        <svg viewBox="0 0 420 150" className={l.big} role="img" aria-label="示意图：一个静态的 bank 向量分成两个上下文向量，一个对应河流的句子，一个对应存款的句子。">
          <circle cx="60" cy="75" r="6" fill={SKY} />
          <text x="60" y="100" textAnchor="middle" className={s.label}>bank（静态）</text>
          <path d="M70 72 C140 40 180 30 240 32" fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="4 4" />
          <path d="M70 78 C140 110 180 120 240 118" fill="none" stroke={YELLOW} strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="248" cy="32" r="6" fill={TEAL} />
          <circle cx="248" cy="118" r="6" fill={YELLOW} />
          <text x="260" y="36" className={s.label}>bank + “river”</text>
          <text x="260" y="122" className={s.label}>bank + “savings”</text>
          <text x="160" y="80" textAnchor="middle" className={s.dimText}>混入上下文</text>
        </svg>
      </div>
    </Fig>
  );
}

export default function WhatAreEmbeddings() {
  return (
    <>
      <p>
        计算机擅长处理数字，不擅长处理意义。模型要对 <code>cat</code> 这个词做任何有用的事，都得先把它变成数字。
        有意思的问题是：变成<em>哪些</em>数字？<strong>嵌入</strong>（词嵌入）是几乎所有现代语言系统采用的答案：
        为每个词（或词元）准备一串数字，从文本中学习得到，并且让意思相近的词拿到相近的数字串。
      </p>

      <h2>为什么不直接给每个词编个号？</h2>
      <p>
        最简单的想法是给词表编号：<code>the</code> 是 1，<code>cat</code> 是 2，依此类推。分词器做的大致就是这件事
        （参见<ArticleLink slug="why-tokens">为什么模型读的是词元</ArticleLink>）。但这些编号只是随意的标签。在下文使用的 10,000 词列表中，<code>cat</code> 是第 5,606 号，<code>dog</code> 是第 3,037 号，
        可这对猫和狗来说什么也没说明。模型会理直气壮地得出 <code>dog</code> 比 <code>cat</code>“小”的结论，这显然毫无道理。
      </p>
      <p>
        经典的解决办法是<strong>独热向量</strong>（one-hot）：一个列表，词表中每个词占一个槽位，除了该词所在的槽位是 1，其余全是 0。
        词表有 10,000 个词，每个词就变成 10,000 个数字。虚假的顺序没了，但新的问题出现了：
        任意两个词之间的差别都一模一样。<code>cat</code> 离 <code>dog</code> 并不比离 <code>democracy</code>（民主）更近。
        这种表示根本不携带任何意义。
      </p>
      <OneHotVsDense />

      <h2>一小串学到的数字</h2>
      <p>
        嵌入把思路反了过来。每个词得到一个<strong>稠密</strong>向量：一个短得多的列表（通常 100 到 1,000 个数字，这里是 300 个），每个位置上都有某个值。
        这些值没有人手工挑选。它们一开始是随机的，在训练中不断调整，直到用法相似的词拥有相似的列表。
      </p>
      <p>
        如果把每串 300 个数字当作坐标，每个词就变成 300 维空间中的一个点。“意思相近”于是就变成了“位置相近”。
        我们画不出 300 维，但可以把少数几个词压到二维来看看。
      </p>
      <Fig caption="真实的 GloVe 数据。42 个词被放到二维平面上，使它们之间的距离尽可能接近 300 维中的距离（一种叫 MDS 的方法，只作用于这 42 个词，所以布局是近似的）。图下方的列表是精确的：在全部 10,000 个词中，按余弦相似度排出的每个词的六个最近邻。试试 apple、rice 和 mouse。">
        <WordMap />
      </Fig>
      <p>
        这些分组是自己形成的：从来没有人告诉这些向量什么是动物、什么是国家。出人意料的地方同样很有启发。
        <code>apple</code>（苹果）位于食物和科技之间，它的最近邻全是公司，因为训练文本谈论苹果公司的次数远多于谈论水果。
        <code>rice</code>（大米）最接近的词是 <code>condoleezza</code>，来自美国前国务卿康多莉扎·赖斯（Condoleezza Rice）。<code>mouse</code>（老鼠／鼠标）被拉向卡通和电脑。
        嵌入反映的是词在训练文本中是怎么<em>被使用</em>的，而不是词典怎么说。
      </p>

      <h2>观其伴，知其词</h2>
      <p>
        为什么“用法相似”会带来“意思相近”？这就是<strong>分布假说</strong>，语言学家 J.R. Firth 在 1957 年把它总结为：
        “You shall know a word by the company it keeps.”（观其伴，知其词。）想想“I poured some ___ into my cup.”（我往杯子里倒了些 ___。）这个空。<code>coffee</code>、<code>tea</code> 和 <code>milk</code> 都填得进去；
        <code>bicycle</code> 不行。在数百万个句子里能填进相同空位的词，很可能彼此相关，而这是计算机无需理解任何东西就能衡量的。
      </p>

      <h2>这些数字是怎么学来的</h2>
      <p>
        2010 年代的两个著名方法清楚地展示了这个思路。两者都读取大量文本，为每个词生成一个向量。
      </p>
      <ul>
        <li>
          <strong>word2vec</strong>（Google 的 Mikolov 等人，2013 年）玩的是一个猜词游戏。从句子中取一个词，尝试预测它周围的词
          （或者反过来）。每猜错一次，相关的向量就被轻轻推一下。经过数十亿次推动之后，能预测出相同邻居的词就被推向了相似的向量。
        </li>
        <li>
          <strong>GloVe</strong>（斯坦福大学的 Pennington、Socher 和 Manning，2014 年）先统计整个语料库中每一对词彼此靠近出现的次数。
          然后拟合向量，使得比较两个词的向量就能预测它们共同出现的频率。
        </li>
      </ul>
      <p>
        方法不同，结果相同：一张表，每个词一行数字。它们叫作<strong>静态</strong>嵌入，因为每个词无论出现在什么句子里，都只有一个向量。
      </p>

      <h2>一词多义：上下文嵌入</h2>
      <p>
        静态向量有一个明显的弱点。<code>bank</code> 可以是河岸，也可以是存钱的地方，但它只有一个向量。
        在这份 GloVe 数据中，它的最近邻是 <code>banks</code>、<code>banking</code>、<code>central</code>、<code>credit</code> 和 <code>financial</code>。河岸这层意思基本被淹没了。
      </p>
      <BankContexts />
      <p>
        现代语言模型仍然把查找表作为第一步：每个词元 ID 都被换成一个学到的向量，和上面一模一样。
        但随后这些向量要经过许多层<strong>注意力</strong>，每个词元的向量都会根据它周围的词元来更新
        （参见<ArticleLink slug="attention-and-transformers">注意力机制与 Transformer</ArticleLink>）。到了较后面的层，关于河流的句子里的“bank”和关于存款的句子里的“bank”已经有了不同的向量。
        这就是<strong>上下文嵌入</strong>：向量取决于整个句子，而不只是这个词。
      </p>
      <Callout title="同一个词，不同的向量">
        当有人说现代模型中“一个词的嵌入”时，要问清楚是哪一个：输入表里那个固定的向量，还是模型内部依赖上下文的那个向量。它们不是一回事。
      </Callout>

      <h2>衡量远近：余弦相似度</h2>
      <p>
        要说两个词“很近”，我们需要一种度量方法。最常用的是<strong>余弦相似度</strong>。把每个向量想象成一个从原点出发的箭头。
        余弦相似度就是两个箭头夹角的余弦：方向相同时为 1，互相垂直时为 0，方向相反时为 −1。
      </p>
      <CosineFan />
      <p>
        实际计算时，把两个列表逐位相乘，再把结果加起来（这叫<strong>点积</strong>），然后除以两个箭头的长度。
        除以长度意味着只有方向起作用，这很有用，因为向量的长度可能反映的是词出现的频率之类的东西，而不是它的意思。
        在 GloVe 数据中，<code>cat</code> 和 <code>dog</code> 的得分是 0.72，<code>king</code> 和 <code>queen</code> 是 0.70，而只差一个字母的 <code>cat</code> 和 <code>car</code> 只有 0.28。
        嵌入对拼写一无所知，只知道用法。
      </p>
      <p>
        直线距离（<strong>欧几里得</strong>距离）也可以用，而且当所有向量都缩放到长度 1 时，它给出的最近邻排序和余弦相似度完全一样。
      </p>

      <h2>这为什么重要</h2>
      <p>
        一旦意义变成了位置，许多任务就变成了几何问题。搜索引擎找出嵌入与你的查询接近的文档。推荐系统推荐与你喜欢的东西相近的物品。
        能在你的文件中查找资料的聊天机器人（通常称为检索增强生成）会把每一段文本都做嵌入，然后取出离问题最近的那些段落。
        而在每个语言模型内部，嵌入都是文本最初进入网络时的形式（参见<ArticleLink slug="how-llms-work">语言模型如何把你的话变成回答</ArticleLink>）。
      </p>
      <p>
        这些向量所在的空间，结构不只是“近”和“远”：方向也可以携带意义。这是
        <ArticleLink slug="latent-space">潜在空间</ArticleLink>一文的主题。怎样在平面屏幕上画出 300 维而不自欺欺人，见
        <ArticleLink slug="dimensionality-reduction">看见高维空间</ArticleLink>。想在 3D 中探索 10,000 个真实的词向量，请打开<Link href="/embedding">词嵌入浏览器</Link>；
        针对本站的导览，请看<ArticleLink slug="how-a-word-becomes-300-numbers">一个词如何变成 300 个数字</ArticleLink>。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://jalammar.github.io/illustrated-word2vec/", title: "The Illustrated Word2vec", source: "Jay Alammar", note: "图解 word2vec 是怎样训练的" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "其中有一段关于词嵌入的精彩讲解" },
  { href: "https://arxiv.org/abs/1301.3781", title: "Efficient Estimation of Word Representations in Vector Space", source: "Mikolov et al., 2013", note: "word2vec 的原始论文" },
  { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "项目主页，附论文和下载" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "机器学习中的嵌入（embedding）是什么？", a: "嵌入是一串数字，也就是一个向量，用来表示一个词、一个句子或一张图片之类的对象。这些数字是学出来的，让意义或用法相近的对象彼此靠近，这样计算机就能用简单的算术来衡量相似度。" },
  { q: "词元（token）和嵌入有什么区别？", a: "词元是一段带有 ID 编号的文本，ID 本身不携带任何意义。嵌入是模型为这个 ID 查出的向量：成百上千个学到的数字，把这个词元放在一个空间里，相似的词元在其中彼此靠近。" },
  { q: "什么是余弦相似度？", a: "余弦相似度衡量两个向量之间的夹角。方向相同时为 1，互相垂直时为 0，方向相反时为 −1。它是比较嵌入最常用的方法，因为它忽略向量长度，只看方向。" },
  { q: "嵌入有什么用？", a: "嵌入支撑着语义搜索、推荐、聚类、重复内容检测以及检索增强生成（RAG）：文档以向量形式存储，离问题最近的那些被交给语言模型。在每个语言模型内部，第一步就是把每个词元变成嵌入。" },
];
