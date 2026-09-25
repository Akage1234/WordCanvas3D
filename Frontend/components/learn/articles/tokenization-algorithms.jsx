import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import s from "./tokenization-algorithms.module.css";
import { BpeApply, BpeTrainer } from "./tokenization-algorithms.figures";

export const minutes = 6;

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
        In <ArticleLink slug="why-tokens">Why models read tokens</ArticleLink> we saw that modern language models read text as <strong>subword</strong> pieces:
        common words stay whole, and rare words are built from smaller parts. But who decides that <code>lowest</code> should become <code>low</code> + <code>est</code>?
      </p>
      <p>
        Nobody does, by hand. A tokenizer <em>learns</em> its vocabulary from a large sample of text, called the <strong>training corpus</strong>, before the language model itself is trained.
        This article walks through the three recipes almost every model uses: <strong>byte-pair encoding</strong> (BPE), <strong>WordPiece</strong> and <strong>Unigram</strong>.
      </p>

      <h2>Byte-pair encoding: merge the most common pair</h2>
      <p>
        BPE began life in 1994 as a data compression trick by Philip Gage. In 2016, Rico Sennrich and colleagues adapted it to split words for machine translation, and it spread from there.
        The idea fits in one sentence: <strong>start from single characters, and keep gluing together the pair of neighbours that appears most often.</strong>
      </p>
      <p>In more detail, training repeats three steps.</p>
      <ul>
        <li><strong>Count pairs.</strong> Look at every word in the corpus, split into its current pieces, and count how often each pair of neighbouring pieces occurs.</li>
        <li><strong>Merge the winner.</strong> Take the most frequent pair, say <code>e</code> + <code>s</code>, add the joined piece <code>es</code> to the vocabulary, and replace that pair everywhere in the corpus.</li>
        <li><strong>Repeat</strong> until the vocabulary reaches the size you chose in advance.</li>
      </ul>
      <p>
        The output is two things: the <strong>vocabulary</strong> (every piece the tokenizer knows) and the <strong>merge list</strong> (the merges, in the order they were learned). Step through it on a tiny corpus of four words.
      </p>
      <Fig caption="BPE training on a toy corpus of four words, where “low” appears 5 times, “lower” 2, “newest” 6 and “widest” 3 (the example from Sennrich et al.). Each step counts neighbouring pairs, weighted by how often the word appears, and merges the most frequent one (highlighted). Ties go to the pair seen first. All numbers are computed live from the corpus.">
        <BpeTrainer />
      </Fig>
      <p>
        Watch what the merges discover. The first two build <code>est</code>, because it appears in both <code>newest</code> and <code>widest</code>.
        Then <code>low</code> appears, then <code>new</code>, and by merge 7 the frequent word <code>newest</code> is a single token. The rarer <code>lower</code> is still <code>low</code> + <code>e</code> + <code>r</code>.
        That is exactly the behaviour we want: frequent strings become whole tokens, and rare ones are left in reusable parts.
      </p>
      <p>
        A real tokenizer does the same thing on gigabytes of text and stops after tens of thousands of merges.
        In the real GPT-2 tokenizer, the very first merges learned were a space followed by <code>t</code>, a space followed by <code>a</code>, then <code>he</code>, <code>in</code>, <code>re</code> and <code>on</code>: the most common letter pairs of English.
      </p>

      <h2>Using the merges on new text</h2>
      <p>
        Once training is done, the corpus is thrown away. To tokenize a new word, the tokenizer splits it into characters and replays the merge list <em>in the order it was learned</em>, applying each merge wherever it fits.
        Whatever is left at the end is the list of tokens.
      </p>
      <Fig caption="Applying the 10 merges learned above to new words (illustrative toy vocabulary). “lowest” never appeared in the corpus, yet it comes out as low + est. The real GPT-2 tokenizer happens to split “lowest”, written without a leading space, the same way.">
        <BpeApply />
      </Fig>
      <p>
        This is why subword tokenizers never meet a truly unknown word: in the worst case, like <code>rider</code> here, a word just stays as single characters.
        There is one catch. Our toy vocabulary only contains the ten letters that appeared in the corpus, so a word with a <code>k</code> in it could not be written at all. Real tokenizers solve that with bytes, which we will come back to.
      </p>

      <h2>WordPiece: merge the most surprising pair</h2>
      <p>
        WordPiece was developed at Google and is best known as the tokenizer of <strong>BERT</strong> and many BERT-style models, such as DistilBERT.
        Its training loop looks like BPE’s: start from characters, merge pairs, repeat. The difference is <em>which</em> pair it merges.
      </p>
      <p>
        BPE picks the pair that appears most often. WordPiece divides that count by how often each part appears on its own:
      </p>
      <p style={{ textAlign: "center" }}>
        <code>score = count(pair) / (count(first) × count(second))</code>
      </p>
      <p>
        A pair scores highly when its two parts almost always appear <em>together</em>. Very common pieces, like the letter <code>e</code>, are penalised, because seeing them next to something is not surprising.
        (Formally, WordPiece picks the merge that most increases the likelihood of the training data. Google never released its training code, and this ratio is how open implementations such as Hugging Face’s make that choice.)
      </p>
      <Fig caption="The first merge on the same toy corpus. BPE merges e + s because it is the most frequent pair. WordPiece prefers w + i: it only appears 3 times, but w and i never appear apart. Counts are computed from the corpus; in WordPiece, pieces inside a word carry a ## prefix, so the w in “low” and the w at the start of “widest” are counted separately.">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col">pair</th><th scope="col">BPE: count</th><th scope="col">count ÷ (first × second)</th><th scope="col">WordPiece score</th></tr>
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
        WordPiece also writes its tokens differently. A piece that continues a word starts with <code>##</code>, so a word like <code>hugs</code> might be split as <code>hug</code> + <code>##s</code>.
        That makes word boundaries visible in the tokens themselves.
        And when tokenizing new text, WordPiece does not replay merges. It scans each word from the left and repeatedly takes the <strong>longest piece in its vocabulary</strong> that matches. If some part cannot be matched at all, the whole word becomes <code>[UNK]</code>.
      </p>

      <h2>Unigram: start big and prune</h2>
      <p>
        The Unigram method, introduced by Taku Kudo in 2018, runs in the opposite direction. Instead of growing a vocabulary from characters, it starts with a very <em>large</em> vocabulary, for example many of the common substrings in the corpus, and shrinks it.
      </p>
      <ul>
        <li>Every piece in the vocabulary gets a probability, estimated from the corpus.</li>
        <li>A word can usually be split in many ways (<code>low</code>+<code>est</code>, <code>lo</code>+<code>west</code>, <code>l</code>+<code>owest</code>…). The tokenizer picks the split whose pieces have the highest combined probability.</li>
        <li>In each training round, it works out how much worse the fit to the corpus would get if each piece were removed, and deletes the pieces that matter least, typically 10 to 20% of them. Single characters are always kept, so every word stays writable.</li>
        <li>This repeats until the vocabulary is the target size.</li>
      </ul>
      <p>
        Because Unigram is a probability model, it can also <em>sample</em> different splits of the same word during training, a trick called subword regularisation that makes models more robust to unusual spellings.
      </p>
      <p>
        Unigram is usually used through <strong>SentencePiece</strong>, a Google library that trains directly on raw text, treating the space as an ordinary symbol (written <code>▁</code>), so it works the same way for languages with or without spaces.
        SentencePiece implements both Unigram and BPE. T5, ALBERT and XLNet use Unigram; the original LLaMA models used SentencePiece’s BPE mode.
      </p>

      <h2>Byte-level BPE: never unknown</h2>
      <p>
        Back to the catch from earlier: a character-based vocabulary cannot write a character it has never seen. <strong>Byte-level BPE</strong>, introduced with GPT-2 in 2019, fixes this by running BPE on the <strong>bytes</strong> of the text (its UTF-8 encoding) instead of on characters.
        There are only 256 possible bytes, and all of them start out in the vocabulary, so any string at all, in any language, emoji included, can be tokenized. There is no <code>[UNK]</code> token.
      </p>
      <p>
        Two more details make it work in practice. First, the text is <strong>pre-tokenized</strong>: a pattern splits it into rough chunks (words with their leading space, numbers, punctuation) before BPE runs, so merges never glue the end of one word to the start of the next.
        Second, the space is kept as part of the following word, which is why GPT-style tokens look like <code>·the</code>. GPT-2, RoBERTa and the GPT-3/GPT-4 family’s tokenizers all use byte-level BPE.
      </p>

      <h2>The three side by side</h2>
      <Fig caption="A summary of the three algorithms. Real tokenizers add details on top, such as special tokens, normalisation and pre-tokenization rules.">
        <div className={s.tableWrap}>
          <table className={`${s.tbl} ${s.compare}`}>
            <thead>
              <tr><th scope="col"></th><th scope="col">BPE</th><th scope="col">WordPiece</th><th scope="col">Unigram</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Training</th><td>Grow: merge the most frequent pair</td><td>Grow: merge the pair with the best score</td><td>Shrink: prune the least useful pieces</td></tr>
              <tr><th scope="row">Tokenizing</th><td>Replay the merges in order</td><td>Longest match, left to right</td><td>Most probable split</td></tr>
              <tr><th scope="row">Unknown text</th><td>Byte-level: never unknown</td><td><code>[UNK]</code> for the word</td><td>Single characters; unseen characters become <code>&lt;unk&gt;</code> unless byte fallback is on</td></tr>
              <tr><th scope="row">Used by</th><td>GPT-2, RoBERTa, GPT-4 (byte-level); LLaMA (via SentencePiece)</td><td>BERT, DistilBERT</td><td>T5, ALBERT, XLNet (via SentencePiece)</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>
      <Callout title="Keep in mind">
        None of these algorithms knows any grammar. <code>est</code> became a token because it was frequent in the corpus, not because it is a suffix. Change the training text and you get a different vocabulary.
      </Callout>
      <p>
        That last point has real consequences. A tokenizer trained mostly on English splits other languages into more, smaller pieces, which makes them slower and more expensive to process; see <ArticleLink slug="why-emoji-cost-more-tokens">Why emoji and some languages cost more tokens</ArticleLink>.
        Once text is tokens, each token ID is turned into a vector, as explained in <ArticleLink slug="what-are-embeddings">What are embeddings?</ArticleLink>
        You can compare the splits of several real BPE tokenizers on your own text in the <a href="/tokenizer">Tokenizer</a>.
      </p>

      <FurtherReading links={[
        { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM Course", note: "sections 6 and 7 cover WordPiece and Unigram" },
        { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · video", note: "builds byte-level BPE from scratch" },
        { href: "https://arxiv.org/abs/1508.07909", title: "Neural Machine Translation of Rare Words with Subword Units", source: "Sennrich, Haddow & Birch · arXiv" },
        { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia" },
      ]} />
    </>
  );
}
