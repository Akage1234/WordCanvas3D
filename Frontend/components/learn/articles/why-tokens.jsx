import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import l from "../learn.module.css";
import s from "./why-tokens.module.css";
import { ThreeWaySplit } from "./why-tokens.figures";

export const minutes = 6;

const [RED, TEAL, , YELLOW] = CLUSTER_COLORS;

// Counts for the Austen sentence below: characters and words counted directly, tokens with o200k_base.
const LENGTHS = [["characters", 117, RED], ["words", 23, TEAL], ["tokens (o200k_base)", 26, YELLOW]];

function Chips({ label, items }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {items.map((t, i) => {
        const [text, sub] = [].concat(t);
        return (
          <span key={i} className={l.chip} style={{ "--tc": text === "[UNK]" ? "#8a93a3" : CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
            <b>{text}</b>
            {sub && <small>{sub}</small>}
          </span>
        );
      })}
    </div>
  );
}

export default function WhyTokens() {
  return (
    <>
      <p>
        A language model is a program that does arithmetic. It cannot read the letters on your screen directly.
        Before it can do anything with your text, the text has to be chopped into small units and each unit swapped for a number.
        Those units are called <strong>tokens</strong>, and the chopping is called <strong>tokenization</strong>.
      </p>
      <p>
        The obvious question is: what should a unit be? A single letter? A whole word? Every modern model answers “something in between”, and this article explains why.
        It comes down to one trade-off between how many different units you allow and how many of them it takes to write a sentence.
      </p>

      <h2>Two numbers that pull against each other</h2>
      <p>
        Whatever unit you pick, two numbers describe the result.
      </p>
      <ul>
        <li>
          The <strong>vocabulary</strong> is the fixed list of every unit the model knows. Each entry gets an ID, and the model learns a separate set of numbers for every entry.
          A bigger vocabulary means more to learn and store.
        </li>
        <li>
          The <strong>sequence length</strong> is how many units it takes to write a particular text. Longer sequences mean more work every time the model reads or writes.
        </li>
      </ul>
      <p>
        Small units give a small vocabulary but long sequences. Big units give short sequences but a huge vocabulary. Try it below: the same text, cut three ways.
      </p>
      <Fig caption="One text split into characters, into words (wherever there is a space), and into the subword tokens of o200k_base, the tokenizer used by GPT-4o. The examples are precomputed; typing your own text loads the real tokenizer in your browser. A · marks a space, and <F0 9F> style labels are raw bytes that are only part of a character.">
        <ThreeWaySplit />
      </Fig>
      <p>
        Look at a few of the examples. Characters always give the longest row. Words give the shortest row for English, but they fall apart on Japanese, which is written without spaces,
        so the whole sentence becomes one “word”. The subword row is close to the word row in length, yet it copes with every example.
      </p>

      <h2>Option one: characters</h2>
      <p>
        Using one token per character has real appeal. The vocabulary is small and never runs out: any text is just a string of characters, so the model can never meet something it cannot write down.
      </p>
      <p>
        The problem is length. A character carries very little meaning on its own. The letter <code>t</code> tells the model almost nothing, so the model has to spend its effort gluing letters back into words before it can think about what they mean.
        And every text becomes several times longer than it needs to be.
      </p>
      <p>
        Length matters for two concrete reasons. First, compute: in a <ArticleLink slug="attention-and-transformers">transformer</ArticleLink>, every token looks at every other token,
        so that part of the work grows with the square of the length. Double the length and that part costs about four times as much.
        Second, the <strong>context window</strong>, the maximum number of tokens a model can take in at once, is a fixed budget. If each token holds less text, less of your document fits.
      </p>
      <Fig caption="The same sentence (the opening line of Pride and Prejudice) measured three ways. Character and word counts are exact; the token count comes from the o200k_base tokenizer.">
        <p className={s.quote}>“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”</p>
        <dl className={s.bars}>
          {LENGTHS.map(([name, n, c]) => (
            <div key={name} style={{ display: "contents" }}>
              <dt>{name}</dt>
              <dd style={{ "--tc": c }}><i style={{ "--w": `${(n / 117) * 85}%` }} />{n}</dd>
            </div>
          ))}
        </dl>
      </Fig>

      <h2>Option two: whole words</h2>
      <p>
        Whole words fix the length problem: in English, the token count is close to the word count. Each unit also means something. But three problems appear.
      </p>
      <ul>
        <li>
          <strong>The vocabulary explodes.</strong> English alone has hundreds of thousands of word forms once you count plurals, tenses and compounds (<code>run</code>, <code>runs</code>, <code>running</code>, <code>rerun</code>…).
          Add names, numbers, typos, hashtags, code and other languages, and no list is ever complete.
        </li>
        <li>
          <strong>Unknown words.</strong> Anything missing from the list has to be replaced by a single catch-all token, usually written <code>[UNK]</code>.
          Every unknown word looks identical to the model, so its meaning is simply lost.
        </li>
        <li>
          <strong>Not every language uses spaces.</strong> Chinese, Japanese and Thai don’t put spaces between words, so “split at spaces” doesn’t even define what a word is.
        </li>
      </ul>
      <p>
        Rare words cause a quieter problem too. A word that appears only a handful of times in the training text gets its own vocabulary entry, but the model sees too few examples to learn much about it.
      </p>
      <Fig caption="Top row (illustrative): what a word-level tokenizer trained only on English text would do with a German sentence and an emoji. Everything it has never seen becomes the same [UNK] token. Bottom row (real): the o200k_base subword tokens for the same text; nothing is lost.">
        <Chips label="word-level, English-only vocabulary (illustrative)" items={[["[UNK]", "Grüße"], ["[UNK]", "aus"], ["[UNK]", "München!"], ["[UNK]", "🦒"]]} />
        <Chips label="subword tokens, o200k_base (real)" items={["Gr", "ü", "ße", "·aus", "·München", "!", "·<F0 9F>", "<A6>", "<92>"]} />
      </Fig>

      <h2>The compromise: subword pieces</h2>
      <p>
        Subword tokenization takes the useful half of each option. Common words, and common words with a space in front, get a single token of their own, so everyday English stays short.
        Rare words are spelled out from a few smaller pieces that are themselves common: in the example above, <code>Tokenizers</code> becomes <code>Token</code> + <code>izers</code>.
        The pieces are reusable, so the model learns what <code>izers</code> tends to mean from many different words.
      </p>
      <p>
        The vocabulary stays at a size a model can afford. GPT-2’s tokenizer has about 50,000 entries, the <code>cl100k_base</code> tokenizer used by GPT-4 has about 100,000, and <code>o200k_base</code> has about 200,000.
        That sounds large, but it is fixed and finite, unlike a list of every word.
      </p>
      <Callout title="In one sentence">
        Subword tokens keep sequences nearly as short as words while never running into a word they cannot write.
      </Callout>
      <p>
        Which pieces make the list is not decided by a linguist. The tokenizer learns them from a large sample of text, keeping the chunks that occur most often.
        That is why tokens rarely line up with dictionary syllables or prefixes. How that learning works is the subject of <ArticleLink slug="tokenization-algorithms">How tokenizers are built</ArticleLink>.
      </p>

      <h2>Bytes: the safety net</h2>
      <p>
        One question remains: what if even the smallest pieces are missing? There are well over 100,000 characters in Unicode, the standard that covers the world’s writing systems and emoji.
        Putting all of them in the vocabulary would waste space on characters that almost never appear.
      </p>
      <p>
        The trick used by GPT-style tokenizers is to work on <strong>bytes</strong> instead. Computers store text as bytes using an encoding called UTF-8: a plain English letter is one byte,
        an accented letter like <code>ü</code> is two, and most emoji are four. There are only 256 possible byte values, so if all 256 are in the vocabulary, any text at all can be written down, one byte at a time if necessary.
      </p>
      <p>
        You can see this in the German example. The giraffe emoji 🦒 is rare, so there is no single token for it. Instead it is split into its raw bytes: a token for a space plus the first two bytes <code>F0 9F</code>,
        then <code>A6</code>, then <code>92</code>. None of those pieces is a character on its own, but together they rebuild the emoji exactly.
        Nothing is ever unknown; rare things just cost more tokens. (<ArticleLink slug="why-emoji-cost-more-tokens">Why emoji and some languages cost more tokens</ArticleLink> looks at this in detail.)
      </p>
      <p>
        Some tokenizers, such as the SentencePiece tokenizer used by the original LLaMA models, work on characters first and only drop down to bytes for characters they have never seen. The effect is the same: no text is ever unrepresentable.
      </p>

      <h2>What this means in practice</h2>
      <ul>
        <li><strong>Limits and prices are in tokens.</strong> Context windows and most API prices count tokens, not words. A common rule of thumb for English is that a token is about three quarters of a word, but it varies a lot with language and content.</li>
        <li><strong>The same text can cost different amounts.</strong> Different models use different tokenizers, so the same sentence can be a different number of tokens in each.</li>
        <li><strong>The model does not see letters.</strong> <code>·unbelievably</code> is one token with one ID. The model never directly sees the letters inside it, which is part of why spelling and letter-counting questions can trip models up.</li>
      </ul>
      <p>
        Once text is a list of token IDs, the next step inside a model is to turn each ID into a list of meaningful numbers. That is the idea behind <ArticleLink slug="what-are-embeddings">embeddings</ArticleLink>,
        and <ArticleLink slug="how-llms-work">How a language model turns your words into an answer</ArticleLink> shows where both steps fit in the whole pipeline.
        To split your own text with several real tokenizers side by side, try the <Link href="/tokenizer">Tokenizer</Link>.
      </p>

      <FurtherReading links={[
        { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM Course", note: "chapter 6 covers tokenizers in depth" },
        { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · video" },
        { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia" },
      ]} />
    </>
  );
}
