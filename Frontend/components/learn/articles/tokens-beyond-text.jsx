import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import s from "./tokens-beyond-text.module.css";
import { PatchCalculator, PatchSequence } from "./tokens-beyond-text.figures";

export const minutes = 5;

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
      aria-label="Diagram: a sound wave is turned into a spectrogram, a grid of frequencies over time, and each short slice of the spectrogram becomes one vector in a row of audio tokens.">
      <text x="10" y="16">sound wave</text>
      <path d={WAVE} fill="none" stroke="#45b7d1" strokeWidth="1.4" />
      <path d="M198 70 h22 m-6 -5 l6 5 l-6 5" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      <text x={sx} y="16">spectrogram: pitch × time</text>
      {Array.from({ length: COLS * ROWS }, (_, k) => {
        const c = k % COLS, r = Math.floor(k / COLS);
        return <rect key={k} x={sx + c * cw} y={sy + r * ch} width={cw - 1} height={ch - 1} fill="#fd79a8" opacity={0.1 + energy(c, r) * 0.9} />;
      })}
      <rect x={sx + 8 * cw - 1} y={sy - 2} width={cw * 2 + 1} height={ROWS * ch + 3} fill="none" stroke="#fff" strokeWidth="1.2" />
      <path d="M404 70 h22 m-6 -5 l6 5 l-6 5" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      <text x="438" y="16">one vector per slice</text>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={440 + i * 24} y="54" width="20" height="32" rx="4" fill={i === 4 ? "#fd79a8" : "#fd79a855"} />
      ))}
      <text x="438" y="108">… a sequence of audio tokens</text>
      <text x={sx} y="130">slices every few milliseconds</text>
    </svg>
  );
}

export default function TokensBeyondText() {
  return (
    <>
      <p>
        A transformer, the design behind modern language models, does not really care what its tokens <em>are</em>.
        All it ever receives is a sequence of vectors (lists of numbers), one per token, and its job is to let those vectors look at each other and update themselves.
        For text, each vector comes from a word piece. But nothing stops us from making vectors out of other things.
      </p>
      <p>
        That is how models that see pictures and hear sound work. The trick is always the same: <strong>cut the input into small pieces, turn each piece into a vector, and line the vectors up as a sequence</strong>.
        This article shows how that is done for images, audio and video, and how the result is mixed with text.
      </p>

      <h2>Images: an image is worth 16×16 words</h2>
      <p>
        A digital image is a grid of pixels, and each pixel is three numbers: how red, green and blue it is. A single pixel is far too small to mean anything, just like a single letter.
        Treating every pixel as a token would also produce enormous sequences: a modest 224 × 224 photo has over 50,000 pixels.
      </p>
      <p>
        The <strong>Vision Transformer</strong> (ViT), published by Google researchers in 2020 under the title “An Image is Worth 16x16 Words”, made the idea simple.
        Cut the image into a grid of small squares called <strong>patches</strong>, typically 16 × 16 pixels each, and treat every patch as one token.
        The patches are read in order, left to right and top to bottom, like words on a page.
      </p>
      <Fig caption="Illustrative: an image cut into a 4 × 4 grid of patches, which join the same sequence as the text tokens of a question. Press Play or step through one patch at a time. Real models use many more patches, and marker tokens like <image> vary from model to model.">
        <PatchSequence />
      </Fig>

      <h2>From a patch to a vector</h2>
      <p>
        A patch is still just pixels. To turn it into a token vector, the model does two simple things.
      </p>
      <ul>
        <li>
          <strong>Flatten it.</strong> A 16 × 16 patch with three colour values per pixel is 16 × 16 × 3 = 768 numbers. Lay them out in one long list.
        </li>
        <li>
          <strong>Project it.</strong> Multiply that list by a learned matrix to get a vector of the size the transformer expects. This plays the same role as the lookup table that turns a text token ID into an <ArticleLink slug="what-are-embeddings">embedding</ArticleLink>.
          (In the base-sized ViT, the output also happens to be 768 numbers long.)
        </li>
      </ul>
      <p>
        Finally, a <strong>position embedding</strong> is added to each vector, so the model knows where in the image the patch came from; without it, a shuffled image would look the same.
        From here on, the patch vectors go through ordinary <ArticleLink slug="attention-and-transformers">attention layers</ArticleLink>, where every patch can look at every other patch.
      </p>
      <p>
        Patch size is a trade-off, just like vocabulary size for text. Smaller patches keep more detail but produce many more tokens, and the cost of attention grows quickly with sequence length.
      </p>
      <Fig caption="How many tokens an image becomes. Halving the patch size, or doubling the image size, gives four times as many tokens. The arithmetic is exact; 224 × 224 pixels with 16 × 16 patches (196 tokens) is the standard ViT setup.">
        <PatchCalculator />
      </Fig>

      <h2>Continuous patches or discrete codes?</h2>
      <p>
        There is one real difference from text. A text token is one entry from a fixed vocabulary, so the model can predict it by picking from a list. A patch vector is <strong>continuous</strong>: its numbers can be anything, and there is no list.
        For <em>understanding</em> images that is fine; most vision encoders, including ViT, work this way.
      </p>
      <p>
        For <em>generating</em> images one token at a time, some models first turn images into <strong>discrete</strong> tokens.
        A separately trained network, such as a VQ-VAE (vector-quantised variational autoencoder), learns a <strong>codebook</strong>: a fixed list of typical little image pieces.
        Each region of an image is replaced by the ID of its closest codebook entry, so an image becomes a grid of IDs, exactly like text.
        The original DALL·E, for example, turned each 256 × 256 image into a 32 × 32 grid of 1,024 image tokens, each chosen from a codebook of 8,192 entries, and placed them after up to 256 text tokens in one sequence.
      </p>
      <Fig caption="The two ways of turning a picture into tokens. Examples are from the ViT, VQ-VAE and DALL·E papers.">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col"></th><th scope="col">Continuous patch embeddings</th><th scope="col">Discrete image tokens</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">A token is</th><td>A vector computed from a patch’s pixels</td><td>An ID from a learned codebook</td></tr>
              <tr><th scope="row">Vocabulary</th><td>None: any vector is possible</td><td>Fixed, e.g. 8,192 codes in DALL·E</td></tr>
              <tr><th scope="row">Good for</th><td>Understanding: classifying, describing, answering questions</td><td>Generating images token by token, like text</td></tr>
              <tr><th scope="row">Example</th><td>ViT: 16 × 16 pixel patches</td><td>DALL·E: 32 × 32 grid of codes</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Audio: slices of sound</h2>
      <p>
        Sound is a wave: a long list of air-pressure measurements, often 16,000 or more per second. That is far too many to use one per token, and single measurements mean nothing on their own.
      </p>
      <p>
        So speech models usually start by computing a <strong>spectrogram</strong>, a picture of which frequencies are loud at each moment. Time runs along one axis and pitch along the other, and each short slice of time becomes a column of numbers.
        OpenAI’s Whisper speech recogniser, for instance, takes 30-second clips, computes an 80-channel spectrogram with a new slice every 10 milliseconds (3,000 slices), and two small convolution layers then halve that to 1,500 vectors before the transformer reads them.
      </p>
      <Fig caption="Illustrative: from a sound wave to a spectrogram to a sequence of audio vectors. One highlighted slice of time becomes one token. The spectrogram colours here are drawn by hand, not computed from real audio.">
        <div className={s.tableWrap}><AudioPipeline /></div>
      </Fig>
      <p>
        Audio has its discrete version too. <strong>Neural audio codecs</strong>, such as Meta’s EnCodec, compress sound into a stream of codebook IDs, several per slice of time.
        Those IDs can be predicted one after another like text, which is how some speech and music generators produce audio.
      </p>

      <h2>Video: patches in space and time</h2>
      <p>
        A video is a stack of images. The simplest approach tokenizes each frame into patches, but that multiplies the token count by the number of frames.
        Video transformers such as ViViT instead cut the video into <strong>tubelets</strong>: small boxes that span a patch of the picture <em>and</em> a few consecutive frames.
        Each tubelet is flattened and projected into one vector, so a single token captures a little bit of motion as well as appearance.
        Even so, video is expensive: a few seconds can produce thousands of tokens, which is why video models often sample only some of the frames.
      </p>

      <h2>Putting it all in one sequence</h2>
      <p>
        A multimodal model is often built from parts. A common recipe, used by the open-source LLaVA model, is:
      </p>
      <ul>
        <li>a pre-trained <strong>vision encoder</strong> (in LLaVA’s case, CLIP’s ViT) turns the image into patch vectors;</li>
        <li>a small learned <strong>projection</strong> maps each of those vectors into the same space as the language model’s word embeddings, so they have the right length and “speak the same language”;</li>
        <li>the resulting image tokens are placed in the sequence next to the text tokens, and the language model reads them all together.</li>
      </ul>
      <p>
        Inside the transformer there is no special treatment. A text token can attend to an image patch exactly as it attends to another word, which is how a question like “What colour is the sun?” finds the patch that contains the sun.
      </p>
      <Callout title="The big idea">
        Anything that can be cut into pieces and turned into vectors can be fed to a transformer. Text, image patches, spectrogram slices and video tubelets are all just tokens by the time attention sees them.
      </Callout>
      <p>
        The pieces also cost the same thing: space in the <strong>context window</strong>. An image or a minute of audio can use as many tokens as several paragraphs of text, which is why the same limits and prices apply.
        For how text tokens are chosen, see <ArticleLink slug="why-tokens">Why models read tokens</ArticleLink>; for what happens to all these vectors once they are in the sequence, see <ArticleLink slug="how-llms-work">How a language model turns your words into an answer</ArticleLink>.
      </p>

      <FurtherReading links={[
        { href: "https://arxiv.org/abs/2010.11929", title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", source: "Dosovitskiy et al. · arXiv", note: "the Vision Transformer paper" },
        { href: "https://arxiv.org/abs/2304.08485", title: "Visual Instruction Tuning (LLaVA)", source: "Liu et al. · arXiv", note: "joining a vision encoder to a language model" },
        { href: "https://arxiv.org/abs/2103.15691", title: "ViViT: A Video Vision Transformer", source: "Arnab et al. · arXiv" },
      ]} />
    </>
  );
}
