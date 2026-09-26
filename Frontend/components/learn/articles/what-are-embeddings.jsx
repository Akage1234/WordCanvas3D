import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import { WordMap } from "./what-are-embeddings.figures";
import s from "./what-are-embeddings.module.css";
import l from "../learn.module.css";

export const minutes = 7;

const [RED, TEAL, SKY, YELLOW] = CLUSTER_COLORS;

// First 16 of the 300 numbers for each word in the site's GloVe file.
const DENSE = {
  cat: [-0.59, -0.05, 0.23, -0.78, 0.26, 0.03, 0.09, 0.46, -0.43, 0.55, -0.19, 0.16, -0.45, -0.43, -0.63, -0.51],
  dog: [-0.63, 0.14, 0.52, -0.71, 0.12, 0.4, 0.05, 0.18, -0.19, 0.64, -0.3, 0.83, -0.23, -0.84, -0.25, -0.44],
  car: [0.25, 0.51, -0.59, -0.39, 0.15, 0.32, -0.15, -0.32, -0.19, -0.04, -0.51, 0.17, -0.35, -0.06, 0.44, -0.3],
};
const ONE_HOT = { cat: 3, dog: 9, car: 13 };

function OneHotVsDense() {
  return (
    <Fig caption="Top: one-hot vectors, drawn with 16 slots instead of 10,000 (illustrative). Each word lights up its own slot, so no two words share anything. Bottom: the first 16 of 300 real GloVe numbers for the same words (teal positive, red negative). cat and dog have a similar pattern; car differs.">
      <div className={s.vecRows} role="img" aria-label="One-hot vectors for cat, dog and car share no filled slots; their dense GloVe vectors show cat and dog with similar patterns and car with a different one.">
        <p className={s.vecNote}>one-hot · one slot per vocabulary word</p>
        {Object.entries(ONE_HOT).map(([w, on]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={s.slots} style={{ "--tc": SKY }}>
              {Array.from({ length: 16 }, (_, i) => <i key={i} data-on={i === on ? "" : undefined} />)}
            </span>
          </div>
        ))}
        <p className={s.vecNote}>embedding · learned numbers (first 16 of 300)</p>
        {Object.entries(DENSE).map(([w, vals]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={`${s.slots} ${s.dense}`}>
              {vals.map((v, i) => <i key={i} style={{ "--tc": v < 0 ? RED : TEAL, "--a": Math.min(1, Math.abs(v) * 1.2) }} />)}
            </span>
          </div>
        ))}
      </div>
    </Fig>
  );
}

// Angles are arccos of the real cosine similarity between "cat" and each word.
const ANGLES = [["dog", 0.722, TEAL, 190], ["car", 0.282, YELLOW, 160], ["democracy", 0.148, RED, 200]];

function CosineFan() {
  const ox = 150, oy = 230, len = 190;
  return (
    <Fig caption="Cosine similarity is about the angle between two arrows. Each arrow is drawn at the real angle between that word’s GloVe vector and cat’s (cat–dog 0.72, about 44°; cat–car 0.28, about 74°; cat–democracy 0.15, about 81°). Only the angles are meaningful here, not the lengths.">
      <svg viewBox="0 0 420 260" className={l.big} role="img" aria-label="Arrows from a common origin: cat along the bottom, dog at 44 degrees, car at 74 degrees, democracy at 81 degrees.">
        <line x1={ox} y1={oy} x2={ox + len} y2={oy} stroke={SKY} strokeWidth="2.5" />
        <text x={ox + len + 6} y={oy + 4} className={s.label}>cat</text>
        {ANGLES.map(([w, c, col, arm]) => {
          const a = Math.acos(c);
          const x = ox + Math.cos(a) * arm, y = oy - Math.sin(a) * arm;
          const r = 60 + (w === "dog" ? 0 : w === "car" ? 22 : 44);
          const ax = ox + Math.cos(a) * r, ay = oy - Math.sin(a) * r;
          return (
            <g key={w}>
              <line x1={ox} y1={oy} x2={x} y2={y} stroke={col} strokeWidth="2.5" />
              <path d={`M${ox + r} ${oy} A${r} ${r} 0 0 0 ${ax} ${ay}`} fill="none" stroke={col} strokeOpacity=".5" />
              <text x={w === "democracy" ? x - 6 : x + 6} y={y - 4} textAnchor={w === "democracy" ? "end" : "start"} className={s.label}>{w} · {c.toFixed(2)}</text>
            </g>
          );
        })}
        <circle cx={ox} cy={oy} r="3.5" fill="#fff" />
      </svg>
    </Fig>
  );
}

function BankContexts() {
  return (
    <Fig caption="Illustrative. A static embedding gives “bank” one vector for both sentences. A contextual model starts from that same vector, then its layers mix in the surrounding words, so the two uses end up in different places.">
      <div className={s.ctx}>
        <p className={s.sentence}>She sat on the river <b style={{ "--tc": TEAL }}>bank</b> and watched the water.</p>
        <p className={s.sentence}>He moved his savings to another <b style={{ "--tc": YELLOW }}>bank</b>.</p>
        <svg viewBox="0 0 420 150" className={l.big} role="img" aria-label="Diagram: one static bank vector splits into two contextual vectors, one for the river sentence and one for the savings sentence.">
          <circle cx="60" cy="75" r="6" fill={SKY} />
          <text x="60" y="100" textAnchor="middle" className={s.label}>bank (static)</text>
          <path d="M70 72 C140 40 180 30 240 32" fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="4 4" />
          <path d="M70 78 C140 110 180 120 240 118" fill="none" stroke={YELLOW} strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="248" cy="32" r="6" fill={TEAL} />
          <circle cx="248" cy="118" r="6" fill={YELLOW} />
          <text x="260" y="36" className={s.label}>bank + “river”</text>
          <text x="260" y="122" className={s.label}>bank + “savings”</text>
          <text x="160" y="80" textAnchor="middle" className={s.dimText}>context mixes in</text>
        </svg>
      </div>
    </Fig>
  );
}

export default function WhatAreEmbeddings() {
  return (
    <>
      <p>
        Computers are good with numbers and bad with meaning. Before a model can do anything useful with the word <code>cat</code>, it has to turn it into numbers.
        The interesting question is <em>which</em> numbers. An <strong>embedding</strong> is the answer almost every modern language system uses:
        a list of numbers for each word (or token), learned from text, arranged so that words with similar meanings get similar lists.
      </p>

      <h2>Why not just give each word a number?</h2>
      <p>
        The simplest idea is to number the vocabulary: <code>the</code> is 1, <code>cat</code> is 2, and so on. This is roughly what a tokenizer does
        (see <ArticleLink slug="why-tokens">Why models read tokens</ArticleLink>). But the numbers are arbitrary labels. In the 10,000-word list used below, <code>cat</code> is number 5,606 and <code>dog</code> is 3,037, but
        that says nothing about cats and dogs. A model would happily conclude that <code>dog</code> is “smaller” than <code>cat</code>, which is nonsense.
      </p>
      <p>
        The classic fix is a <strong>one-hot vector</strong>: a list with one slot per vocabulary word, all zeros except a single 1 in that word’s slot.
        With a 10,000-word vocabulary, every word becomes 10,000 numbers. No more fake ordering, but a new problem appears:
        every pair of words is exactly as different as every other pair. <code>cat</code> is no closer to <code>dog</code> than to <code>democracy</code>.
        The representation carries no meaning at all.
      </p>
      <OneHotVsDense />

      <h2>A short list of learned numbers</h2>
      <p>
        An embedding flips the approach. Each word gets a <strong>dense</strong> vector: a much shorter list (often 100 to 1,000 numbers, here 300) where every position holds some value.
        Nobody chooses these values by hand. They start random and are adjusted during training until words used in similar ways end up with similar lists.
      </p>
      <p>
        If you treat each list of 300 numbers as coordinates, every word becomes a point in a 300-dimensional space. “Similar meaning” then becomes “nearby”.
        We can’t draw 300 dimensions, but we can squash a handful of words down to two and look.
      </p>
      <Fig caption="Real GloVe data. 42 words placed in 2D so their distances match the 300-D distances as well as possible (a method called MDS, applied to these 42 words only, so the layout is approximate). The list under the map is exact: each word’s six nearest neighbours by cosine similarity among all 10,000 words. Try apple, rice and mouse.">
        <WordMap />
      </Fig>
      <p>
        The groups form on their own: the vectors were never told what an animal or a country is. The surprises are just as instructive.
        <code>apple</code> sits between food and tech, and its nearest neighbours are all companies, because the training text talks about Apple the company far more than the fruit.
        <code>rice</code>’s closest word is <code>condoleezza</code>, after the former US Secretary of State. <code>mouse</code> is pulled toward cartoons and computers.
        An embedding reflects how words are <em>used</em> in its training text, not what a dictionary says.
      </p>

      <h2>You shall know a word by the company it keeps</h2>
      <p>
        Why should “used in similar ways” produce “similar meaning”? This is the <strong>distributional hypothesis</strong>, summed up by the linguist J.R. Firth in 1957:
        “You shall know a word by the company it keeps.” Consider the gap in “I poured some ___ into my cup.” <code>coffee</code>, <code>tea</code> and <code>milk</code> all fit;
        <code>bicycle</code> does not. Words that fit the same gaps across millions of sentences are probably related, and that is something a computer can measure without understanding anything.
      </p>

      <h2>How the numbers are learned</h2>
      <p>
        Two famous methods from the 2010s show the idea clearly. Both read a large amount of text and produce one vector per word.
      </p>
      <ul>
        <li>
          <strong>word2vec</strong> (Mikolov and colleagues at Google, 2013) plays a guessing game. Take a word from a sentence and try to predict the words around it
          (or the reverse). Each wrong guess slightly nudges the vectors involved. After billions of nudges, words that predict the same neighbours have been pushed toward similar vectors.
        </li>
        <li>
          <strong>GloVe</strong> (Pennington, Socher and Manning at Stanford, 2014) starts by counting how often every pair of words appears near each other in the whole corpus.
          It then fits vectors so that comparing two words’ vectors predicts how often they co-occur.
        </li>
      </ul>
      <p>
        Different recipes, same result: a table with one row of numbers per word. These are called <strong>static</strong> embeddings, because each word gets exactly one vector,
        whatever sentence it appears in.
      </p>

      <h2>One word, many meanings: contextual embeddings</h2>
      <p>
        Static vectors have an obvious weakness. <code>bank</code> can be the side of a river or a place that keeps money, but it only gets one vector.
        In this GloVe data its nearest neighbours are <code>banks</code>, <code>banking</code>, <code>central</code>, <code>credit</code> and <code>financial</code>. The river meaning is mostly drowned out.
      </p>
      <BankContexts />
      <p>
        Modern language models keep the lookup table as their first step: every token ID is swapped for a learned vector, exactly like above.
        But then the vectors pass through many layers of <strong>attention</strong>, where each token’s vector is updated using the tokens around it
        (see <ArticleLink slug="attention-and-transformers">Attention and the transformer</ArticleLink>). By the later layers, “bank” in a sentence about rivers has a different vector
        from “bank” in a sentence about savings. These are <strong>contextual embeddings</strong>: the vector depends on the whole sentence, not just the word.
      </p>
      <Callout title="Same word, different vectors">
        When people say “the embedding of a word” in a modern model, ask which one: the fixed vector from the input table, or the context-dependent vector from inside the model. They are not the same thing.
      </Callout>

      <h2>Measuring closeness: cosine similarity</h2>
      <p>
        To say two words are “near”, we need a way to measure it. The most common is <strong>cosine similarity</strong>. Picture each vector as an arrow from the origin.
        Cosine similarity is the cosine of the angle between two arrows: 1 when they point the same way, 0 when they are at right angles, and −1 when they point in opposite directions.
      </p>
      <CosineFan />
      <p>
        In practice you compute it by multiplying the two lists position by position, adding up the results (the <strong>dot product</strong>), and dividing by both arrows’ lengths.
        Dividing by length means only direction matters, which is useful because a vector’s length can reflect things like how often a word appears, rather than what it means.
        In the GloVe data, <code>cat</code> and <code>dog</code> score 0.72 and <code>king</code> and <code>queen</code> score 0.70, while <code>cat</code> and <code>car</code>, one letter apart, score only 0.28.
        The embedding knows nothing about spelling, only about usage.
      </p>
      <p>
        Straight-line (<strong>Euclidean</strong>) distance works too, and when all vectors are scaled to length 1 it ranks neighbours in exactly the same order as cosine similarity.
      </p>

      <h2>Why this matters</h2>
      <p>
        Once meaning is a position, many tasks become geometry. Search engines find documents whose embeddings are close to your query’s. Recommendation systems suggest items near the ones you liked.
        Chatbots that look things up in your files (often called retrieval-augmented generation) embed every chunk of text and fetch the chunks nearest to the question.
        And inside every language model, embeddings are the form in which text first enters the network (see <ArticleLink slug="how-llms-work">How a language model turns your words into an answer</ArticleLink>).
      </p>
      <p>
        The space these vectors live in has more structure than just “near” and “far”: directions can carry meaning too. That is the subject of{" "}
        <ArticleLink slug="latent-space">Latent space</ArticleLink>. How to draw 300 dimensions on a flat screen without fooling yourself is covered in{" "}
        <ArticleLink slug="dimensionality-reduction">Seeing high dimensions</ArticleLink>. To explore 10,000 real word vectors in 3D, open the <Link href="/embedding">Embedding explorer</Link>,
        and for a site-specific tour see <ArticleLink slug="how-a-word-becomes-300-numbers">How a word becomes 300 numbers</ArticleLink>.
      </p>

      <FurtherReading links={[
        { href: "https://jalammar.github.io/illustrated-word2vec/", title: "The Illustrated Word2vec", source: "Jay Alammar", note: "a visual walk through how word2vec is trained" },
        { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "includes a beautiful section on word embeddings" },
        { href: "https://arxiv.org/abs/1301.3781", title: "Efficient Estimation of Word Representations in Vector Space", source: "Mikolov et al., 2013", note: "the original word2vec paper" },
        { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "project page with paper and downloads" },
      ]} />
    </>
  );
}
