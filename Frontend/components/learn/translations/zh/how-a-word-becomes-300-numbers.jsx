import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import { Link } from "@/i18n/navigation";
import s from "@/components/learn/learn.module.css";

const [RED, TEAL] = CLUSTER_COLORS;

// Same data as the English guide (guides.jsx).
const KING = {
  king: [-0.07, -0.37, -0.21, -0.88, 0.06, -0.26, 0.34, -0.23],
  queen: [-0.08, -0.3, -0.18, -0.81, -0.66, 0.07, 0.21, -0.34],
  man: [-0.02, -0.02, -0.4, 0.27, 0.18, 0.28, -0.27, 0.1],
  apple: [-0.17, 0.13, 0.34, -0.71, -0.21, -0.77, -0.44, 0.26],
};
const SIMS = [["cat", "dog", 0.722], ["king", "queen", 0.696], ["king", "man", 0.468], ["cat", "car", 0.282], ["king", "apple", 0.269]];

export default function WordToNumbers() {
  return (
    <>
      <p>
        分词器把文本变成 ID，但 ID 只是列表中的一个位置。数字 9059 本身并没有说它是“cat”（猫）。
        要处理意义，模型需要一种让相似的词看起来也相似的表示方式。这种表示就是<strong>嵌入</strong>（词嵌入）：
        为每个词或词元准备一串数字，通常有几百个。这样一串数字也叫<strong>向量</strong>，其中每个位置是一个<strong>维度</strong>。
      </p>
      <p>
        本指南只讲本站词嵌入页面展示的内容。想从零开始理解这个概念本身，请阅读<ArticleLink slug="what-are-embeddings">什么是嵌入？</ArticleLink>
      </p>
      <p>
        本站的词嵌入页面展示了三套经典的词嵌入：<strong>GloVe</strong>、<strong>Word2Vec</strong> 和 <strong>FastText</strong>。
        在这三者中，每个词都是一串恰好 300 个数字。
      </p>

      <h2>300 个数字长什么样</h2>
      <p>下面是四个词的 300 个数字中的前 8 个，取自本站使用的 GloVe 数据。</p>
      <Fig caption="300 个 GloVe 数值中的前 8 个，已四舍五入。青色为正，红色为负，颜色越深表示数值越大。">
        <div className={s.cells}>
          {Object.entries(KING).map(([word, values]) => (
            <div key={word} style={{ display: "contents" }}>
              <span>{word}</span>
              {values.map((v, i) => (
                <span key={i} className={s.cell} style={{ background: `color-mix(in srgb, ${v < 0 ? RED : TEAL} ${Math.round(Math.abs(v) * 90)}%, #1a1d24)` }}>
                  {v.toFixed(2)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Fig>
      <p>
        没有哪一个数字单独表示“王室”或“水果”。意义同时分散在全部 300 个数字中。不过，即使是这么一小段也透露出某种规律：
        <code>king</code> 和 <code>queen</code> 在好几个位置上形状相似，而 <code>man</code> 和 <code>apple</code> 则各走各的路。
        这些维度捕捉到了什么、没捕捉到什么，是<ArticleLink slug="latent-space">潜在空间</ArticleLink>一文的主题。
      </p>

      <h2>这些数字从哪里来</h2>
      <p>
        三个模型都建立在同一个思想之上，语言学家 J.R. Firth 常被引用的一句话概括了它：
        “You shall know a word by the company it keeps.”（观其伴，知其词。）出现在相似上下文中的词，往往意思也相近。
        这些模型读取海量文本，不断调整每个词的数字，直到邻居相似的词拥有相似的数字串。
      </p>
      <ul>
        <li>
          <strong>Word2Vec</strong>（Google，2013 年）用一个简单的猜词游戏训练一个小型神经网络：根据给定的词预测它周围的词，或者根据周围的词预测这个词。
          训练完成后，网络中每个词对应的内部权重就成了它的嵌入。
        </li>
        <li>
          <strong>GloVe</strong>（斯坦福大学，2014 年）先统计整个语料库中每一对词彼此靠近出现的次数。
          然后拟合向量，使两个词的向量之间的关系能反映这两个词共同出现的频率。
        </li>
        <li>
          <strong>FastText</strong>（Facebook，2016–17 年）扩展了 Word2Vec，它还为词内部的字符片段学习向量，所以 <code>walk</code>、<code>walking</code> 和 <code>walked</code> 共享一些部分。
          这对罕见词和拼写变体很有帮助。
        </li>
      </ul>
      <p>
        数据的细节也不一样。这里的 GloVe 向量全是小写。Word2Vec 和 FastText 保留了大写字母，所以 <code>Paris</code> 和 <code>paris</code> 可能是不同的条目，
        Word2Vec 的数据集里甚至还有 <code>prime_minister</code> 这样连在一起的短语。
      </p>

      <h2>衡量相似度</h2>
      <p>
        如果每个词都是 300 维空间中的一个点，“意思相近”就变成了“指向相近的方向”。
        常用的度量是<strong>余弦相似度</strong>：1 表示两个向量指向同一个方向，0 表示它们毫无关系（互相垂直）。
      </p>
      <Fig caption="词对之间的余弦相似度，由本站的 GloVe 向量计算得出。">
        <table className={s.table}>
          <thead><tr><th>词对</th><th>相似度</th></tr></thead>
          <tbody>
            {SIMS.map(([a, b, v]) => <tr key={a + b}><td>{a} · {b}</td><td>{v.toFixed(2)}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        这些数字符合直觉：<code>cat</code> 离 <code>dog</code> 比离 <code>car</code> 近得多，尽管 <code>cat</code> 和 <code>car</code> 只差一个字母。
        嵌入对拼写一无所知；它只知道用法。
      </p>

      <h2>嵌入会在哪里出错</h2>
      <p>
        出人意料的地方也来自用法。在这份 GloVe 数据中，<code>apple</code> 的最近邻是 <code>microsoft</code>、<code>google</code> 和 <code>intel</code>。
        训练文本谈论苹果公司的次数远多于谈论水果。
      </p>
      <p>
        反义词也可能离得很近。<code>good</code> 和 <code>bad</code> 的相似度约为 0.72，因为它们出现在几乎一模一样的句子里：“the food was good”（饭菜很好吃）、“the food was bad”（饭菜很难吃）。
      </p>
      <p>
        这些模型还是<strong>静态</strong>的：无论在什么句子里，每个词都只有一个向量。河岸的 <code>bank</code> 和存钱的 <code>bank</code> 共用同一个点。
        现代语言模型解决这个问题的办法，是根据周围的词，一层一层地调整每个词元的向量
        （<ArticleLink slug="attention-and-transformers">注意力机制与 Transformer</ArticleLink>展示了具体做法）。但它们的第一步和这里完全一样：
        在一张大表里为每个词元 ID 查出一个向量。
      </p>

      <h2>为什么是 300？</h2>
      <p>
        列表的长度是训练前就定下的设计选择。数字越多，模型就有越多空间记录细微的差别，
        但也需要更多的训练数据、更多的内存和更多的计算。对于这类经典的词嵌入，300 成了一个常见的大小。
        这里每个模型自带 10,000 个词，也就是每个模型 300 万个数字。
      </p>
      <p>
        大语言模型以更大的规模使用同样的思想，它们的词元向量常常有几千个数字。
      </p>

      <h2>看见这个空间</h2>
      <p>
        没有人能想象出 300 个维度。词嵌入页面从一个模型中取出 1,000、5,000 或 10,000 个词，把它们的向量压缩到 3D，让你可以在其中穿行。
        这种压缩是怎么做到的、又隐藏了什么，见<Link href="/learn/pca-vs-umap">PCA 与 UMAP</Link>。
      </p>
    </>
  );
}

export const faq = [
  { q: "GloVe、Word2Vec 和 FastText 有什么区别？", a: "Word2Vec 通过根据邻居预测一个词、或者根据一个词预测它的邻居来学习向量。GloVe 从一张记录词语共同出现频率的全局表格中学习。FastText 的工作方式和 Word2Vec 类似，但还会利用词的片段，所以能为训练中从未见过的词构造向量。" },
  { q: "为什么词嵌入是 300 维？", a: "300 并没有什么特别之处。它是最初发布 Word2Vec 和 GloVe 时常用的设置，因为它在质量与内存、训练时间之间取得了平衡。维度更少，能捕捉的细微差别就更少；维度多得多的话，对单个词的向量来说收益递减。" },
  { q: "静态词嵌入有哪些做不到的事？", a: "它们给每个词恰好一个向量，所以像“bank”这样有多种意思的词，只能得到一个模糊的平均值。除了 FastText，它们对词表之外的词没有向量，而且会反映训练文本中的偏见。现代语言模型使用随句子变化的上下文嵌入。" },
  { q: "怎么衡量两个词之间的相似度？", a: "通常使用余弦相似度，它比较两个向量的方向。接近 1 的值表示这两个词出现在非常相似的上下文中。上下文相似往往意味着意思相近，但像“hot”和“cold”这样的反义词也可能得分很高，因为它们用在相同的地方。" },
];
