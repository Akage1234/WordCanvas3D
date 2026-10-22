import { Fig, Parallelogram } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import s from "@/components/learn/learn.module.css";

// Same data as the English guide (guides.jsx).
const RESULTS = [
  ["GloVe 300D", "queen", "0.73"],
  ["FastText 300D", "queen", "0.77"],
  ["Word2Vec 300D", "royal", "0.51"],
];

export default function KingManWoman() {
  return (
    <>
      <p>
        词嵌入领域最著名的结果之一是一道算术题：取 <code>king</code>（国王）的向量，减去 <code>man</code>（男人），加上 <code>woman</code>（女人），离结果最近的词是 <code>queen</code>（女王）。
        这听起来像魔术。它其实是关于空间中方向的一个陈述，一旦看清了这一点，你也就能看清它在哪里有效、在哪里失效。
      </p>

      <h2>把词看作箭头</h2>
      <p>
        在嵌入模型中，每个词都是一串数字，这里是 300 个，叫作<strong>向量</strong>。你可以把这串数字想象成一支从原点（所有数字都为零的那个点）指向某个点的箭头。
        箭头的加减是逐个数字进行的：要计算 <code>king − man</code>，就用 <code>king</code> 的第一个数减去 <code>man</code> 的第一个数，然后是第二个，依此类推，一直到第 300 个。
      </p>
      <p>
        减法的结果本身也是一支箭头：从 <code>man</code> 走到 <code>king</code> 要前进的方向。
        如果模型学到了一种一致的“王室”概念，那么从 <code>woman</code> 到 <code>queen</code> 的路线应该大致指向同一个方向。
      </p>
      <Fig caption="一张简化的二维示意图。当 man → king 的箭头和 woman → queen 的箭头几乎平行时，类比就成立。">
        <Parallelogram label="从 man 指向 king 和从 woman 指向 queen 的两支箭头相互平行" royalty="王室" gender="性别" />
      </Fig>
      <p>
        所以 <code>king − man + woman</code> 的意思是：从 <code>king</code> 出发，去掉“男人”的方向，加上“女人”的方向。如果几何结构足够干净，你就会落在 <code>queen</code> 附近。
        同样的想法也可以反过来读：“什么之于 woman，就像 king 之于 man？”
      </p>

      <h2>向量实验场实际做了什么</h2>
      <p>
        向量实验场有三个框 a、b 和 c，计算 <code>a − b + c</code>。在幕后，它会：
      </p>
      <ul>
        <li>为你输入的三个词分别查出完整的 300 维向量；</li>
        <li>对全部 300 个数字做算术；</li>
        <li>用余弦相似度（衡量两支箭头指向有多一致）把结果和模型加载的每个词（共 10,000 个）做比较；</li>
        <li>跳过你输入的三个词，报告剩下的最接近的词及其相似度。</li>
      </ul>
      <Fig caption="在每个模型中离 king − man + woman 最近的词，以及它的余弦相似度。">
        <table className={s.table}>
          <thead><tr><th>模型</th><th>结果</th><th>相似度</th></tr></thead>
          <tbody>
            {RESULTS.map(([m, w, v]) => <tr key={m}><td>{m}</td><td>{w}</td><td>{v}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        GloVe 和 FastText 都落在了 <code>queen</code> 上。Word2Vec 没有，原因很平凡：它的词表区分大小写，
        而这里加载的 10,000 个词中只有首字母大写的 <code>Queen</code>。
        那个向量得分 0.44，低于 <code>royal</code>（王室的）。
      </p>

      <h2>附加说明</h2>
      <p>
        “跳过你输入的三个词”这一步比看起来更重要。在 GloVe 数据中，离 <code>king − man + woman</code> 最近的向量其实是 <code>king</code> 本身
        （相似度 0.82），<code>queen</code> 排第二。减去 <code>man</code>、加上 <code>woman</code> 只是把箭头轻轻推了一下，所以它仍然离出发点最近。
        几乎所有类比工具都因为这个原因而排除输入词。这个著名的结果是真的，只是没有听起来那么戏剧化。
      </p>
      <p>
        画布上的 3D 箭头是另一种简化：它们是 300 维向量的压平视图，所以屏幕上的角度和长度只是近似的。
        图像只是一个提示；答案来自完整的 300 个数字的计算。
      </p>

      <h2>更多可以试试的类比</h2>
      <p>下面这些在实验场的默认模型 GloVe 中都有效：</p>
      <ul>
        <li><code>paris − france + italy</code> → <code>rome</code>（首都）</li>
        <li><code>france − paris + tokyo</code> → <code>japan</code>（同样的关系，反过来）</li>
        <li><code>walking − walk + swim</code> → <code>swimming</code>（动词形式）</li>
        <li><code>bigger − big + small</code> → <code>smaller</code>，<code>larger</code> 以极小的差距排第二</li>
      </ul>
      <p>
        最后这个例子展示了一种常见的失败。<code>smaller</code>（更小）和 <code>larger</code>（更大）出现在几乎一模一样的句子里，所以模型让它们挨得很近。
        嵌入擅长“同一类词”，不太擅长“反义”。
      </p>

      <h2>怎样解读结果</h2>
      <p>
        实验场显示的相似度是余弦相似度：1 表示方向完全一致。它不是概率，也不是置信度分数。
        它只说明结果箭头和每个候选词指向有多接近。较低的数值，比如 Word2Vec 的 0.51，意味着计算落在了一片稀疏的区域，连最近的词也不太近。
      </p>
      <p>
        你也可以跳过计算，直接把词画出来。“词语”框最多接受 50 个词，把每个词画成一支箭头，这是比较 <code>man woman king queen</code> 这样一小组词的快捷方法。
      </p>

      <h2>它为什么有效，又反映了什么</h2>
      <p>
        没有人在这些模型里编写过“王室”或“性别”的方向。它们之所以出现，是因为训练文本以平行的方式使用 <code>king</code> 和 <code>queen</code>，
        就像使用 <code>man</code> 和 <code>woman</code> 一样。这种几何结构是对人们如何写作的一份压缩概要。
        嵌入中的方向为什么能携带意义，在<ArticleLink slug="latent-space">潜在空间：数字中隐藏的意义</ArticleLink>中有深入探讨。
      </p>
      <p>
        这是一把双刃剑。研究人员已经证明，同样的算术会把训练文本中的刻板印象暴露出来，比如把某些职业与某一性别联系得更紧密。
        当一个类比给出出人意料的答案时，值得问一问：源文本中是什么导致了这个结果。
      </p>
    </>
  );
}

export const faq = [
  { q: "king − man + woman = queen 是什么意思？", a: "这是词嵌入领域一个著名的结果。取 king 的向量，减去 man，加上 woman，得到的点最近的词往往是 queen。它说明某些关系，比如男性到女性，在嵌入空间中表现为一致的方向。" },
  { q: "词语类比总是成立吗？", a: "不是。它对某些关系效果很好，比如性别、首都和动词时态，对许多其他关系则效果很差。而且结果通常是在排除输入词之后报告的，因为最近的向量往往就是输入词之一，这让这种方法看起来比实际更可靠。" },
  { q: "类比的答案是怎么算出来的？", a: "把三个向量组合成 a − b + c，然后用余弦相似度把结果和每个词向量做比较。排除三个输入词之后，最接近的那些词就是答案。WordCanvas3D 的向量实验场会一步步展示这个计算过程。" },
  { q: "向量运算能揭示偏见吗？", a: "能。同样的算术可以暴露从训练文本中学到的刻板印象，比如把某些职业与某一性别更紧密地配对。这些结果反映的是人们写作的模式，这就是为什么嵌入在使用前常常要进行偏见测试和调整。" },
];
