import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig, ArticleLink, Callout, FurtherReading } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "./next-token-prediction.module.css";
import { SamplingPlayground } from "./next-token-prediction.figures";

export const minutes = 5;

const [RED, TEAL, , YELLOW, , PURPLE] = CLUSTER_COLORS;

// Decorative shapes for the pipeline figure (not real values).
const VECTOR = [0.6, -0.4, 0.9, -0.2, 0.3, -0.8, 0.5, 0.1, -0.6, 0.7, -0.3, 0.4];
const LOGITS = [0.3, 0.55, 0.2, 0.95, 0.4, 0.15, 0.6, 0.25, 0.45, 0.1, 0.35, 0.2];
const PROBS = [0.04, 0.1, 0.03, 0.75, 0.06, 0.02, 0.14, 0.03, 0.07, 0.02, 0.05, 0.03];

function Strip({ values, color }) {
  return (
    <span className={s.strip} aria-hidden="true">
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(Math.abs(v) * 100, 6)}%`, "--c": v < 0 ? RED : color }} />
      ))}
    </span>
  );
}

function Pipeline() {
  const stages = [
    ["last vector", "768 numbers", <Strip key="v" values={VECTOR} color={TEAL} />],
    ["× unembedding", "768 × 50,257 matrix", null],
    ["logits", "50,257 scores", <Strip key="l" values={LOGITS} color={YELLOW} />],
    ["softmax", "50,257 probabilities", <Strip key="p" values={PROBS} color={PURPLE} />],
  ];
  return (
    <div className={s.pipe} role="img" aria-label="The last token's vector of 768 numbers is multiplied by a 768 by 50,257 unembedding matrix, giving 50,257 logits, which softmax turns into 50,257 probabilities.">
      {stages.map(([title, sub, viz], i) => (
        <span key={title} style={{ display: "contents" }}>
          {i > 0 && <span className={s.arrow} />}
          <span className={s.stage}>
            <strong>{title}</strong>
            {viz}
            <span>{sub}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

const TEMPS = [
  ["0.5", ["86.4%", "11.7%", "1.9%"]],
  ["1", ["65.9%", "24.2%", "9.9%"]],
  ["2", ["50.2%", "30.4%", "19.4%"]],
];

function Row({ label, words, next, stop }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {words.map((w, i) => (
        <span key={i} className={l.chip} style={{ "--tc": "#ffffff30" }}><b>{w}</b></span>
      ))}
      <span className={l.chip} style={{ "--tc": stop ? RED : PURPLE }}><b>{next}</b></span>
      {stop && <span className={s.stop}>stop</span>}
    </div>
  );
}

export default function NextTokenPrediction() {
  return (
    <>
      <p>
        A language model reads your text as tokens, turns each one into a vector, and passes those vectors through a stack of transformer blocks
        (<ArticleLink slug="attention-and-transformers">Attention and the transformer</ArticleLink> explains that part). At the end, every token has a refined vector.
        But the model is supposed to <em>write</em> something. This article follows the last step: from a list of numbers to an actual next word, and then the next, and the next.
      </p>

      <h2>One vector, one question</h2>
      <p>
        To predict what comes next, the model only needs the final vector of the <strong>last</strong> token. Thanks to attention, that vector has already gathered what it needs from everything before it.
        In GPT-2’s smallest version it is 768 numbers long.
      </p>
      <p>
        The model’s vocabulary, the fixed list of tokens it knows (see <ArticleLink slug="why-tokens">Why models read tokens</ArticleLink>), has 50,257 entries in GPT-2.
        The job now is to give every one of those entries a score for “how well would this fit next?”
      </p>

      <h2>From vector to scores: the unembedding</h2>
      <p>
        The scoring is one multiplication. The model has a big learned table called the <strong>unembedding matrix</strong> (or output layer), with one column of 768 numbers per vocabulary token.
        Multiplying the last vector by this matrix is the same as taking a <strong>dot product</strong> with each column: multiply number by number and add up.
        A column that points in a similar direction to the vector gets a high score.
      </p>
      <p>
        The result is one number per token, 50,257 in all. These raw scores are called <strong>logits</strong>. They can be any size and can be negative; only their differences matter.
        In GPT-2 the unembedding matrix is the same table as the embedding table from the very first step, reused (a trick called weight tying). Many newer models keep two separate tables.
      </p>
      <Fig caption="The last step of a GPT-2-sized model. The bar shapes are decorative; the sizes (768 and 50,257) are GPT-2 small’s. The unembedding matrix alone holds 768 × 50,257 ≈ 38.6 million numbers.">
        <Pipeline />
      </Fig>

      <h2>From scores to probabilities: softmax</h2>
      <p>
        Logits are hard to use directly. What we want is a <strong>probability</strong> for each token: a number between 0 and 1, with all of them adding up to 1.
        The function that does this is <strong>softmax</strong>. For each logit it computes <code>e</code> raised to that logit (which makes every number positive and stretches the gaps), and then divides by the total.
      </p>
      <p>
        For example, logits of 2.0, 1.0 and 0.1 become probabilities of about 65.9%, 24.2% and 9.9%. The biggest logit wins the most, but everything keeps a share.
        This list of probabilities is the model’s real output: not a word, but a <strong>probability distribution</strong> over every word it could say next.
      </p>

      <h2>Choosing a word: decoding</h2>
      <p>
        Turning that distribution into one token is called <strong>decoding</strong>, and there are several ways to do it. Try them below. The candidate words and their logits are made up for illustration,
        and to keep things readable we pretend the vocabulary has only these 12 words. The maths applied to them is the real thing.
      </p>
      <Fig caption="Illustrative logits for the word after “The cat sat on the”. Moving a slider recomputes the probabilities exactly: temperature first, then top-k, then top-p, then the remaining words are rescaled to add up to 100%. Cut words are struck through. “Sample a word” draws one word at random using the shown probabilities.">
        <SamplingPlayground />
      </Fig>
      <p>Here is what each control does.</p>
      <ul>
        <li>
          <strong>Greedy decoding</strong> always takes the single most likely token. Set temperature to 0 to see it: “mat” gets 100% and every draw is the same.
          Greedy is predictable, but over long texts it tends to produce bland and repetitive writing.
        </li>
        <li>
          <strong>Temperature</strong> divides every logit by a number T before the softmax. Below 1 the gaps grow, so the favourite takes even more of the probability.
          Above 1 the gaps shrink and unlikely words get a real chance. It never changes the <em>order</em> of the words, only how sharply the probability is concentrated.
        </li>
        <li>
          <strong>Top-k</strong> keeps only the k most likely tokens and throws the rest away. It stops the model from ever picking something wildly unlikely from the long tail of a big vocabulary.
          Its weakness is that k is fixed: sometimes only two words make sense, sometimes hundreds do.
        </li>
        <li>
          <strong>Top-p</strong>, also called <strong>nucleus sampling</strong>, keeps the smallest group of top tokens whose probabilities add up to at least p. When the model is confident, that group is tiny;
          when many words fit, it grows. Set top-p to 0.50 above and only “mat” and “floor” survive, because “mat” alone is 41.3%, just short of half.
        </li>
      </ul>
      <Fig caption="The same logits (2.0, 1.0, 0.1) through softmax at three temperatures. Lower temperature sharpens the distribution; higher temperature flattens it.">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>Temperature</th><th>logit 2.0</th><th>logit 1.0</th><th>logit 0.1</th></tr></thead>
            <tbody>
              {TEMPS.map(([t, ps]) => <tr key={t}><td>T = {t}</td>{ps.map((p) => <td key={p}>{p}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Why the same question gets different answers</h2>
      <p>
        Unless decoding is greedy, the model makes a random draw at every single token. A 25% word will be picked about one time in four.
        Once a different word is picked, everything after it is predicted from a different text, so small early differences grow into completely different answers.
        That is why asking a chatbot the same question twice can give two different replies, and why settings like temperature exist: they let you trade variety for predictability.
      </p>
      <Callout title="Common misconception">
        A low-probability word is not a “wrong” word, and a high-probability one is not a checked fact. The probabilities describe what text tends to come next, as learned from training data.
        A model can be very confident and still be mistaken.
      </Callout>

      <h2>The loop: append and repeat</h2>
      <p>
        One pass through the model produces one token. To write a sentence, the model adds the chosen token to the end of the input and runs again, predicting the token after that.
        This is called <strong>autoregressive</strong> generation: each step is fed its own previous output. It is also why replies appear on screen word by word.
      </p>
      <Fig caption="An illustrative run of the generation loop. Each step adds one token and runs the model again, until it picks the end-of-text token.">
        <div className={s.loop}>
          <Row label="step 1" words={["The", "cat", "sat", "on", "the"]} next="mat" />
          <Row label="step 2" words={["The", "cat", "sat", "on", "the", "mat"]} next="." />
          <Row label="step 3" words={["The", "cat", "sat", "on", "the", "mat", "."]} next="<|endoftext|>" stop />
        </div>
      </Fig>
      <p>Generation stops in one of two ways:</p>
      <ul>
        <li>
          <strong>An end-of-sequence token.</strong> The vocabulary contains a special token that means “this text is finished”. In GPT-2 it is <code>&lt;|endoftext|&gt;</code>, ID 50256.
          The model learned during training that texts end with it, so it can predict it like any other token. When it is drawn, generation stops.
        </li>
        <li>
          <strong>A length limit.</strong> The program running the model sets a maximum number of new tokens. If that is reached first, the text is cut off, sometimes mid-sentence.
        </li>
      </ul>
      <p>
        Real systems add refinements, such as reusing earlier calculations so each step does not start from scratch, or searching several candidate continuations at once (beam search).
        But the core is exactly this: vector, logits, softmax, pick one, append, repeat.
      </p>
      <p>
        Want to see the tokens a model actually works with? The <Link href="/tokenizer">Tokenizer</Link> on this site splits any text into GPT and LLaMA tokens with their IDs.
      </p>

      <FurtherReading
        links={[
          { href: "https://huggingface.co/blog/how-to-generate", title: "How to generate text: using different decoding methods", source: "Hugging Face blog", note: "greedy, beam search, top-k and top-p with code" },
          { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "video, includes unembedding, softmax and temperature" },
          { href: "https://arxiv.org/abs/1904.09751", title: "The Curious Case of Neural Text Degeneration", source: "Holtzman et al., 2019", note: "the paper that introduced nucleus (top-p) sampling" },
        ]}
      />
    </>
  );
}
