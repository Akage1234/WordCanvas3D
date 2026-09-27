import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import { WalkBetween } from "./latent-space.figures";
import s from "./latent-space.module.css";
import l from "../learn.module.css";

const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE] = CLUSTER_COLORS;

// All numbers below were computed offline from the site's GloVe file (10,000 words x 300 numbers, vectors scaled to length 1).

// The "gender direction": average of (woman - man), (girl - boy), (queen - king), (mother - father),
// (sister - brother), (aunt - uncle), (actress - actor), scaled to length 1. Its 300 components:
const GDIR = [0.01,-0.02,0.06,0.04,-0.13,-0.02,0.05,0.03,0.01,-0.02,-0.01,0.05,0.03,-0.06,-0.04,-0.07,-0.06,0.08,0.09,-0.13,0.02,-0.01,0.06,0.03,-0.05,0.02,0.03,0.1,0.03,-0.01,0.06,-0.16,0.02,0.08,-0.03,0.02,0.05,0.06,0.01,0.03,-0.02,0.15,0.06,0.03,0.02,0.03,0.1,-0.02,0.05,0.05,-0.04,0.01,-0.04,0,0.02,0.1,-0.04,0.2,0.04,0.02,-0.08,-0.12,0.01,0.02,0,0.02,0.09,0.07,0.1,0.01,-0.05,-0.03,-0.07,0,0.03,0.01,-0.06,0.03,-0.06,0.02,-0.01,0.02,0.02,0.02,-0.01,-0.02,0,-0.09,0.04,-0.07,0.03,-0.07,-0.03,0.03,-0.01,0.06,0.11,-0.08,0.09,0.04,-0.07,-0.14,0.06,0.04,0.03,0.08,-0.07,0.07,0.01,0,-0.05,0.08,0.04,0.11,-0.06,-0.11,-0.04,-0.08,0.01,0,0.02,0.02,-0.05,-0.01,0.03,-0.01,0.07,0.01,-0.02,-0.06,-0.06,-0.05,-0.02,0.07,-0.03,-0.07,0.03,-0.04,0.12,0.03,-0.04,-0.01,-0.03,-0.11,-0.04,-0.02,0.05,-0.12,0.07,-0.05,0.02,0.1,0.03,-0.01,0,0.01,0.07,-0.01,0.08,-0.01,0.01,-0.05,-0.1,-0.01,-0.02,0.11,0,0.12,-0.03,0,-0.03,-0.07,0,-0.12,-0.06,0.08,-0.01,-0.04,-0.03,0.06,0.02,0,0.02,-0.07,-0.1,0.04,-0.01,-0.11,-0.07,0.03,-0.14,-0.06,0.03,-0.11,-0.04,0.03,0,0.07,0.03,-0.04,-0.02,-0.06,-0.09,0,0.07,-0.06,-0.01,-0.12,0.08,-0.04,-0.03,0.02,-0.01,0.02,0.09,0.03,-0.04,0.03,0.04,0.04,0.07,-0.02,-0.07,0.03,-0.02,0.07,0.04,0.09,0.05,-0.01,0.03,0.08,-0.03,0.03,0.12,0.03,-0.04,0.11,0.04,-0.01,-0.04,-0.02,0.06,-0.08,0.03,-0.04,-0.02,-0.05,0.02,0.07,0.02,-0.05,-0.09,0.08,0.07,-0.05,-0.01,0.05,-0.04,-0.06,-0.04,0.02,-0.04,0.02,0.05,-0.05,0.05,-0.03,0.03,-0.02,-0.05,-0.02,0.03,-0.1,-0.01,-0.01,-0.07,-0.13,0.06,-0.09,0.07,-0.06,0.03,0,-0.03,-0.01,-0.05,0.06,0.02,0.01,0,0,0.12,0.02,-0.03,0.01,0.05,0,-0.01,0.04];

function DirectionStrip() {
  const W = 600, mid = 60;
  return (
    <Fig caption="Real data. The 300 numbers that make up the “gender direction” in GloVe (the average of seven differences like woman − man). No single dimension stands out: the biggest one carries only about 4% of the direction, and it takes 36 of the 300 dimensions to account for half of it.">
      <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="Bar strip of 300 small positive and negative values with no dominant bar.">
        <line x1="0" y1={mid} x2={W} y2={mid} className={s.axis} />
        {GDIR.map((v, i) => (
          <rect key={i} x={i * 2} width="1.5" y={v > 0 ? mid - v * 250 : mid} height={Math.abs(v) * 250} fill={v > 0 ? TEAL : RED} />
        ))}
        <text x="0" y="120" className={s.dimText}>dimension 1</text>
        <text x={W} y="120" textAnchor="end" className={s.dimText}>dimension 300</text>
      </svg>
    </Fig>
  );
}

// [a, b, a·x, a·y, b·x, b·y]: x = the gender direction, y = the main direction in which the pairs differ from each other.
const PROJ = [["man","woman",-0.272,-0.275,0.26,-0.263],["boy","girl",-0.182,-0.133,0.252,-0.184],["king","queen",-0.254,0.299,0.275,0.254],["father","mother",-0.278,0.226,0.239,0.194],["brother","sister",-0.405,0.316,0.308,0.345],["uncle","aunt",-0.371,0.41,0.285,0.426],["actor","actress",-0.25,-0.41,0.387,-0.339]];
const PAIR_COLORS = [SKY, TEAL, YELLOW, PURPLE, RED, INDIGO, "#26de81"];

function ParallelOffsets() {
  const px = (x) => 210 + x * 360, py = (y) => 150 - y * 300;
  return (
    <Fig caption="Real data, projected onto two chosen directions: horizontal is the average “female minus male” direction, vertical is the main way these pairs differ from one another. Because the horizontal axis is built from these very pairs, some parallelism is expected. The stronger evidence is in 300 dimensions: the seven difference vectors have an average cosine similarity of 0.58 with each other, against 0.07 for differences between random word pairs.">
      <svg viewBox="0 0 420 300" className={l.big} role="img" aria-label="Seven arrows, each from a male word on the left to its female counterpart on the right, all pointing roughly in the same direction.">
        <defs>
          {PAIR_COLORS.map((col, i) => (
            <marker key={i} id={`ls-arrow-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" fill={col} />
            </marker>
          ))}
        </defs>
        {PROJ.map(([a, b, ax, ay, bx, by], i) => (
          <g key={a}>
            <line x1={px(ax)} y1={py(ay)} x2={px(bx)} y2={py(by)} stroke={PAIR_COLORS[i]} strokeWidth="2" markerEnd={`url(#ls-arrow-${i})`} />
            {a === "king"
              ? <text x={px(ax) + 2} y={py(ay) + 17} className={s.label}>{a}</text>
              : <text x={px(ax) - 8} y={py(ay) + (a === "brother" ? 0 : 5)} textAnchor="end" className={s.label}>{a}</text>}
            <text x={px(bx) + 8} y={py(by) + 5} className={s.label}>{b}</text>
          </g>
        ))}
      </svg>
    </Fig>
  );
}

// a − b + c, nearest words excluding the three inputs (standard practice), and the nearest word when inputs are NOT excluded.
const ANALOGIES = [
  ["king", "man", "woman", [["queen", 0.715], ["princess", 0.601], ["throne", 0.584]], "king"],
  ["paris", "france", "italy", [["rome", 0.783], ["milan", 0.68], ["italian", 0.666]], "rome"],
  ["bigger", "big", "small", [["smaller", 0.818], ["larger", 0.806], ["large", 0.652]], "smaller"],
  ["cats", "cat", "dog", [["dogs", 0.78], ["animals", 0.618], ["pet", 0.519]], "dogs"],
  ["brother", "man", "woman", [["daughter", 0.809], ["mother", 0.77], ["wife", 0.761]], "daughter"],
  ["walked", "walk", "swim", [["swimming", 0.525], ["raced", 0.423], ["ran", 0.423]], "swim"],
];

function AnalogyTable() {
  return (
    <Fig caption="Real results from GloVe. “Top 3” leaves out the three input words, as analogy tests usually do. The last column shows the nearest word when they are not left out: for king − man + woman it is still king. The last two rows miss the intended answer (sister, swam); sister is 6th, and swam is not in this 10,000-word vocabulary.">
      <div className={l.scroll}>
        <table className={l.table}>
          <thead><tr><th>Sum</th><th>Top 3 (cosine)</th><th>Incl. inputs</th></tr></thead>
          <tbody>
            {ANALOGIES.map(([a, b, c, top, incl]) => (
              <tr key={a + c}>
                <td>{a} − {b} + {c}</td>
                <td>{top.map(([w, v]) => `${w} ${v.toFixed(2)}`).join(", ")}</td>
                <td>{incl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fig>
  );
}

const OCC = [["captain",-0.219],["engineer",-0.203],["pilot",-0.169],["soldier",-0.148],["lawyer",-0.139],["scientist",-0.117],["doctor",-0.058],["artist",-0.023],["teacher",0.029],["singer",0.092],["dancer",0.142],["nurse",0.253]];
const REF = [["he", -0.231], ["she", 0.213]];

function OccupationBias() {
  const row = ([w, v], ref) => (
    <div key={w} className={s.occRow} style={{ "--tc": v < 0 ? SKY : PURPLE, "--w": Math.abs(v) / 0.26 }}>
      <span className={ref ? s.ref : undefined}>{w}</span>
      <span>{v < 0 && <i className={s.neg} style={{ display: "block" }} />}</span>
      <span className={s.occMid}>{v > 0 && <i className={s.pos} style={{ display: "block" }} />}</span>
      <small>{v > 0 ? "+" : ""}{v.toFixed(2)}</small>
    </div>
  );
  return (
    <Fig caption="Real data. Where occupation words fall along the gender direction (cosine with it). The words themselves are neutral, yet their vectors lean one way or the other, mirroring how they were used in the training text. he and she are shown for scale.">
      <div className={s.occ} role="img" aria-label="Diverging bar chart. captain, engineer and pilot lean toward the male side; nurse, dancer and singer lean toward the female side; teacher and artist are near zero.">
        <div className={s.occHead}><span /><span>← toward “he”</span><span>toward “she” →</span><span /></div>
        {row(REF[0], true)}
        {OCC.map((o) => row(o))}
        {row(REF[1], true)}
      </div>
    </Fig>
  );
}

export default function LatentSpace() {
  return (
    <>
      <p>
        In <ArticleLink slug="what-are-embeddings">What are embeddings?</ArticleLink> we turned each word into a list of 300 numbers and saw that similar words end up close together.
        The space those vectors live in has a name: a <strong>latent space</strong>. “Latent” means hidden. Nobody designed its coordinates; they were learned,
        and their meaning has to be discovered after the fact. This article is about what that hidden structure looks like, what you can read from it, and where it misleads.
      </p>

      <h2>What “latent space” means</h2>
      <p>
        Any model that turns an input into a vector of numbers defines a latent space: the set of all vectors it could produce.
        Word embeddings are the classic example, but the same word is used for the internal vectors of image generators, speech models and large language models.
        The key property is that position encodes something about the input. Two inputs the model treats as similar land near each other.
      </p>
      <p>
        Everything below uses real word vectors (GloVe, 300 dimensions, 10,000 common English words). The ideas carry over to other latent spaces, even when the details differ.
      </p>

      <h2>The axes don’t have names</h2>
      <p>
        A natural first guess is that each of the 300 numbers measures one thing: dimension 12 for “is an animal”, dimension 40 for “is royal”. In practice, individual dimensions are almost never that tidy.
      </p>
      <p>
        The reason is simple. Training only cares about how vectors relate to each other: their distances and angles. If you rotated the whole space, every distance and angle would stay the same,
        and the model would work exactly as well. So nothing pushes a concept to line up with one particular axis. Meaning ends up spread across many dimensions at once.
      </p>
      <DirectionStrip />
      <p>
        That is why reading an embedding one number at a time tells you very little. Meaning lives in <strong>directions</strong>, and a direction is a particular mix of all 300 numbers.
      </p>

      <h2>Directions can carry meaning</h2>
      <p>
        Take the arrow from <code>man</code> to <code>woman</code>: the difference between their two vectors. Now take the arrow from <code>king</code> to <code>queen</code>.
        If the space has learned something consistent about gender, those arrows should point roughly the same way. They do, and so do the arrows for boy→girl, uncle→aunt and actor→actress.
      </p>
      <ParallelOffsets />
      <p>
        “Roughly” is doing real work in that sentence. A cosine of 0.58 means the arrows share a common direction, but each also has its own quirks. Other relationships are weaker still.
        The singular-to-plural arrows (cat→cats, city→cities, child→children and so on) agree with each other much less, with an average cosine of only 0.23 in this data.
      </p>

      <h2>Analogies as parallel arrows</h2>
      <p>
        If an arrow means “make it female”, you can add it to other words. This is the famous analogy trick: <code>king − man + woman</code> lands near <code>queen</code>.
        The same arithmetic finds capitals (<code>paris − france + italy ≈ rome</code>) and comparatives (<code>bigger − big + small ≈ smaller</code>).
      </p>
      <AnalogyTable />
      <p>
        Two honest caveats. First, the result vector is usually still closest to one of the words you started with, so analogy tests quietly skip the input words.
        Second, it is easy to show the analogies that work and forget the ones that don’t. The trick is a real sign of structure, not a reliable reasoning engine.
        The site guide <ArticleLink slug="king-man-woman">king − man + woman</ArticleLink> lets you try your own.
      </p>

      <h2>Neighbourhoods and clusters</h2>
      <p>
        The simplest structure in a latent space is the neighbourhood. Colours sit near colours, numbers near numbers, capital cities near their countries.
        Algorithms such as k-means can find these groups automatically by looking for dense clumps of points, which is how embeddings are used to group documents or customer reviews by topic.
      </p>
      <p>
        Clusters are not labelled, and their edges are fuzzy. A word with several senses sits between groups: <code>apple</code> sits between fruit and technology companies.
        Whatever you call a cluster is your interpretation, not something stored in the vectors.
      </p>

      <h2>Walking between two points</h2>
      <p>
        If positions mean something, what about the space <em>between</em> two words? You can blend two vectors, say 70% <code>village</code> and 30% <code>city</code>, and ask which real words are nearest to the blend.
      </p>
      <Fig caption="Real GloVe data. Each step blends the two word vectors and lists the nearest words in the 10,000-word vocabulary. Left: similarity to the two ends. Right: the nearest words other than the two ends, with the top one in bold. Use the slider or the arrow keys.">
        <WalkBetween />
      </Fig>
      <p>
        Two things show up. The honest one first: at every step, one of the two end words is still the closest real word. There is no hidden “half village, half city” word waiting in the middle.
        But the <em>runner-up</em> words change in a sensible way. Between village and city you pass <code>town</code>; between hot and cold you pass <code>cool</code> and <code>warm</code>;
        from king to queen you pass <code>monarch</code>. The space is smooth enough that points between two meanings are near words that share both.
      </p>
      <p>
        In image generators this smoothness is put to work. Many generative models have latent spaces where the points between two images decode to believable in-between images, which is how smooth “morphing” animations are made.
      </p>

      <h2>Not just words</h2>
      <p>
        Latent spaces exist wherever a model turns data into vectors. <strong>Sentence embedding</strong> models map whole sentences to one vector each, so “How do I reset my password?” can land near
        “I forgot my login” even though the two share no words. Image models map pictures to vectors. Some models, such as OpenAI’s CLIP, are trained so that a photo and a caption describing it
        land near each other in one shared space, which is what makes searching photos by text possible. See <ArticleLink slug="tokens-beyond-text">Tokens beyond text</ArticleLink> for how images and audio are cut into pieces first.
      </p>
      <p>
        Inside a large language model there isn’t one latent space but many: every layer produces new vectors for every token
        (see <ArticleLink slug="attention-and-transformers">Attention and the transformer</ArticleLink>). Researchers find meaningful directions there too, but reading them is an active research area, not a solved problem.
      </p>

      <h2>Limits and bias</h2>
      <p>
        A latent space is a compressed record of its training data, including the parts we might not want. Words like <code>nurse</code> or <code>engineer</code> carry no gender in their definitions,
        but they appeared in gendered contexts often enough that their vectors lean one way.
      </p>
      <OccupationBias />
      <p>
        This was documented carefully in a 2016 paper whose title quotes a real analogy result: “Man is to Computer Programmer as Woman is to Homemaker?”.
        In our data, <code>doctor − man + woman</code> gives <code>physician</code> first and <code>nurse</code> second. Any system built on top of embeddings, from search to hiring tools,
        can pass these patterns on. Techniques exist to reduce them, but none removes them completely.
      </p>
      <Callout title="Keep in mind">
        A latent space shows how words were used in a particular pile of text. It is a mirror of that text, not a map of the truth.
      </Callout>
      <p>
        One more limit is on our side. We can only look at these spaces through flat pictures, and squashing 300 dimensions into two always distorts something.
        <ArticleLink slug="dimensionality-reduction"> Seeing high dimensions</ArticleLink> explains how those pictures are made and how to read them without being fooled.
        To explore GloVe yourself, try the <Link href="/embedding">Embedding explorer</Link> or do word arithmetic in the <Link href="/vector-playground">Vector Playground</Link>.
      </p>

      <FurtherReading links={[
        { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "its embedding section shows directions like woman − man visually" },
        { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "see the “linear substructures” section" },
        { href: "https://arxiv.org/abs/1607.06520", title: "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", source: "Bolukbasi et al., 2016" },
        { href: "https://arxiv.org/abs/2103.00020", title: "Learning Transferable Visual Models From Natural Language Supervision", source: "Radford et al., 2021", note: "the CLIP paper: images and text in one space" },
      ]} />
    </>
  );
}
