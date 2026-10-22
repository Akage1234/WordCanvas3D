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
        在<ArticleLink slug="why-tokens">为什么模型读的是词元</ArticleLink>中我们看到，现代语言模型把文本读成<strong>子词</strong>片段：
        常见词保持完整，罕见词由更小的部分拼成。可是，是谁决定 <code>lowest</code> 应该变成 <code>low</code> + <code>est</code> 的呢？
      </p>
      <p>
        没有人手工决定。在语言模型本身开始训练之前，分词器会从一大批文本样本（称为<strong>训练语料库</strong>）中<em>学习</em>自己的词表。
        本文逐一讲解几乎所有模型都在用的三种方法：<strong>字节对编码</strong>（BPE）、<strong>WordPiece</strong> 和 <strong>Unigram</strong>。
      </p>

      <h2>字节对编码：合并最常见的一对</h2>
      <p>
        BPE 最早是 Philip Gage 在 1994 年提出的一种数据压缩技巧。2016 年，Rico Sennrich 等人把它改造成机器翻译中切分单词的方法，从此流行开来。
        它的思路一句话就能说完：<strong>从单个字符开始，不断把出现最频繁的一对相邻片段粘在一起。</strong>
      </p>
      <p>说得更细一些，训练过程重复三个步骤。</p>
      <ul>
        <li><strong>统计相邻对。</strong>查看语料库中的每个单词（按当前的片段切分），统计每一对相邻片段出现的次数。</li>
        <li><strong>合并胜出者。</strong>取出现最频繁的那一对，比如 <code>e</code> + <code>s</code>，把合并后的片段 <code>es</code> 加进词表，并在整个语料库中替换掉这一对。</li>
        <li><strong>重复</strong>，直到词表达到事先选定的大小。</li>
      </ul>
      <p>
        输出有两样东西：<strong>词表</strong>（分词器认识的所有片段）和<strong>合并列表</strong>（按学到的顺序排列的所有合并）。在一个只有四个单词的小语料库上一步步走一遍。
      </p>
      <Fig caption="在一个四词玩具语料库上训练 BPE，其中“low”出现 5 次，“lower”2 次，“newest”6 次，“widest”3 次（Sennrich 等人论文中的例子）。每一步都统计相邻对（按单词出现次数加权），并合并出现最频繁的那一对（高亮显示）。次数相同时，选先出现的那一对。所有数字都是根据语料库实时计算的。">
        <BpeTrainer />
      </Fig>
      <p>
        看看这些合并发现了什么。前两次合并构造出 <code>est</code>，因为它同时出现在 <code>newest</code> 和 <code>widest</code> 中。
        接着出现了 <code>low</code>，然后是 <code>new</code>，到第 7 次合并时，高频词 <code>newest</code> 已经是一个单独的词元了。较少见的 <code>lower</code> 仍然是 <code>low</code> + <code>e</code> + <code>r</code>。
        这正是我们想要的效果：高频字符串变成完整的词元，罕见的则保留为可复用的部分。
      </p>
      <p>
        真实的分词器在几 GB 的文本上做同样的事，进行几万次合并后停止。
        在真实的 GPT-2 分词器中，最先学到的几次合并是空格加 <code>t</code>、空格加 <code>a</code>，然后是 <code>he</code>、<code>in</code>、<code>re</code> 和 <code>on</code>：英语里最常见的字母组合。
      </p>

      <h2>把合并用在新文本上</h2>
      <p>
        训练一结束，语料库就被丢掉了。要切分一个新词，分词器先把它拆成字符，再<em>按学到的顺序</em>重放合并列表，凡是能用上的地方都执行合并。
        最后剩下的就是词元列表。
      </p>
      <Fig caption="把上面学到的 10 次合并应用到新词上（示意性的玩具词表）。“lowest”从未在语料库中出现过，结果却被切成 low + est。真实的 GPT-2 分词器恰好也这样切分不带前导空格的“lowest”。">
        <BpeApply />
      </Fig>
      <p>
        这就是为什么子词分词器永远不会碰到真正的未知词：最坏的情况下，比如这里的 <code>rider</code>，单词只是保持为单个字符。
        但有一个问题。我们的玩具词表只包含语料库中出现过的十个字母，所以带 <code>k</code> 的单词根本写不出来。真实的分词器用字节解决了这个问题，我们稍后再谈。
      </p>

      <h2>WordPiece：合并最出人意料的一对</h2>
      <p>
        WordPiece 由 Google 开发，最出名的身份是 <strong>BERT</strong> 以及 DistilBERT 等许多 BERT 类模型的分词器。
        它的训练循环和 BPE 很像：从字符开始，合并相邻对，重复。区别在于它合并<em>哪一</em>对。
      </p>
      <p>
        BPE 选出现次数最多的那一对。WordPiece 则把这个次数除以两个部分各自单独出现的次数：
      </p>
      <p style={{ textAlign: "center" }}>
        <code>score = count(pair) / (count(first) × count(second))</code>
      </p>
      <p>
        当两个部分几乎总是<em>一起</em>出现时，这一对的得分就高。非常常见的片段，比如字母 <code>e</code>，会被扣分，因为看到它挨着某个东西并不稀奇。
        （严格地说，WordPiece 选择的是最能提高训练数据似然的那次合并。Google 从未公开它的训练代码，而这个比值就是 Hugging Face 等开源实现做出这个选择的方式。）
      </p>
      <Fig caption="在同一个玩具语料库上的第一次合并。BPE 合并 e + s，因为它是出现最频繁的一对。WordPiece 更偏爱 w + i：它只出现 3 次，但 w 和 i 从不分开出现。计数根据语料库计算；在 WordPiece 中，单词内部的片段带有 ## 前缀，所以“low”里的 w 和“widest”开头的 w 分开计数。">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col">相邻对</th><th scope="col">BPE：次数</th><th scope="col">次数 ÷（前者 × 后者）</th><th scope="col">WordPiece 得分</th></tr>
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
        WordPiece 书写词元的方式也不同。延续一个单词的片段以 <code>##</code> 开头，所以像 <code>hugs</code> 这样的词可能被切成 <code>hug</code> + <code>##s</code>。
        这让单词边界在词元本身中就能看出来。
        切分新文本时，WordPiece 不重放合并。它从左边扫描每个单词，反复取<strong>词表中能匹配上的最长片段</strong>。如果某个部分完全匹配不上，整个单词就变成 <code>[UNK]</code>。
      </p>

      <h2>Unigram：从大处开始，逐步修剪</h2>
      <p>
        Unigram 方法由工藤拓（Taku Kudo）在 2018 年提出，方向正好相反。它不是从字符开始扩充词表，而是从一个非常<em>大</em>的词表开始（比如语料库中许多常见的子串），然后逐步缩小。
      </p>
      <ul>
        <li>词表中的每个片段都有一个根据语料库估算出的概率。</li>
        <li>一个单词通常可以有多种切法（<code>low</code>+<code>est</code>、<code>lo</code>+<code>west</code>、<code>l</code>+<code>owest</code>……）。分词器选择片段联合概率最高的那种切法。</li>
        <li>每一轮训练中，它计算去掉每个片段后对语料库的拟合会变差多少，然后删掉最不重要的那些片段，通常占 10% 到 20%。单个字符始终保留，所以每个单词都写得出来。</li>
        <li>如此重复，直到词表达到目标大小。</li>
      </ul>
      <p>
        由于 Unigram 是一个概率模型，它还能在训练时对同一个单词<em>采样</em>不同的切法，这个技巧叫作子词正则化，能让模型对不常见的拼写更稳健。
      </p>
      <p>
        Unigram 通常通过 <strong>SentencePiece</strong> 使用。这是 Google 的一个库，直接在原始文本上训练，把空格当作普通符号（写作 <code>▁</code>），因此对有空格和没有空格的语言都一样适用。
        SentencePiece 同时实现了 Unigram 和 BPE。T5、ALBERT 和 XLNet 使用 Unigram；最初的 LLaMA 模型使用的是 SentencePiece 的 BPE 模式。
      </p>

      <h2>字节级 BPE：永不未知</h2>
      <p>
        回到前面那个问题：基于字符的词表写不出它从没见过的字符。随 GPT-2 在 2019 年推出的<strong>字节级 BPE</strong> 解决了这个问题：它在文本的<strong>字节</strong>（UTF-8 编码）上而不是字符上运行 BPE。
        字节只有 256 种可能，而且全部一开始就在词表里，所以任何字符串，无论什么语言，包括表情符号，都能被切分。不存在 <code>[UNK]</code> 词元。
      </p>
      <p>
        还有两个细节让它在实践中行得通。第一，文本会先经过<strong>预分词</strong>：在 BPE 运行之前，用一个模式把文本切成粗略的块（带前导空格的单词、数字、标点），这样合并永远不会把一个词的结尾和下一个词的开头粘在一起。
        第二，空格被保留为后一个单词的一部分，这就是 GPT 风格的词元看起来像 <code>·the</code> 的原因。GPT-2、RoBERTa 以及 GPT-3/GPT-4 系列的分词器都使用字节级 BPE。
      </p>

      <h2>三种方法并排对比</h2>
      <Fig caption="三种算法的总结。真实的分词器还会在此基础上增加细节，比如特殊词元、规范化和预分词规则。">
        <div className={s.tableWrap}>
          <table className={`${s.tbl} ${s.compare}`}>
            <thead>
              <tr><th scope="col"></th><th scope="col">BPE</th><th scope="col">WordPiece</th><th scope="col">Unigram</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">训练</th><td>扩充：合并出现最频繁的一对</td><td>扩充：合并得分最高的一对</td><td>缩减：修剪最没用的片段</td></tr>
              <tr><th scope="row">切分</th><td>按顺序重放合并</td><td>从左到右，最长匹配</td><td>概率最高的切法</td></tr>
              <tr><th scope="row">未知文本</th><td>字节级：永不未知</td><td>整个单词变成 <code>[UNK]</code></td><td>单个字符；未见过的字符变成 <code>&lt;unk&gt;</code>，除非开启了字节回退</td></tr>
              <tr><th scope="row">使用者</th><td>GPT-2、RoBERTa、GPT-4（字节级）；LLaMA（通过 SentencePiece）</td><td>BERT、DistilBERT</td><td>T5、ALBERT、XLNet（通过 SentencePiece）</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>
      <Callout title="请记住">
        这些算法都不懂任何语法。<code>est</code> 成为一个词元，是因为它在语料库中出现得频繁，而不是因为它是一个后缀。换一批训练文本，你就会得到不同的词表。
      </Callout>
      <p>
        最后这一点会带来实实在在的后果。一个主要用英语训练的分词器会把其他语言切成更多、更小的片段，让处理这些语言变得更慢、更贵；参见<ArticleLink slug="why-emoji-cost-more-tokens">为什么表情符号和其他语言更费词元</ArticleLink>。
        文本变成词元后，每个词元 ID 会被转换成一个向量，详见<ArticleLink slug="what-are-embeddings">什么是嵌入？</ArticleLink>
        你可以在<Link href="/tokenizer">分词器</Link>中，用自己的文本比较几个真实 BPE 分词器的切分结果。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM 课程", note: "第 6、7 节讲解 WordPiece 和 Unigram" },
  { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · 视频", note: "从零实现字节级 BPE" },
  { href: "https://arxiv.org/abs/1508.07909", title: "Neural Machine Translation of Rare Words with Subword Units", source: "Sennrich, Haddow & Birch · arXiv" },
  { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "什么是字节对编码（BPE）？", a: "字节对编码是一种根据数据构建分词器词表的方法。它从单个字符或字节开始，找出训练文本中出现最频繁的相邻对，把这一对合并成一个新词元，然后重复，直到词表达到目标大小。GPT 模型使用的是字节级的 BPE。" },
  { q: "BPE、WordPiece 和 Unigram 有什么区别？", a: "BPE 合并出现最频繁的一对片段。BERT 使用的 WordPiece 合并的是最能提高训练文本似然的那一对，它偏爱那些一起出现得出人意料地频繁的组合。Unigram 通常通过 SentencePiece 在 T5 等模型中使用，它从一个很大的词表开始，删掉最不重要的片段。" },
  { q: "GPT-4 用的是哪种分词器？", a: "GPT-4 和 GPT-3.5 使用 cl100k_base，这是一个约有 100,000 个词元的字节级 BPE 分词器。GPT-4o 使用 o200k_base，约有 200,000 个词元，处理许多非英语语言时效率更高。两者都包含在 OpenAI 的开源库 tiktoken 中。" },
  { q: "分词器会因为未知文本而出错吗？", a: "字节级分词器不会。全部 256 种字节值都在它的词表里，所以任何文本，包括表情符号和罕见文字，在没有更大的片段可匹配时，都能一个字节一个字节地写出来。单词级分词器以及某些字符级分词器，则会把没见过的输入替换成一个未知词元。" },
];
