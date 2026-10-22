import { Chips, Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import { Link } from "@/i18n/navigation";

export default function WhatIsAToken() {
  return (
    <>
      <p>
        当你在聊天机器人里输入一句话时，模型从来看不到你的字母，也看不到你的单词。它看到的是一串整数。
        把文本变成这些数字的步骤叫作<strong>分词</strong>，每一段拥有自己编号的文本就是一个<strong>词元</strong>（token）。
      </p>
      <p>
        下面是一个短句被 <code>o200k_base</code> 分词器切分的结果，这个分词器由 GPT-4o 使用，也是本站分词器的默认选项。
        每个小块是一个词元，下面的数字是这个词元的 <strong>ID</strong>：它在分词器已知片段列表中的位置。
      </p>
      <Fig caption="“The cat sat on the mat.”（猫坐在垫子上。）在 o200k_base 中：7 个词元。圆点表示空格，空格属于下一个词元的开头。">
        <Chips items={[["The", 976], ["·cat", 9059], ["·sat", 10139], ["·on", 402], ["·the", 290], ["·mat", 2450], [".", 13]]} />
      </Fig>
      <p>
        到目前为止，看起来像是“一个词，一个词元”。但已经有两个细节打破了这种想法。句号自己就是一个词元。
        而且每个词前面的空格被粘在了这个词上：模型的词表里，<code>·cat</code>（带空格）和 <code>cat</code>（不带空格）是两个不同的条目。
      </p>

      <h2>词表是一份固定的列表</h2>
      <p>
        分词器自带一份词表：一份文本片段的列表，每个片段都配有一个 ID。<code>o200k_base</code> 这个名字暗示了它的大小，大约 200,000 项。
        较早的 <code>cl100k_base</code>（GPT-4 和 GPT-3.5 使用）大约有 100,000 项，GPT-2 的大约有 50,000 项。
      </p>
      <p>
        因为列表是固定的，分词器必须用它已有的片段来表达<em>任何</em>输入。大小写、空格和拼写都有影响。
        在 <code>o200k_base</code> 中，<code>cat</code> 的 ID 是 8837，<code>·cat</code> 是 9059，<code>Cat</code> 是 23546。对模型来说，这是三个毫不相干的数字。
        它只有在训练中看到它们被以相似的方式使用，才会学到它们的意思几乎相同。
      </p>

      <h2>为什么不直接用单词？</h2>
      <p>
        单词级的词表听起来更简单，但很快就会遇到麻烦。单词是没有尽头的：人名、拼写错误、俚语、产品名、代码标识符、其他语言的词。
        任何列表里没有的词，都只能用一个通用的“未知”标记代替，它的意思也就丢了。
      </p>
      <p>
        另一个极端是每个字符一个词元，这样永远不会碰到未知词，但会让每段文本都变得很长。
        输入越长，模型的工作量就越大，而且单个字母本身几乎不携带任何意义。
      </p>
      <p>
        现代分词器介于两者之间。它们使用<strong>子词</strong>片段（比单词小，通常比字母大）：常见词占一个词元，较罕见的词由几个更小、可复用的部分拼成。
        完整的权衡在<ArticleLink slug="why-tokens">为什么模型读的是词元，而不是字母或单词</ArticleLink>中有详细解释。
      </p>
      <Fig caption="同一个词出现在文本开头时，被三个分词器切成了不同的样子。带上前导空格时，“ unbelievable”在三者中都是单个词元。">
        <Chips label="o200k_base · 3 个词元" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="cl100k_base · 3 个词元" items={[["un"], ["belie"], ["vable"]]} />
        <Chips label="gpt2 · 4 个词元" items={[["un"], ["bel"], ["iev"], ["able"]]} />
        <Chips label="o200k_base，带前导空格 · 1 个词元" items={[["·unbelievable", 83614]]} />
      </Fig>
      <p>
        最后一行值得再看一眼。在句子中间，这个词跟在空格后面，常见到足以拥有自己的词元。
        而在文本的最开头，前面没有空格，同一个词就很少见，所以要用几个部分拼出来。
      </p>

      <h2>片段是怎么选出来的</h2>
      <p>
        GPT 分词器使用一种叫<strong>字节对编码</strong>（BPE）的方法。训练从最小的片段开始，也就是文本的单个字节。
        然后扫描大量文本，找出出现最频繁的一对相邻片段，把这一对合并成一个新的词表条目。
        重复这一过程，直到词表达到目标大小。
      </p>
      <p>
        早期的合并捕捉到非常常见的字母组合，比如 <code>in</code> 或 <code>he</code>。后期的合并则构造出完整的高频词和像 <code>ization</code> 这样的词尾。
        这就是为什么 <code>tokenization</code> 在三个 GPT 分词器中都被切成 <code>token</code> + <code>ization</code>。
        这些片段是统计意义上的，而不是语法意义上的：它们遵循训练文本中出现频繁的东西，而不是词典会在哪里断开一个词。
        想看逐次合并的完整示例，请参阅<ArticleLink slug="tokenization-algorithms">分词器是怎样构建的</ArticleLink>。
      </p>
      <p>
        分词器中的 LLaMA 选项使用的是另一个工具 SentencePiece。你会注意到两个区别。
        它的词表把空格写成 <code>▁</code>（点击一个词元，就能在它的“词表片段”中看到），而且每段文本都以一个特殊的 <code>&lt;s&gt;</code> 词元开头，表示序列的开始。
      </p>

      <h2>你能看到的副作用</h2>
      <p>一旦知道模型读的是词元，一些熟悉的怪现象就说得通了。</p>
      <ul>
        <li>
          <strong>拼写问题很别扭。</strong>在 <code>o200k_base</code> 中，<code>strawberry</code> 是三个词元：<code>st</code>、<code>raw</code>、<code>berry</code>。
          模型从来不会直接看到十个独立的字母，这也是数字母问题容易难倒模型的原因之一。
        </li>
        <li>
          <strong>数字被分成块。</strong>GPT 分词器把 <code>1234567</code> 切成 <code>123</code>、<code>456</code>、<code>7</code>。
          LLaMA 的分词器则每个数字一个词元。在这样的块上做算术，比看起来要难。
        </li>
        <li>
          <strong>长度限制按词元计算。</strong>模型的上下文窗口（它一次能读取的最多文本）和许多 API 的价格，都是按词元计量的，而不是按单词或字符。
        </li>
      </ul>

      <h2>接下来会发生什么</h2>
      <p>
        单独一个词元 ID 只是列表中的一个位置。ID 9059 并不在任何有意义的层面上比 ID 402 “更多”。
        模型内部的下一步，是把每个 ID 换成一长串真正携带意义的数字，叫作嵌入。
        这就是<Link href="/learn/how-a-word-becomes-300-numbers">一个词如何变成 300 个数字</Link>的主题。
      </p>
    </>
  );
}

export const faq = [
  { q: "ChatGPT 里的 token（词元）是什么？", a: "词元是 ChatGPT 读写文本的单位。常见词通常是一个词元，往往还包括前面的空格，而罕见词会被切成几块。每个词元都有一个 ID，使用限额和 API 价格都是按词元计算的，而不是按单词。" },
  { q: "怎么数我的文本有多少个 token？", a: "把文本粘贴到分词器工具里，比如 WordCanvas3D 的分词器，它会针对几种真实的分词器显示每个词元及其 ID。在代码中，可以用 OpenAI 的 tiktoken 库为 GPT 模型计数。不同模型的计数不同，因为每个模型都有自己的词表。" },
  { q: "空格是词元的一部分吗？", a: "通常是。GPT 风格的分词器把空格附在后一个词的开头，所以带空格的“ cat”和不带空格的“cat”是两个不同的词元，ID 也不同。大小写同样会改变词元：“Cat”又是另一个单独的条目。" },
  { q: "为什么同一个词会被切成不同的样子？", a: "切分方式取决于分词器的词表，以及前导空格或大写字母之类的上下文。“unbelievable”在文本最开头时，在 o200k_base 中是三块，而在空格之后的“ unbelievable”则是单个词元。不同的模型也有不同的词表。" },
];
