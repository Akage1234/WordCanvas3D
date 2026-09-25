import Link from "next/link";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import l from "../learn.module.css";
import h from "./how-llms-work.module.css";
import { PipelineFigure } from "./how-llms-work.figures";

export const minutes = 8;

const [RED, TEAL] = CLUSTER_COLORS;

function Chips({ label, items }) {
  return (
    <div className={l.row}>
      {label && <span className={l.rowLabel}>{label}</span>}
      {items.map(([text, sub], i) => (
        <span key={i} className={l.chip} style={{ "--tc": CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
          <b>{text}</b>
          {sub !== undefined && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

// Illustrative numbers only: a fixed pseudo-random pattern per seed.
function vec(seed) {
  let x = seed % 233280;
  return Array.from({ length: 8 }, () => {
    x = (x * 9301 + 49297) % 233280;
    return (x / 233280) * 2 - 1;
  });
}

function Cells({ label, values, hit }) {
  return (
    <div className={`${h.trow} ${hit ? h.hit : ""}`}>
      <span>{label}</span>
      {values.map((v, i) => (
        <i key={i} style={{ background: `color-mix(in srgb, ${v >= 0 ? TEAL : RED} ${Math.round(Math.abs(v) * 80) + 12}%, transparent)` }} />
      ))}
    </div>
  );
}

const Gap = ({ children = "⋮" }) => <div className={h.gap}>{children}</div>;

const TABLE_ROWS = [[290, "·the"], [402, "·on"], [976, "The"], [9059, "·cat"], [10139, "·sat"]];

const PROBS = [["·mat", 0.38], ["·floor", 0.17], ["·bed", 0.08], ["·couch", 0.06], ["·rug", 0.04]];

export default function HowLlmsWork() {
  return (
    <>
      <p>
        You type <em>“The cat sat on the”</em> and a chatbot suggests <em>“mat”</em>. It feels like the model read your sentence, thought about it and answered.
        What actually happens is a fixed chain of simple steps that turns text into numbers, runs arithmetic on those numbers,
        and turns the result back into text. This article walks through that chain once, end to end, with no maths background assumed.
      </p>
      <p>
        A <strong>language model</strong> is a program trained to continue text. A <strong>large</strong> language model (LLM) is the same idea at a huge scale:
        billions of adjustable numbers, trained on a large share of the text people have written. Everything below applies to the models behind ChatGPT, Claude, Gemini or Llama.
      </p>
      <Callout title="In one sentence">
        A language model cuts your text into tokens, turns each token into a list of numbers, lets those lists exchange information through many layers,
        and then scores every possible next token, picks one, adds it to the text, and repeats.
      </Callout>

      <h2>Entire LLM process, simplified</h2>
      <figure className={h.wide}>
        <PipelineFigure />
        <figcaption>One pass for “The cat sat on the” → “ mat”, then a second pass that adds “.”. Token IDs are real (o200k_base tokenizer, used by GPT-4o). The vectors, attention weights, layer count, scores and probabilities are illustrative, not taken from a real model.</figcaption>
      </figure>
      <p>The rest of the article takes those steps one at a time.</p>

      <h2>1. Text becomes tokens</h2>
      <p>
        A model can’t work with letters directly, so the first step is a <strong>tokenizer</strong>: a separate program that cuts text into pieces called <strong>tokens</strong>.
        A token is often a whole common word, sometimes a piece of a word, a punctuation mark or a space. Rare words are built from several smaller pieces.
      </p>
      <Fig caption="The same word cut two ways by the o200k_base tokenizer. At the very start of a text it is rare, so it is built from three pieces. After a space, as it usually appears, it is common enough to be one token. The dot marks the space.">
        <Chips label="“unbelievable” at the start of a text · 3 tokens" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="“ unbelievable” after a space · 1 token" items={[["·unbelievable"]]} />
      </Fig>
      <p>
        Why pieces, rather than letters or whole words, is a story of its own: see <ArticleLink slug="why-tokens">why models read tokens, not letters or words</ArticleLink>,
        and <ArticleLink slug="tokenization-algorithms">how tokenizers are built</ArticleLink> for the algorithm that picks the pieces.
      </p>

      <h2>2. Tokens become ID numbers</h2>
      <p>
        Every tokenizer has a fixed <strong>vocabulary</strong>: a numbered list of all the pieces it knows. For <code>o200k_base</code> that list has about 200,000 entries.
        Each token is replaced by its number in the list, its <strong>token ID</strong>. Our sentence becomes <code>976 9059 10139 402 290</code>.
      </p>
      <p>
        These numbers are only positions in a list, like seat numbers. Token 9059 (<code>·cat</code>) is not “bigger” or “more” than token 402 (<code>·on</code>) in any useful sense.
        The model needs something richer to work with.
      </p>

      <h2>3. IDs become vectors</h2>
      <p>
        Inside the model sits a huge table with one row per vocabulary entry. Each row is a <strong>vector</strong>: a list of numbers, typically a few thousand long in a large model.
        Looking up a token’s row gives its <strong>embedding</strong>. Nobody writes these numbers by hand. They start random and are adjusted during training,
        until tokens used in similar ways end up with similar rows.
      </p>
      <Fig caption="The embedding table as a lookup: each token ID selects one row. Colours stand for numbers (teal positive, red negative). Illustrative: only 8 of the thousands of columns are drawn, and the values are made up.">
        <div className={h.table} role="img" aria-label="An embedding table: rows for token IDs 290, 402, 976, 9059 and 10139, each a row of eight coloured cells. Row 9059, ·cat, is highlighted.">
          <p className={h.sub}>row = token ID · columns = numbers in the vector</p>
          <Gap />
          {TABLE_ROWS.map(([id, t]) => (
            <div key={id}>
              <Cells label={`${id} ${t}`} values={vec(id)} hit={id === 9059} />
              <Gap />
            </div>
          ))}
          <Gap>about 200,000 rows in total</Gap>
        </div>
      </Fig>
      <p>
        That idea, meaning as position in a space of numbers, is the heart of <ArticleLink slug="what-are-embeddings">what embeddings are</ArticleLink>,
        and <ArticleLink slug="latent-space">latent space</ArticleLink> explores what the directions in that space can capture.
      </p>

      <h2>4. The transformer: tokens look at each other</h2>
      <p>
        At this point each vector describes its token alone. The word “bank” gets the same starting vector in “river bank” and in “bank account”.
        The main body of the model, the <strong>transformer</strong>, fixes that. It is a stack of identical-looking <strong>layers</strong>, dozens of them in a large model.
      </p>
      <p>
        Each layer does two things. First, <strong>attention</strong>: every token looks back at the tokens before it, decides which ones matter for it, and mixes in information from them.
        Then a small neural network updates each vector on its own. After many layers, each vector describes its token <em>in context</em>.
      </p>
      <Fig caption="The same token “·bank” enters the layers with an identical vector in both sentences. After attention has mixed in the surrounding words, the two vectors differ. Illustrative values.">
        <div className={l.pair} role="img" aria-label="Two sentences, river bank and bank account. Before the layers the two bank vectors are identical; after the layers they are different.">
          {[["I sat by the river bank", 11], ["I opened a bank account", 29]].map(([sentence, seed]) => (
            <div key={seed} className={h.table}>
              <h3>{sentence}</h3>
              <Cells label="·bank in" values={vec(4101)} />
              <Cells label="·bank out" values={vec(4101 * seed)} />
            </div>
          ))}
        </div>
      </Fig>
      <p>
        Attention is the idea that made modern language models work so well. It gets a full, step-by-step treatment in <ArticleLink slug="attention-and-transformers">attention and the transformer, explained from scratch</ArticleLink>.
      </p>

      <h2>5. Only the last position predicts</h2>
      <p>
        After the final layer there is still one vector per token. To choose the next token, the model uses only the vector at the <strong>last position</strong>, the one for <code>·the</code> in our example.
        Because attention let it gather information from every earlier token, that single vector now carries what the model has worked out about the whole sentence.
      </p>

      <h2>6. A score for every token: logits</h2>
      <p>
        The last vector is compared against every entry in the vocabulary, producing one score per token: about 200,000 numbers.
        These raw scores are called <strong>logits</strong>. A higher logit means the model rates that token as a better continuation. On their own, logits are hard to read:
        they can be negative and they don’t add up to anything in particular.
      </p>

      <h2>7. Scores become probabilities: softmax</h2>
      <p>
        A function called <strong>softmax</strong> turns the logits into <strong>probabilities</strong>. It makes every value positive and scales them so they add up to 100%.
        Bigger logits get a much bigger share, because softmax exponentiates each score: two points more of logit means about 7 times more probability.
      </p>
      <Fig caption="Logits and the probabilities softmax makes from them, for the five most likely tokens after “The cat sat on the”. Illustrative numbers, chosen so they are consistent with each other; the remaining ~200,000 tokens share the last 27%.">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>next token</th><th>logit</th><th>probability</th></tr></thead>
            <tbody>
              {PROBS.map(([t, p]) => (
                <tr key={t}><td>{t}</td><td>{(Math.log(p) + 10).toFixed(1)}</td><td>{Math.round(p * 100)}%</td></tr>
              ))}
              <tr><td>everything else</td><td>lower</td><td>27%</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>8. Picking one token</h2>
      <p>
        Now the model has a probability for every token, and something has to choose. The simplest rule, <strong>greedy decoding</strong>, always takes the top one.
        Most chat systems instead <strong>sample</strong>: they draw at random, weighted by the probabilities, so the same prompt can give different answers.
      </p>
      <p>
        Settings shape that draw. <strong>Top-k</strong> sampling keeps only the k most likely tokens and rescales them to 100% before drawing, so wildly unlikely tokens can never appear.
        <strong> Temperature</strong> makes the probabilities sharper or flatter. <ArticleLink slug="next-token-prediction">From the last vector to the next word</ArticleLink> shows each of these with interactive examples.
      </p>

      <h2>9. Append and repeat</h2>
      <p>
        The chosen token, <code>·mat</code> (ID 2450), is added to the end of the text. Then the <em>whole</em> pipeline runs again on the longer text to choose the token after it,
        and again after that. A reply of 300 tokens is 300 passes. This loop is why answers appear on screen word by word.
      </p>
      <Fig caption="Each pass reads everything so far and adds one token. The loop stops when the model produces a special end-of-text token or reaches a length limit.">
        <div className={h.growth}>
          <Chips label="pass 1 reads 5 tokens → adds ·mat" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"]]} />
          <Chips label="pass 2 reads 6 tokens → adds ." items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"]]} />
          <Chips label="pass 3 reads 7 tokens → …" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"], ["."]]} />
        </div>
      </Fig>
      <p>
        Real systems avoid redoing all the work each pass by saving intermediate results for tokens they have already processed, but the logic is the same:
        one pass, one new token.
      </p>

      <h2>Where the numbers come from</h2>
      <p>
        Every number the model uses, the embedding table, the attention layers and the final scoring, is a <strong>parameter</strong> learned in training.
        Training shows the model enormous amounts of text, asks it to predict each next token, and nudges all the parameters slightly so the true next token becomes a little more likely.
        Repeated over trillions of tokens, those nudges add up to a model that continues text well. Chat assistants get further training on conversations so their continuations read as helpful answers.
      </p>

      <h2>Common misconceptions</h2>
      <ul>
        <li>
          <strong>“It writes the whole answer at once.”</strong> It doesn’t. It predicts a single token, adds it, and runs again.
          It has no finished answer waiting; each token is chosen given only the text so far.
        </li>
        <li>
          <strong>“It looks the answer up.”</strong> There is no database of questions and answers inside. There is only the fixed set of learned parameters,
          and the answer is computed fresh from them every time. That is also why a model can state something false with confidence: nothing checks the result against a source.
        </li>
        <li>
          <strong>“It understands like a person does.”</strong> What the model has are statistical patterns learned from text, rich enough to capture grammar, facts and some reasoning.
          Whether that counts as understanding is debated. What is certain is that it learned from text, not from seeing, touching or living in the world.
        </li>
      </ul>

      <h2>Where to go next</h2>
      <p>
        Each step above has its own article: <ArticleLink slug="why-tokens">tokens</ArticleLink>, <ArticleLink slug="tokenization-algorithms">tokenizers</ArticleLink>,{" "}
        <ArticleLink slug="what-are-embeddings">embeddings</ArticleLink>, <ArticleLink slug="latent-space">latent space</ArticleLink>,{" "}
        <ArticleLink slug="attention-and-transformers">attention</ArticleLink> and <ArticleLink slug="next-token-prediction">choosing the next token</ArticleLink>.
        On this site you can split your own text with the <Link href="/tokenizer">Tokenizer</Link> and explore word vectors in the <Link href="/embedding">Embedding explorer</Link>.
      </p>

      <FurtherReading
        links={[
          { href: "https://www.youtube.com/watch?v=wjZofJX0v4M", title: "But what is a GPT? Visual intro to transformers", source: "3Blue1Brown, YouTube", note: "the best visual walk-through of this whole pipeline (now titled “Transformers, the tech behind LLMs”)" },
          { href: "https://jalammar.github.io/illustrated-gpt2/", title: "The Illustrated GPT-2", source: "Jay Alammar", note: "the same pipeline drawn step by step, one level deeper" },
          { href: "https://bbycroft.net/llm", title: "LLM Visualization", source: "Brendan Bycroft", note: "a 3D walk through every number in a small real GPT" },
        ]}
      />
    </>
  );
}
