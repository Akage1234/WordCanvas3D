import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import s from "@/components/learn/articles/tokens-beyond-text.module.css";
import { PatchCalculator, PatchSequence } from "./tokens-beyond-text.figures";

// Illustrative spectrogram: deterministic "energy" values, not real audio.
const COLS = 24;
const ROWS = 8;
const energy = (c, r) => (Math.sin(c * 0.9 + r * 1.7) * 0.5 + 0.5) * (1 - r / (ROWS + 2)) * (c % 6 < 4 ? 1 : 0.35);
const WAVE = Array.from({ length: 120 }, (_, i) => {
  const x = 10 + i * 1.5;
  const y = 70 + Math.sin(i * 0.9) * Math.sin(i * 0.11) * 28 * (i % 40 < 28 ? 1 : 0.25);
  return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(" ");

function AudioPipeline() {
  const cw = 7, ch = 11, sx = 232, sy = 26;
  return (
    <svg viewBox="0 0 640 150" className={s.audio} role="img"
      aria-label="示意图：声波被转换成频谱图（频率随时间变化的网格），频谱图的每一个短时间切片变成一串音频词元中的一个向量。">
      <text x="10" y="16">声波</text>
      <path d={WAVE} fill="none" stroke="#45b7d1" strokeWidth="1.4" />
      <path d="M198 70 h22 m-6 -5 l6 5 l-6 5" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      <text x={sx} y="16">频谱图：音高 × 时间</text>
      {Array.from({ length: COLS * ROWS }, (_, k) => {
        const c = k % COLS, r = Math.floor(k / COLS);
        return <rect key={k} x={sx + c * cw} y={sy + r * ch} width={cw - 1} height={ch - 1} fill="#fd79a8" opacity={0.1 + energy(c, r) * 0.9} />;
      })}
      <rect x={sx + 8 * cw - 1} y={sy - 2} width={cw * 2 + 1} height={ROWS * ch + 3} fill="none" stroke="#fff" strokeWidth="1.2" />
      <path d="M404 70 h22 m-6 -5 l6 5 l-6 5" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      <text x="438" y="16">每个切片一个向量</text>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={440 + i * 24} y="54" width="20" height="32" rx="4" fill={i === 4 ? "#fd79a8" : "#fd79a855"} />
      ))}
      <text x="438" y="108">……一串音频词元</text>
      <text x={sx} y="130">每隔几毫秒切一片</text>
    </svg>
  );
}

export default function TokensBeyondText() {
  return (
    <>
      <p>
        Transformer 是现代语言模型背后的架构，它其实并不在乎自己的词元（token）<em>是</em>什么。
        它收到的永远只是一串向量（数字列表），每个词元一个，它的工作是让这些向量互相看一看，然后更新自己。
        对文本来说，每个向量来自一个词的片段。但没有什么能阻止我们用别的东西来制造向量。
      </p>
      <p>
        能看图、能听声音的模型就是这样工作的。诀窍始终如一：<strong>把输入切成小块，把每一块变成一个向量，再把这些向量排成一个序列</strong>。
        本文介绍图像、音频和视频分别是怎么做到这一点的，以及结果如何与文本混在一起。
      </p>

      <h2>图像：一张图值 16×16 个词</h2>
      <p>
        数字图像是一个像素网格，每个像素是三个数字：红、绿、蓝各有多少。单个像素太小，本身没有任何意义，就像单个字母一样。
        把每个像素当作一个词元还会产生极其漫长的序列：一张普通的 224 × 224 照片就有超过 50,000 个像素。
      </p>
      <p>
        Google 的研究人员在 2020 年以“An Image is Worth 16x16 Words”（一张图值 16×16 个词）为题发表的 <strong>Vision Transformer</strong>（ViT），把这个想法变得很简单。
        把图像切成由小正方形组成的网格，这些小正方形叫作<strong>图像块</strong>（patch），通常每块 16 × 16 像素，然后把每个图像块当作一个词元。
        这些图像块按顺序读取，从左到右、从上到下，就像读一页书上的字。
      </p>
      <Fig caption="示意：一张图像被切成 4 × 4 的图像块网格，它们和一个问题的文本词元加入同一个序列。点击“播放”，或一次一个图像块地逐步查看。真实模型使用的图像块要多得多，像 <image> 这样的标记词元因模型而异。">
        <PatchSequence />
      </Fig>

      <h2>从图像块到向量</h2>
      <p>
        图像块仍然只是像素。为了把它变成词元向量，模型做两件简单的事。
      </p>
      <ul>
        <li>
          <strong>展平。</strong>一个 16 × 16 的图像块，每个像素有三个颜色值，共 16 × 16 × 3 = 768 个数字。把它们排成一长串。
        </li>
        <li>
          <strong>投影。</strong>把这串数字乘以一个学到的矩阵，得到一个 Transformer 所需长度的向量。这和把文本词元 ID 变成<ArticleLink slug="what-are-embeddings">嵌入</ArticleLink>的查找表起的是同样的作用。
          （在基础尺寸的 ViT 中，输出恰好也是 768 个数字。）
        </li>
      </ul>
      <p>
        最后，每个向量还要加上一个<strong>位置嵌入</strong>，让模型知道这个图像块来自图像的哪个位置；没有它，打乱顺序的图像看起来会一模一样。
        从这里开始，图像块向量就进入普通的<ArticleLink slug="attention-and-transformers">注意力层</ArticleLink>，每个图像块都能看到其他所有图像块。
      </p>
      <p>
        图像块的大小是一种权衡，就像文本的词表大小一样。图像块越小，保留的细节越多，但产生的词元也多得多，而注意力的开销会随序列长度迅速增长。
      </p>
      <Fig caption="一张图像会变成多少个词元。图像块尺寸减半，或图像尺寸加倍，词元数都会变成四倍。这里的算术是精确的；224 × 224 像素配 16 × 16 的图像块（196 个词元）是标准的 ViT 设置。">
        <PatchCalculator />
      </Fig>

      <h2>连续的图像块，还是离散的编码？</h2>
      <p>
        这里和文本有一个真正的区别。文本词元是固定词表中的一项，所以模型可以通过从列表中挑选来预测它。图像块向量则是<strong>连续的</strong>：它的数字可以是任何值，没有列表可言。
        对于<em>理解</em>图像来说这没问题；大多数视觉编码器，包括 ViT，都是这样工作的。
      </p>
      <p>
        为了一次一个词元地<em>生成</em>图像，有些模型会先把图像变成<strong>离散的</strong>词元。
        一个单独训练的网络，比如 VQ-VAE（向量量化变分自编码器），会学习一本<strong>码本</strong>：一份由典型小图像片段组成的固定列表。
        图像的每个区域都被替换成码本中最接近的那一项的 ID，于是图像变成了一个 ID 网格，和文本一模一样。
        比如最初的 DALL·E 把每张 256 × 256 的图像变成 32 × 32 的网格，共 1,024 个图像词元，每个都从 8,192 项的码本中选出，并把它们放在最多 256 个文本词元之后，组成一个序列。
      </p>
      <Fig caption="把图片变成词元的两种方式。示例来自 ViT、VQ-VAE 和 DALL·E 的论文。">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col"></th><th scope="col">连续的图像块嵌入</th><th scope="col">离散的图像词元</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">一个词元是</th><td>由一个图像块的像素计算出的向量</td><td>学到的码本中的一个 ID</td></tr>
              <tr><th scope="row">词表</th><td>没有：任何向量都有可能</td><td>固定的，例如 DALL·E 中的 8,192 个编码</td></tr>
              <tr><th scope="row">适合</th><td>理解：分类、描述、回答问题</td><td>像文本一样逐个词元地生成图像</td></tr>
              <tr><th scope="row">例子</th><td>ViT：16 × 16 像素的图像块</td><td>DALL·E：32 × 32 的编码网格</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>音频：声音的切片</h2>
      <p>
        声音是一种波：一长串气压测量值，通常每秒 16,000 个甚至更多。每个测量值一个词元的话就太多了，而且单个测量值本身毫无意义。
      </p>
      <p>
        所以语音模型通常先计算一张<strong>频谱图</strong>，它显示每个时刻哪些频率比较响。一条轴是时间，另一条轴是音高，每一个短时间切片都变成一列数字。
        以 OpenAI 的语音识别模型 Whisper 为例，它接收 30 秒的音频片段，计算一张 80 通道的频谱图，每 10 毫秒一个新切片（共 3,000 个切片），然后两个小型卷积层把它减半为 1,500 个向量，再交给 Transformer 读取。
      </p>
      <Fig caption="示意：从声波到频谱图，再到一串音频向量。高亮的那一段时间切片变成一个词元。这里的频谱图颜色是手绘的，并非由真实音频计算得出。">
        <div className={s.tableWrap}><AudioPipeline /></div>
      </Fig>
      <p>
        音频也有离散的版本。<strong>神经音频编解码器</strong>，比如 Meta 的 EnCodec，会把声音压缩成一串码本 ID，每个时间切片有好几个。
        这些 ID 可以像文本一样一个接一个地预测，一些语音和音乐生成模型就是这样产生音频的。
      </p>

      <h2>视频：空间和时间上的图像块</h2>
      <p>
        视频是一摞图像。最简单的做法是把每一帧都切成图像块，但这会让词元数乘以帧数。
        ViViT 等视频 Transformer 则把视频切成<strong>管块</strong>（tubelet）：一个个小盒子，既跨越画面中的一个图像块，<em>又</em>跨越连续的几帧。
        每个管块被展平并投影成一个向量，所以单个词元既捕捉到外观，也捕捉到一点点运动。
        即便如此，视频的开销依然很大：几秒钟就能产生几千个词元，这就是为什么视频模型常常只采样其中的一部分帧。
      </p>

      <h2>全部放进一个序列</h2>
      <p>
        多模态模型往往是由几个部分拼起来的。开源模型 LLaVA 采用的一种常见方案是：
      </p>
      <ul>
        <li>一个预训练好的<strong>视觉编码器</strong>（LLaVA 用的是 CLIP 的 ViT）把图像变成图像块向量；</li>
        <li>一个学到的小型<strong>投影</strong>把这些向量逐个映射到与语言模型的词嵌入相同的空间，使它们长度合适、“说同一种语言”；</li>
        <li>得到的图像词元被放进序列，与文本词元相邻，语言模型把它们一起读入。</li>
      </ul>
      <p>
        在 Transformer 内部没有任何特殊对待。文本词元关注一个图像块，就和关注另一个词一模一样，像“What colour is the sun?”（太阳是什么颜色？）这样的问题，就是这样找到包含太阳的那个图像块的。
      </p>
      <Callout title="核心思想">
        任何能切成小块、变成向量的东西，都能喂给 Transformer。等到注意力看到它们时，文本、图像块、频谱图切片和视频管块全都只是词元。
      </Callout>
      <p>
        这些小块的代价也一样：占用<strong>上下文窗口</strong>的空间。一张图像或一分钟的音频，可能和好几段文字用掉一样多的词元，所以同样的限制和价格也适用于它们。
        文本词元是怎么选出来的，参见<ArticleLink slug="why-tokens">为什么模型读的是词元</ArticleLink>；这些向量进入序列之后会发生什么，参见<ArticleLink slug="how-llms-work">语言模型如何把你的话变成回答</ArticleLink>。
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://arxiv.org/abs/2010.11929", title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", source: "Dosovitskiy et al. · arXiv", note: "Vision Transformer 的原始论文" },
  { href: "https://arxiv.org/abs/2304.08485", title: "Visual Instruction Tuning (LLaVA)", source: "Liu et al. · arXiv", note: "把视觉编码器接到语言模型上" },
  { href: "https://arxiv.org/abs/2103.15691", title: "ViViT: A Video Vision Transformer", source: "Arnab et al. · arXiv" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "AI 模型是怎么“看”图片的？", a: "视觉 Transformer 把图像切成由小正方形图像块组成的网格，通常每块 16×16 像素，把每个图像块展平成一串数字，再投影成一个和词嵌入一样大的向量。然后模型把这些图像块向量当作一个序列来读，就像读文本的词元一样。" },
  { q: "一张图片相当于多少个 token？", a: "这取决于模型和图像尺寸。一张 224×224 的图像切成 16×16 的图像块，会得到 196 个图像块词元。商用模型会缩放较大的图像或把它分块，并按块计算词元，所以一张照片通常要花几百到几千个词元。" },
  { q: "语言模型是怎么处理音频的？", a: "音频被切成短帧，通常每帧 20 到 25 毫秒，并且一般会转换成频谱图，显示每个频率上有多少能量。每一帧（或一小组帧）变成一个向量，所以几秒钟的语音就变成一串几百个词元。" },
  { q: "什么是多模态模型？", a: "多模态模型能接收不止一种数据，比如文本、图像、音频或视频，往往也能输出不止一种。每种输入都被转换成同样大小的向量，因此它们可以放在同一个序列里，由同一个 Transformer 处理。" },
];
