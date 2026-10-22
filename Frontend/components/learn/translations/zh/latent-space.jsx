import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { WalkBetween } from "./latent-space.figures";
import s from "@/components/learn/articles/latent-space.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE] = CLUSTER_COLORS;

// All numbers below were computed offline from the site's GloVe file (10,000 words x 300 numbers, vectors scaled to length 1).

// The "gender direction": average of (woman - man), (girl - boy), (queen - king), (mother - father),
// (sister - brother), (aunt - uncle), (actress - actor), scaled to length 1. Its 300 components:
const GDIR = [0.01,-0.02,0.06,0.04,-0.13,-0.02,0.05,0.03,0.01,-0.02,-0.01,0.05,0.03,-0.06,-0.04,-0.07,-0.06,0.08,0.09,-0.13,0.02,-0.01,0.06,0.03,-0.05,0.02,0.03,0.1,0.03,-0.01,0.06,-0.16,0.02,0.08,-0.03,0.02,0.05,0.06,0.01,0.03,-0.02,0.15,0.06,0.03,0.02,0.03,0.1,-0.02,0.05,0.05,-0.04,0.01,-0.04,0,0.02,0.1,-0.04,0.2,0.04,0.02,-0.08,-0.12,0.01,0.02,0,0.02,0.09,0.07,0.1,0.01,-0.05,-0.03,-0.07,0,0.03,0.01,-0.06,0.03,-0.06,0.02,-0.01,0.02,0.02,0.02,-0.01,-0.02,0,-0.09,0.04,-0.07,0.03,-0.07,-0.03,0.03,-0.01,0.06,0.11,-0.08,0.09,0.04,-0.07,-0.14,0.06,0.04,0.03,0.08,-0.07,0.07,0.01,0,-0.05,0.08,0.04,0.11,-0.06,-0.11,-0.04,-0.08,0.01,0,0.02,0.02,-0.05,-0.01,0.03,-0.01,0.07,0.01,-0.02,-0.06,-0.06,-0.05,-0.02,0.07,-0.03,-0.07,0.03,-0.04,0.12,0.03,-0.04,-0.01,-0.03,-0.11,-0.04,-0.02,0.05,-0.12,0.07,-0.05,0.02,0.1,0.03,-0.01,0,0.01,0.07,-0.01,0.08,-0.01,0.01,-0.05,-0.1,-0.01,-0.02,0.11,0,0.12,-0.03,0,-0.03,-0.07,0,-0.12,-0.06,0.08,-0.01,-0.04,-0.03,0.06,0.02,0,0.02,-0.07,-0.1,0.04,-0.01,-0.11,-0.07,0.03,-0.14,-0.06,0.03,-0.11,-0.04,0.03,0,0.07,0.03,-0.04,-0.02,-0.06,-0.09,0,0.07,-0.06,-0.01,-0.12,0.08,-0.04,-0.03,0.02,-0.01,0.02,0.09,0.03,-0.04,0.03,0.04,0.04,0.07,-0.02,-0.07,0.03,-0.02,0.07,0.04,0.09,0.05,-0.01,0.03,0.08,-0.03,0.03,0.12,0.03,-0.04,0.11,0.04,-0.01,-0.04,-0.02,0.06,-0.08,0.03,-0.04,-0.02,-0.05,0.02,0.07,0.02,-0.05,-0.09,0.08,0.07,-0.05,-0.01,0.05,-0.04,-0.06,-0.04,0.02,-0.04,0.02,0.05,-0.05,0.05,-0.03,0.03,-0.02,-0.05,-0.02,0.03,-0.1,-0.01,-0.01,-0.07,-0.13,0.06,-0.09,0.07,-0.06,0.03,0,-0.03,-0.01,-0.05,0.06,0.02,0.01,0,0,0.12,0.02,-0.03,0.01,0.05,0,-0.01,0.04];

function DirectionStrip() {
  const W = 600, mid = 60;
  return (
    <Fig caption="真实数据。构成 GloVe 中“性别方向”的 300 个数字（woman − man 这类七个差值的平均）。没有哪个维度特别突出：最大的一个只占这个方向的约 4%，要 300 个维度中的 36 个才能占到一半。">
      <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="由 300 个正负小数值组成的条形带，没有任何一根条形占主导。">
        <line x1="0" y1={mid} x2={W} y2={mid} className={s.axis} />
        {GDIR.map((v, i) => (
          <rect key={i} x={i * 2} width="1.5" y={v > 0 ? mid - v * 250 : mid} height={Math.abs(v) * 250} fill={v > 0 ? TEAL : RED} />
        ))}
        <text x="0" y="120" className={s.dimText}>第 1 维</text>
        <text x={W} y="120" textAnchor="end" className={s.dimText}>第 300 维</text>
      </svg>
    </Fig>
  );
}

// [a, b, a·x, a·y, b·x, b·y]: x = the gender direction, y = the main direction in which the pairs differ from each other.
const PROJ = [["man","woman",-0.272,-0.275,0.26,-0.263],["boy","girl",-0.182,-0.133,0.252,-0.184],["king","queen",-0.254,0.299,0.275,0.254],["father","mother",-0.278,0.226,0.239,0.194],["brother","sister",-0.405,0.316,0.308,0.345],["uncle","aunt",-0.371,0.41,0.285,0.426],["actor","actress",-0.25,-0.41,0.387,-0.339]];
const PAIR_COLORS = [SKY, TEAL, YELLOW, PURPLE, RED, INDIGO, "#26de81"];

function ParallelOffsets() {
  const px = (x) => 210 + x * 360, py = (y) => 150 - y * 300;
  return (
    <Fig caption="真实数据，投影到两个选定的方向上：横轴是平均的“女性减男性”方向，纵轴是这几对词彼此之间差异最大的方向。由于横轴正是用这几对词构造的，出现一定程度的平行是意料之中的。更有力的证据在 300 维空间里：这七个差值向量两两之间的平均余弦相似度是 0.58，而随机词对之间的差值只有 0.07。">
      <svg viewBox="0 0 420 300" className={l.big} role="img" aria-label="七个箭头，每个都从左边的男性词指向右边对应的女性词，方向大致相同。">
        <defs>
          {PAIR_COLORS.map((col, i) => (
            <marker key={i} id={`ls-arrow-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" fill={col} />
            </marker>
          ))}
        </defs>
        {PROJ.map(([a, b, ax, ay, bx, by], i) => (
          <g key={a}>
            <line x1={px(ax)} y1={py(ay)} x2={px(bx)} y2={py(by)} stroke={PAIR_COLORS[i]} strokeWidth="2" markerEnd={`url(#ls-arrow-${i})`} />
            {a === "king"
              ? <text x={px(ax) + 2} y={py(ay) + 17} className={s.label}>{a}</text>
              : <text x={px(ax) - 8} y={py(ay) + (a === "brother" ? 0 : 5)} textAnchor="end" className={s.label}>{a}</text>}
            <text x={px(bx) + 8} y={py(by) + 5} className={s.label}>{b}</text>
          </g>
        ))}
      </svg>
    </Fig>
  );
}

// a − b + c, nearest words excluding the three inputs (standard practice), and the nearest word when inputs are NOT excluded.
const ANALOGIES = [
  ["king", "man", "woman", [["queen", 0.715], ["princess", 0.601], ["throne", 0.584]], "king"],
  ["paris", "france", "italy", [["rome", 0.783], ["milan", 0.68], ["italian", 0.666]], "rome"],
  ["bigger", "big", "small", [["smaller", 0.818], ["larger", 0.806], ["large", 0.652]], "smaller"],
  ["cats", "cat", "dog", [["dogs", 0.78], ["animals", 0.618], ["pet", 0.519]], "dogs"],
  ["brother", "man", "woman", [["daughter", 0.809], ["mother", 0.77], ["wife", 0.761]], "daughter"],
  ["walked", "walk", "swim", [["swimming", 0.525], ["raced", 0.423], ["ran", 0.423]], "swim"],
];

function AnalogyTable() {
  return (
    <Fig caption="GloVe 的真实结果。“前 3 名”排除了三个输入词，类比测试通常都这样做。最后一列是不排除输入词时最近的词：对 king − man + woman 来说，它仍然是 king。最后两行没有得到预期的答案（sister、swam）；sister 排第 6，而 swam 不在这份 10,000 词的词表里。">
      <div className={l.scroll}>
        <table className={l.table}>
          <thead><tr><th>算式</th><th>前 3 名（余弦）</th><th>含输入词</th></tr></thead>
          <tbody>
            {ANALOGIES.map(([a, b, c, top, incl]) => (
              <tr key={a + c}>
                <td>{a} − {b} + {c}</td>
                <td>{top.map(([w, v]) => `${w} ${v.toFixed(2)}`).join(", ")}</td>
                <td>{incl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fig>
  );
}

const OCC = [["captain",-0.219],["engineer",-0.203],["pilot",-0.169],["soldier",-0.148],["lawyer",-0.139],["scientist",-0.117],["doctor",-0.058],["artist",-0.023],["teacher",0.029],["singer",0.092],["dancer",0.142],["nurse",0.253]];
const REF = [["he", -0.231], ["she", 0.213]];

function OccupationBias() {
  const row = ([w, v], ref) => (
    <div key={w} className={s.occRow} style={{ "--tc": v < 0 ? SKY : PURPLE, "--w": Math.abs(v) / 0.26 }}>
      <span className={ref ? s.ref : undefined}>{w}</span>
      <span>{v < 0 && <i className={s.neg} style={{ display: "block" }} />}</span>
      <span className={s.occMid}>{v > 0 && <i className={s.pos} style={{ display: "block" }} />}</span>
      <small>{v > 0 ? "+" : ""}{v.toFixed(2)}</small>
    </div>
  );
  return (
    <Fig caption="真实数据。职业词在性别方向上的位置（与该方向的余弦）。这些词本身是中性的，它们的向量却偏向某一边，反映出它们在训练文本中的用法。he 和 she 作为参照列出。">
      <div className={s.occ} role="img" aria-label="发散条形图。captain、engineer 和 pilot 偏向男性一侧；nurse、dancer 和 singer 偏向女性一侧；teacher 和 artist 接近零。">
        <div className={s.occHead}><span /><span>← 偏向“he”</span><span>偏向“she” →</span><span /></div>
        {row(REF[0], true)}
        {OCC.map((o) => row(o))}
        {row(REF[1], true)}
      </div>
    </Fig>
  );
}

export default function LatentSpace() {
  return (
    <>
      <p>
        在<ArticleLink slug="what-are-embeddings">什么是嵌入？</ArticleLink>中，我们把每个词变成一串 300 个数字，并看到相似的词会彼此靠近。
        这些向量所在的空间有个名字：<strong>潜在空间</strong>。“潜在”的意思是隐藏的。它的坐标不是谁设计出来的，而是学出来的，
        它们的含义只能事后去发现。本文讲的是这种隐藏的结构长什么样、能从中读出什么，以及它在哪里会误导人。
      </p>

      <h2>“潜在空间”是什么意思</h2>
      <p>
        任何把输入变成一个数字向量的模型，都定义了一个潜在空间：它可能产生的所有向量的集合。
        词嵌入是最经典的例子，但图像生成模型、语音模型和大语言模型的内部向量也用这个词来称呼。
        关键的性质是：位置编码了关于输入的某些信息。模型认为相似的两个输入会落在彼此附近。
      </p>
      <p>
        下面的所有内容都使用真实的词向量（GloVe，300 维，10,000 个常见英语单词）。这些思想同样适用于其他潜在空间，即使细节有所不同。
      </p>

      <h2>坐标轴没有名字</h2>
      <p>
        一个很自然的初步猜想是：300 个数字各自衡量一件事，第 12 维表示“是动物”，第 40 维表示“是王室成员”。实际上，单个维度几乎从来不会这么整齐。
      </p>
      <p>
        原因很简单。训练只关心向量之间的关系：它们的距离和夹角。如果把整个空间旋转一下，所有的距离和夹角都保持不变，
        模型的效果也完全一样。所以没有任何力量推动一个概念去对齐某一条特定的轴。意义最终同时分散在许多维度上。
      </p>
      <DirectionStrip />
      <p>
        这就是为什么一个数字一个数字地读嵌入几乎读不出什么。意义存在于<strong>方向</strong>之中，而一个方向是全部 300 个数字的某种特定组合。
      </p>

      <h2>方向可以携带意义</h2>
      <p>
        取从 <code>man</code> 指向 <code>woman</code> 的箭头：也就是两个向量之差。再取从 <code>king</code> 指向 <code>queen</code> 的箭头。
        如果这个空间学到了某种关于性别的一致规律，这两个箭头的方向应该大致相同。事实确实如此，boy→girl、uncle→aunt 和 actor→actress 的箭头也一样。
      </p>
      <ParallelOffsets />
      <p>
        这句话里的“大致”二字很关键。余弦值 0.58 意味着这些箭头有一个共同的方向，但每个箭头也有各自的特点。其他关系则更弱。
        单数到复数的箭头（cat→cats、city→cities、child→children 等）彼此之间的一致性要低得多，在这份数据中平均余弦只有 0.23。
      </p>

      <h2>类比就是平行的箭头</h2>
      <p>
        如果一个箭头的意思是“变成女性”，你就可以把它加到别的词上。这就是著名的类比技巧：<code>king − man + woman</code> 落在 <code>queen</code> 附近。
        同样的算术能找到首都（<code>paris − france + italy ≈ rome</code>）和比较级（<code>bigger − big + small ≈ smaller</code>）。
      </p>
      <AnalogyTable />
      <p>
        老实说，有两点需要注意。第一，结果向量通常仍然离你开始用的某个词最近，所以类比测试会悄悄跳过输入词。
        第二，人们很容易只展示成功的类比，而忘掉那些失败的。这个技巧是结构存在的真实迹象，但不是一个可靠的推理引擎。
        站点指南 <ArticleLink slug="king-man-woman">King − man + woman</ArticleLink> 可以让你亲手试试。
      </p>

      <h2>邻域和簇</h2>
      <p>
        潜在空间中最简单的结构是邻域。颜色挨着颜色，数字挨着数字，首都挨着它们的国家。
        k-means 之类的算法可以通过寻找点的密集团块来自动找到这些分组，嵌入就是这样被用来按主题给文档或用户评论分组的。
      </p>
      <p>
        簇没有标签，边界也很模糊。一个有多种含义的词会位于几组之间：<code>apple</code> 就位于水果和科技公司之间。
        你给一个簇起什么名字，是你自己的解读，而不是存储在向量中的东西。
      </p>

      <h2>在两点之间行走</h2>
      <p>
        如果位置有意义，那两个词<em>之间</em>的空间呢？你可以把两个向量混合起来，比如 70% 的 <code>village</code>（村庄）加 30% 的 <code>city</code>（城市），然后看看哪些真实的词离这个混合点最近。
      </p>
      <Fig caption="真实的 GloVe 数据。每一步都把两个词向量混合起来，并列出 10,000 词词表中最近的词。左：与两个端点的相似度。右：除两个端点外最近的词，第一名加粗。可以拖动滑块或使用方向键。">
        <WalkBetween />
      </Fig>
      <p>
        能看到两件事。先说老实的那一点：在每一步，两个端点词之一仍然是最近的真实词。中间并没有藏着一个“一半村庄、一半城市”的词。
        但<em>排第二</em>的词会以合理的方式变化。在 village 和 city 之间会经过 <code>town</code>（城镇）；在 hot 和 cold 之间会经过 <code>cool</code> 和 <code>warm</code>；
        从 king 到 queen 会经过 <code>monarch</code>（君主）。这个空间足够平滑，介于两种含义之间的点，靠近的是兼具两者的词。
      </p>
      <p>
        在图像生成模型中，这种平滑性被派上了用场。许多生成模型的潜在空间中，两张图像之间的点可以解码成可信的中间图像，平滑的“变形”动画就是这样做出来的。
      </p>

      <h2>不只是词</h2>
      <p>
        凡是模型把数据变成向量的地方，就存在潜在空间。<strong>句子嵌入</strong>模型把整个句子各映射成一个向量，所以“How do I reset my password?”（怎么重置密码？）可以落在
        “I forgot my login”（我忘了登录信息）附近，尽管两句话没有一个词相同。图像模型把图片映射成向量。有些模型，比如 OpenAI 的 CLIP，经过训练后能让一张照片和描述它的文字
        落在同一个共享空间中彼此靠近的地方，这正是用文字搜索照片得以实现的原因。图像和音频是怎样先被切成小块的，参见<ArticleLink slug="tokens-beyond-text">文本之外的词元</ArticleLink>。
      </p>
      <p>
        在大语言模型内部，潜在空间不止一个，而是有很多：每一层都会为每个词元产生新的向量
        （参见<ArticleLink slug="attention-and-transformers">注意力机制与 Transformer</ArticleLink>）。研究人员在那里也发现了有意义的方向，但解读它们仍是一个活跃的研究领域，而不是已经解决的问题。
      </p>

      <h2>局限与偏见</h2>
      <p>
        潜在空间是其训练数据的一份压缩记录，也包括那些我们可能不想要的部分。像 <code>nurse</code>（护士）或 <code>engineer</code>（工程师）这样的词，在定义上并没有性别，
        但它们经常出现在带有性别色彩的语境中，以至于它们的向量偏向了某一边。
      </p>
      <OccupationBias />
      <p>
        2016 年的一篇论文仔细记录了这一现象，它的标题引用了一个真实的类比结果：“Man is to Computer Programmer as Woman is to Homemaker?”（男人之于程序员，就像女人之于家庭主妇？）。
        在我们的数据中，<code>doctor − man + woman</code> 第一名是 <code>physician</code>（医师），第二名是 <code>nurse</code>。任何建立在嵌入之上的系统，从搜索到招聘工具，
        都可能把这些模式传递下去。有一些技术可以减轻它们，但没有一种能彻底消除。
      </p>
      <Callout title="请记住">
        潜在空间展示的是词在某一堆特定文本中是如何被使用的。它是那些文本的一面镜子，而不是一张真相的地图。
      </Callout>
      <p>
        还有一个局限在我们自己这边。我们只能通过平面图片来观察这些空间，而把 300 维压成两维总会扭曲一些东西。
        <ArticleLink slug="dimensionality-reduction">看见高维空间</ArticleLink>解释了这些图片是怎么做出来的，以及怎样读它们才不会被骗。
        想亲自探索 GloVe，可以试试<Link href="/embedding">词嵌入浏览器</Link>，或者在<Link href="/vector-playground">向量实验场</Link>里做词语算术。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "其中关于嵌入的部分直观地展示了 woman − man 这样的方向" },
  { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "参见“linear substructures”（线性子结构）一节" },
  { href: "https://arxiv.org/abs/1607.06520", title: "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", source: "Bolukbasi et al., 2016" },
  { href: "https://arxiv.org/abs/2103.00020", title: "Learning Transferable Visual Models From Natural Language Supervision", source: "Radford et al., 2021", note: "CLIP 论文：图像和文本在同一个空间中" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "AI 中的潜在空间是什么？", a: "潜在空间是模型在内部用来表示输入的向量空间。每个点都是一个嵌入，它的位置反映的是模型学到的规律，而不是人给的标签。相似的输入最终会彼此靠近，空间中的某些方向还会和复数、时态或性别之类的概念对应起来。" },
  { q: "嵌入的每个维度都有含义吗？", a: "通常不是一个一个地有含义。单个维度很少对应一个清晰的概念；意义往往同时分散在许多维度上。可解释的规律通常表现为方向，也就是多个维度的组合，而不是一条条有名字的轴。" },
  { q: "为什么 king − man + woman ≈ queen 能成立？", a: "在许多词嵌入中，man 和 woman 的差值与 king 和 queen 的差值方向大致相同。减去 man、加上 woman，就是把 king 的向量沿着这个方向移动，而离结果最近的词往往就是 queen。这对某些关系有效，但并非对所有关系都可靠。" },
  { q: "嵌入会有偏见吗？", a: "会。嵌入是从人写的文本中学来的，所以会吸收其中的关联，包括刻板印象。例如，研究人员已经证明，某些词嵌入会把特定职业与某一性别联系得更紧密。衡量和减少这种偏见是一个活跃的研究领域。" },
];
