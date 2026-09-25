import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig, ArticleLink, Callout, FurtherReading } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "./attention-and-transformers.module.css";
import { AttentionLines, AttentionMatrix, AttentionSteps } from "./attention-and-transformers.figures";

export const minutes = 7;

const [RED, TEAL, , YELLOW, INDIGO] = CLUSTER_COLORS;

function Sentence({ label, words, hi, sub }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {words.map((w, i) => (
        <span key={i} className={l.chip} style={{ "--tc": i === hi ? YELLOW : "#ffffff30" }}>
          <b>{w}</b>
          {i === hi && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

function Box({ y, h = 30, text, color }) {
  return (
    <g>
      <rect x="50" y={y} width="180" height={h} rx="8" fill={color} fillOpacity=".22" stroke={color} />
      <text x="140" y={y + h / 2 + 4} textAnchor="middle" className={s.label}>{text}</text>
    </g>
  );
}

const Up = ({ y1, y2 }) => <line x1="140" y1={y1} x2="140" y2={y2} stroke="#cfd8e6" strokeWidth="1.5" markerEnd="url(#att-tip)" />;

function Plus({ cy }) {
  return (
    <g>
      <circle cx="140" cy={cy} r="10" fill="#0e1015" stroke="#cfd8e6" strokeWidth="1.5" />
      <path d={`M134 ${cy}h12M140 ${cy - 6}v12`} stroke="#fff" strokeWidth="1.5" />
    </g>
  );
}

function BlockDiagram() {
  const grey = "#9aa7ba";
  return (
    <svg viewBox="0 0 340 404" className={s.block} role="img"
      aria-label="One transformer block: the input goes through normalisation and attention, and the result is added back to the input; then through normalisation and a feed-forward network, and that result is added back too. The block repeats N times.">
      <defs>
        <marker id="att-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#cfd8e6" />
        </marker>
      </defs>
      <rect x="20" y="42" width="300" height="310" rx="14" fill="none" stroke="#ffffff24" strokeDasharray="6 5" />
      <text x="34" y="62" style={{ fill: grey }}>block × N</text>

      <text x="140" y="20" textAnchor="middle" className={s.label}>updated vectors</text>
      <Up y1={52} y2={28} />
      <Plus cy={62} />
      <Box y={90} text="Feed-forward" color={TEAL} />
      <Up y1={90} y2={74} />
      <Box y={140} h={26} text="Normalise" color={grey} />
      <Up y1={140} y2={122} />
      <Plus cy={200} />
      <Up y1={190} y2={168} />
      <Box y={228} text="Multi-head attention" color={INDIGO} />
      <Up y1={228} y2={212} />
      <Box y={278} h={26} text="Normalise" color={grey} />
      <Up y1={278} y2={262} />
      <Box y={366} text="token vectors + position" color={YELLOW} />
      <Up y1={366} y2={306} />

      <g fill="none" stroke={RED} strokeWidth="1.5" strokeDasharray="5 4">
        <path d="M140 326H290V200H153" markerEnd="url(#att-tip)" />
        <path d="M140 180H290V62H153" markerEnd="url(#att-tip)" />
      </g>
      <text x="300" y="245" style={{ fill: RED }} transform="rotate(90 300 245)">residual</text>
      <text x="300" y="95" style={{ fill: RED }} transform="rotate(90 300 95)">residual</text>
    </svg>
  );
}

export default function AttentionAndTransformers() {
  return (
    <>
      <p>
        By the time a language model starts thinking about your text, each token has been swapped for a list of numbers, its <strong>embedding</strong>
        (see <ArticleLink slug="what-are-embeddings">What are embeddings?</ArticleLink>). But that first vector comes from a lookup table.
        It is the same every time the token appears, whatever the sentence around it. This article explains the idea that fixes that, <strong>attention</strong>,
        and how it is packaged into the <strong>transformer</strong>, the design behind almost every modern language model.
      </p>

      <h2>Why context matters</h2>
      <p>Look at the word “bank” in these two sentences.</p>
      <Fig caption="The same token, two meanings. Only the surrounding words tell them apart.">
        <div className={s.contextRows}>
          <Sentence label="sentence 1" words={["We", "sat", "on", "the", "river", "bank"]} hi={5} sub="riverside" />
          <Sentence label="sentence 2" words={["She", "paid", "cash", "into", "the", "bank"]} hi={5} sub="money" />
        </div>
      </Fig>
      <p>
        A lookup table gives “bank” one vector in both. A person reads “river” and knows at once which bank is meant.
        Pronouns are even more dependent on context: in “The animal didn’t cross the street because it was too tired”, the word “it” means nothing until you work out that it points back to “the animal”.
      </p>
      <p>
        So a model needs a way for each token to <em>gather information from other tokens</em> and update its own vector. That is exactly what attention does.
      </p>

      <h2>Attention: every token asks a question</h2>
      <p>
        Here is the intuition. Each token asks, “which of the other tokens matter to me?” It gives every token it can see a score, turns the scores into percentages,
        and then takes a blend of those tokens’ information, mixing in more from the ones with higher percentages. These percentages are called <strong>attention weights</strong>.
      </p>
      <Fig caption="Illustrative weights, written by hand to show the idea; they are not taken from a real model. Hover, tap or tab to a token on the left to see how much it attends to each token on the right. Tokens after it are hidden, as in a text generator.">
        <AttentionLines />
      </Fig>
      <p>
        With “it” selected, most of the weight goes to “animal”. After this step, the vector for “it” carries some of the meaning of “animal”, which is what later parts of the model need.
        Nobody writes these weights by hand in a real model. They are computed from the vectors themselves, using numbers the model learned during training.
      </p>

      <h2>Queries, keys and values</h2>
      <p>
        How does a token decide who matters? Think of a library search. You type a <strong>query</strong> (what you are looking for). Each book has a <strong>key</strong>, like the label on its spine (what it is about).
        You compare your query with every label, and the better the match, the more you read from that book’s contents, its <strong>value</strong>.
      </p>
      <p>
        In a transformer, every token plays all three roles. Its vector is multiplied by three different learned matrices to produce three new vectors:
      </p>
      <ul>
        <li><strong>query</strong>: what this token is looking for;</li>
        <li><strong>key</strong>: what this token offers, so others can find it;</li>
        <li><strong>value</strong>: the information it hands over if someone attends to it.</li>
      </ul>
      <p>
        Then, for the token doing the looking, the recipe has four steps. <strong>Compare</strong> its query with every key using a <strong>dot product</strong>: multiply the two vectors number by number and add up the results.
        Similar directions give a large number. <strong>Scale</strong> the scores down by the square root of the vector length. <strong>Softmax</strong> them: a function that turns any list of numbers into positive numbers adding up to 1.
        Finally, <strong>blend</strong> the values, each multiplied by its weight.
      </p>
      <Fig caption="A toy example with 2-number vectors so the arithmetic is visible. The numbers are made up, but every step is computed exactly as a transformer computes it. Real models use vectors with dozens to hundreds of numbers per head.">
        <AttentionSteps />
      </Fig>
      <p>
        Written compactly, for all tokens at once, this is the formula from the 2017 paper that introduced the transformer: <code>softmax(QKᵀ / √d) · V</code>.
        Q, K and V are the queries, keys and values of every token stacked into tables, and d is the length of a key vector.
      </p>

      <h2>Causal masking: no peeking ahead</h2>
      <p>
        Text generators like GPT write one token at a time, left to right (<ArticleLink slug="next-token-prediction">From the last vector to the next word</ArticleLink> covers that loop).
        During training, the model learns to predict each next token of a text. If a token could see the words after it, it could simply copy the answer.
      </p>
      <p>
        So these models use a <strong>causal mask</strong>: before the softmax, the scores for every later token are set to minus infinity, which softmax turns into a weight of exactly zero.
        Each token can look at itself and everything before it, never after. Drawn as a grid, the weights form a triangle.
      </p>
      <Fig caption="The same illustrative weights as a grid. Each row is a token doing the looking; each column is a token being looked at. Brighter means more weight. The hatched upper triangle is masked.">
        <AttentionMatrix />
      </Fig>
      <p>
        Not every transformer is causal. Models built to understand text rather than write it, such as BERT, let every token see the whole sentence in both directions.
      </p>

      <h2>Many heads at once</h2>
      <p>
        One set of weights can only express one kind of relationship at a time. But a token might care about several things: which noun a pronoun refers to, which verb goes with a subject, what the previous word was.
      </p>
      <p>
        So a transformer runs several attention computations side by side, each with its own query, key and value matrices. Each one is called a <strong>head</strong>.
        Their outputs are joined together and mixed back into a single vector. The original transformer used 8 heads per layer; GPT-2’s smallest version uses 12.
      </p>
      <Callout title="What real attention looks like">
        The neat picture above, where “it” points clearly at “animal”, is a teaching sketch. Researchers who inspect real models do find some heads with readable jobs,
        such as attending to the previous token. But many heads look messy, some put most of their weight on the first token as a kind of resting place, and the work is spread across many heads and layers.
        An attention pattern shows where information flows, not a full explanation of why the model answered as it did.
      </Callout>

      <h2>The transformer block</h2>
      <p>
        Attention lets tokens share information. A transformer wraps it in a <strong>block</strong> with three more ingredients:
      </p>
      <ul>
        <li>
          <strong>A feed-forward network.</strong> After attention has mixed information <em>between</em> tokens, each token’s vector goes through a small neural network on its own:
          the vector is expanded to a longer one (four times longer in the original design), passed through a simple non-linear function, and shrunk back. This is where much of the model’s stored knowledge is thought to live.
        </li>
        <li>
          <strong>Residual connections.</strong> Instead of replacing a token’s vector, each sub-layer’s output is <em>added</em> to it. The vector becomes a running record that every layer edits a little.
          This also makes very deep stacks much easier to train.
        </li>
        <li>
          <strong>Normalisation.</strong> Before each sub-layer, the vector is rescaled to a standard size so numbers neither explode nor fade as they pass through many layers.
        </li>
      </ul>
      <Fig caption="One transformer block, read from bottom to top, in the “normalise first” arrangement most GPT-style models use. The dashed red paths are residual connections: the input skips around each sub-layer and is added back.">
        <BlockDiagram />
      </Fig>

      <h2>Stacking blocks</h2>
      <p>
        A model is many of these blocks stacked on top of each other, each with its own learned numbers. The original transformer had 6 in each half; GPT-2’s smallest version has 12, and large models have dozens more.
        Every block reads the vectors the previous one produced and refines them. Early layers tend to handle local, surface patterns; later ones build more abstract features.
      </p>
      <p>
        The shape never changes along the way: one vector per token goes in, one vector per token comes out. At the very top, the vector of the last token is turned into a guess about the next token.
      </p>

      <h2>Where is word order?</h2>
      <p>
        There is a catch. Attention on its own ignores order: it compares every token with every other, so “dog bites man” and “man bites dog” would look the same.
        Transformers fix this by giving each token <strong>positional information</strong>. The original paper added a fixed pattern of sine waves to each embedding, a different pattern for each position.
        GPT-2 learns a position vector instead. Many newer models rotate the query and key vectors by an angle that depends on position (a method called RoPE), so attention scores reflect how far apart two tokens are.
      </p>

      <Callout title="In one sentence">
        Each token builds a query, key and value; attention compares queries with keys to decide how much of each value to blend in; a transformer repeats that, plus a small per-token network, in block after block.
      </Callout>

      <FurtherReading
        links={[
          { href: "https://www.3blue1brown.com/lessons/attention", title: "Attention in transformers, step-by-step", source: "3Blue1Brown", note: "video, the best visual walk-through" },
          { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "video, the big picture" },
          { href: "https://jalammar.github.io/illustrated-transformer/", title: "The Illustrated Transformer", source: "Jay Alammar" },
          { href: "https://arxiv.org/abs/1706.03762", title: "Attention Is All You Need", source: "Vaswani et al., 2017", note: "the original paper" },
        ]}
      />
    </>
  );
}
