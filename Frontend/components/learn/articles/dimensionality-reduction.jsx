import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig, FurtherReading } from "../kit";
import { SwissRoll } from "./dimensionality-reduction.figures";
import s from "./dimensionality-reduction.module.css";
import l from "../learn.module.css";

const [RED, TEAL, SKY, YELLOW] = CLUSTER_COLORS;

function Shadow() {
  return (
    <Fig caption="Illustrative. Projecting is like casting a shadow. Points A and B are far apart in 3D, but they lie on the same line of sight, so their shadows land on the same spot. Every projection to fewer dimensions loses some differences like this one.">
      <svg viewBox="0 0 420 200" className={l.big} role="img" aria-label="Side view: a light on the left, two points A and B at different depths on one line, and a screen on the right where both shadows land on one spot.">
        <circle cx="30" cy="100" r="10" fill={YELLOW} />
        <text x="30" y="135" textAnchor="middle" className={s.dimText}>light</text>
        <line x1="30" y1="100" x2="360" y2="40" stroke="#ffffff40" strokeDasharray="4 4" />
        <line x1="360" y1="15" x2="360" y2="185" stroke="#ffffff66" strokeWidth="3" />
        <text x="372" y="190" className={s.dimText}>2D</text>
        <circle cx="140" cy="80" r="7" fill={TEAL} />
        <text x="140" y="68" textAnchor="middle" className={s.label}>A</text>
        <circle cx="270" cy="56.4" r="7" fill={RED} />
        <text x="270" y="44" textAnchor="middle" className={s.label}>B</text>
        <circle cx="360" cy="40" r="6" fill="#fff" />
        <text x="352" y="30" textAnchor="end" className={s.label}>A and B</text>
      </svg>
    </Fig>
  );
}

// Illustrative toy data, computed offline with scikit-learn: three clusters of 50 points each in 10 dimensions.
// Red: very tight (spread 0.5). Teal: wide (spread 3), 10 units from red. Yellow: medium (spread 1.5), 60 units from red.
// pca: PCA to 2D; p2, p5, p30: t-SNE at perplexity 2, 5 and 30 (same random seed). Each panel scaled to -1..1.
const TOY = {"label":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"pca":[-0.56,0.01,-0.57,0.01,-0.57,0.0,-0.54,-0.01,-0.58,0.01,-0.56,0.01,-0.56,0.01,-0.55,-0.01,-0.56,0.01,-0.56,-0.01,-0.57,-0.01,-0.57,-0.0,-0.55,-0.01,-0.57,-0.01,-0.58,0.01,-0.56,0.01,-0.56,0.01,-0.57,-0.0,-0.56,-0.02,-0.57,0.02,-0.54,0.01,-0.56,0.0,-0.57,0.0,-0.56,0.01,-0.56,0.0,-0.57,0.01,-0.58,0.01,-0.57,-0.01,-0.56,0.0,-0.58,0.01,-0.57,0.01,-0.57,-0.01,-0.57,-0.01,-0.55,0.02,-0.58,-0.0,-0.57,0.01,-0.56,-0.0,-0.54,0.01,-0.56,0.01,-0.56,-0.0,-0.58,0.02,-0.59,0.01,-0.57,0.0,-0.55,0.01,-0.57,-0.0,-0.56,0.02,-0.54,0.01,-0.56,0.02,-0.57,0.01,-0.58,-0.01,-0.42,0.03,-0.41,0.14,-0.25,-0.03,-0.41,0.07,-0.32,-0.07,-0.4,0.09,-0.38,0.11,-0.29,-0.21,-0.27,-0.11,-0.55,0.14,-0.39,0.01,-0.16,0.12,-0.19,0.18,-0.35,-0.1,-0.29,-0.21,-0.31,0.01,-0.33,0.17,-0.48,0.02,-0.39,0.01,-0.4,-0.11,-0.36,-0.09,-0.4,-0.04,-0.25,-0.13,-0.23,0.05,-0.33,0.06,-0.41,-0.07,-0.36,0.17,-0.25,-0.11,-0.34,-0.08,-0.41,-0.15,-0.37,-0.06,-0.42,-0.04,-0.33,0.0,-0.31,-0.09,-0.41,-0.02,-0.36,0.08,-0.04,0.01,-0.22,-0.01,-0.42,0.08,-0.3,-0.07,-0.41,-0.19,-0.42,-0.07,-0.31,0.18,-0.34,0.06,-0.26,0.07,-0.47,0.1,-0.36,-0.04,-0.41,0.1,-0.38,-0.07,-0.25,-0.09,0.91,-0.03,0.87,-0.01,1.0,0.0,0.89,0.01,0.9,0.05,0.86,-0.02,0.85,0.01,0.95,0.0,0.9,-0.02,0.9,0.01,0.89,-0.03,0.98,-0.02,0.92,0.02,0.87,-0.01,0.9,0.03,0.91,-0.04,0.87,0.03,0.84,-0.04,1.0,0.06,0.88,-0.09,0.89,0.03,0.88,0.05,0.9,-0.06,0.97,0.05,0.86,-0.01,0.93,0.04,0.93,0.01,0.91,-0.0,0.97,0.01,0.91,0.02,0.91,-0.01,0.94,0.02,0.92,0.02,0.89,-0.01,0.97,-0.01,0.85,0.02,0.95,-0.04,0.99,0.01,0.95,0.03,0.88,0.0,0.92,0.02,0.84,-0.02,0.89,0.04,0.86,-0.07,0.9,-0.06,0.89,0.08,0.94,0.0,0.91,-0.02,0.85,0.01,0.87,0.01],"p2":[-0.88,-0.31,-0.28,-0.17,-0.64,-0.28,-0.42,-0.3,-0.26,-0.32,-0.6,-0.24,-0.2,-0.14,-0.41,-0.29,-0.9,-0.34,-0.67,-0.18,-0.55,0.09,-0.31,-0.09,-0.35,-0.02,-0.61,0.03,-0.61,0.02,-0.25,-0.18,-0.23,-0.39,-0.28,-0.26,-0.35,-0.05,-0.64,0.01,-0.37,0.1,-0.64,-0.25,-0.29,-0.09,-0.91,-0.29,-0.85,-0.34,-0.86,-0.31,-0.63,0.05,-0.36,-0.06,-0.28,-0.16,-0.54,0.07,-0.25,-0.34,-0.27,-0.08,-0.65,-0.25,-0.18,-0.13,-0.31,-0.18,-0.27,-0.38,-0.28,-0.24,-0.74,-0.15,-0.52,0.06,-0.69,-0.17,-0.5,0.05,-0.34,-0.19,-0.24,-0.36,-0.56,-0.24,-0.19,-0.28,-0.71,-0.16,-0.55,-0.24,-0.85,-0.29,-0.59,-0.02,-0.21,-0.35,0.03,-0.02,0.26,0.75,-0.01,0.54,-0.04,0.48,-0.46,0.48,0.09,0.39,0.05,0.71,-0.46,0.42,-0.35,0.19,-0.93,-0.27,-0.32,0.17,0.17,0.46,0.03,0.51,-0.04,0.52,-0.45,0.42,0.31,0.75,0.24,0.75,0.01,0.03,-0.18,0.25,-0.34,0.17,0.15,0.38,-0.37,0.35,-0.46,0.45,0.32,0.78,0.08,0.39,-0.36,0.34,0.13,0.71,0.32,0.72,-0.39,0.37,-0.17,0.55,0.14,0.39,-0.35,0.12,-0.02,0.51,-0.26,0.5,-0.19,0.24,0.04,0.7,0.18,0.48,0.16,0.45,-0.01,0.08,-0.23,0.53,-0.16,0.56,0.02,0.0,0.14,0.71,0.3,0.75,0.0,0.5,0.0,0.05,-0.25,0.51,0.02,0.47,-0.01,0.09,-0.42,0.4,0.47,-0.15,0.99,0.1,0.72,0.15,0.25,-0.5,0.49,-0.09,0.4,-0.35,0.64,-0.49,0.58,-0.05,0.28,-0.55,0.51,-0.15,0.28,-0.53,0.72,0.16,0.75,-0.15,0.31,-0.52,0.44,-0.25,0.27,-0.61,0.65,-0.48,0.57,-0.55,0.49,-0.07,0.54,-0.53,0.51,-0.13,0.73,-0.11,0.54,-0.58,0.54,-0.11,0.65,-0.62,0.65,-0.1,0.63,-0.03,0.4,-0.34,0.73,0.18,0.43,-0.27,0.26,-0.51,0.75,-0.16,0.6,-0.04,1.0,0.12,0.66,-0.01,0.51,-0.17,0.77,-0.16,0.24,-0.48,0.61,0.01,0.47,-0.26,0.43,-0.22,0.58,-0.56,0.66,-0.08,0.28,-0.58,0.52,-0.54,0.55,-0.16,0.67,-0.0,0.98,0.09,0.64,-0.61,0.74,-0.09],"p5":[-0.42,0.1,-0.69,-0.05,-0.83,-0.18,-0.72,-0.17,-0.82,0.01,-0.54,-0.14,-0.41,-0.07,-0.72,-0.15,-0.47,-0.25,-0.48,-0.13,-0.67,0.24,-0.63,-0.01,-0.52,-0.31,-0.57,0.21,-0.59,0.19,-0.65,-0.09,-0.9,0.05,-0.82,-0.08,-0.57,-0.32,-0.47,0.22,-0.64,0.09,-0.5,-0.08,-0.63,0.03,-0.39,0.14,-0.39,0.09,-0.44,0.1,-0.53,0.23,-0.6,-0.33,-0.69,-0.08,-0.65,0.21,-0.84,0.04,-0.58,0.01,-0.51,-0.06,-0.38,-0.07,-0.73,-0.01,-0.88,0.11,-0.77,-0.07,-0.38,-0.19,-0.65,0.17,-0.45,-0.12,-0.71,0.16,-0.75,0.03,-0.86,0.06,-0.57,-0.17,-0.9,-0.03,-0.41,-0.15,-0.6,-0.18,-0.45,0.06,-0.55,0.13,-0.84,0.12,-0.09,-0.14,0.34,-0.73,-0.01,-0.85,-0.02,-0.78,0.19,-0.42,0.17,-0.88,-0.12,-0.75,0.14,-0.36,-0.02,-0.54,-0.39,0.19,-0.09,-0.51,0.09,-0.98,0.03,-0.92,0.06,-0.79,0.12,-0.37,0.34,-0.64,0.37,-0.75,-0.16,-0.19,-0.19,-0.6,-0.06,-0.51,0.2,-0.98,0.03,-0.46,0.16,-0.4,0.32,-0.62,0.18,-0.86,0.02,-0.49,0.27,-0.8,0.37,-0.6,0.06,-0.42,0.1,-0.67,0.18,-0.96,-0.08,-0.44,0.04,-0.82,0.11,-0.59,-0.19,-0.58,-0.1,-0.76,0.05,-1.0,0.11,-0.98,-0.18,-0.26,0.16,-0.63,0.09,-0.68,-0.12,-0.16,0.29,-0.79,0.34,-0.66,0.05,-0.85,-0.18,-0.21,0.13,-0.6,0.1,-0.85,-0.18,-0.29,0.08,-0.38,0.78,0.48,0.32,0.6,0.43,0.38,0.57,0.77,0.63,0.61,0.74,0.77,0.26,0.8,0.59,0.52,0.56,0.85,0.69,0.55,0.57,0.83,0.42,0.36,0.58,0.36,0.6,0.81,0.76,0.67,0.61,0.93,0.25,0.78,0.32,0.82,0.58,0.63,0.37,0.89,0.66,0.56,0.66,0.4,0.4,0.84,0.62,0.56,0.37,0.7,0.81,0.58,0.56,0.44,0.75,0.76,0.38,0.36,0.78,0.71,0.56,0.8,0.56,0.34,0.57,0.5,0.3,0.57,0.51,0.43,0.71,0.52,0.57,0.31,0.56,0.71,0.64,0.36,0.71,0.67,0.81,0.66,0.33,0.8,0.62,0.43,0.58,0.89,0.4,0.88,0.77,0.54,0.49,0.44,0.33,0.62,0.36,0.72,0.7,0.41],"p30":[-0.36,0.16,-0.41,0.17,-0.48,0.23,-0.49,0.15,-0.41,0.2,-0.44,0.13,-0.39,0.12,-0.47,0.16,-0.36,0.15,-0.42,0.12,-0.4,0.23,-0.41,0.16,-0.34,0.08,-0.39,0.19,-0.36,0.2,-0.36,0.1,-0.45,0.17,-0.43,0.22,-0.51,0.15,-0.31,0.19,-0.4,0.07,-0.41,0.14,-0.38,0.15,-0.34,0.14,-0.34,0.13,-0.37,0.17,-0.35,0.2,-0.52,0.16,-0.45,0.15,-0.37,0.23,-0.42,0.19,-0.38,0.12,-0.4,0.14,-0.39,0.09,-0.4,0.19,-0.46,0.2,-0.43,0.19,-0.46,0.09,-0.37,0.22,-0.41,0.12,-0.38,0.26,-0.39,0.25,-0.43,0.19,-0.46,0.12,-0.44,0.25,-0.42,0.1,-0.47,0.13,-0.36,0.16,-0.48,0.2,-0.43,0.23,-0.4,-0.0,-0.53,-0.16,-0.49,-0.09,-0.45,0.02,-0.5,-0.05,-0.41,-0.08,-0.47,-0.01,-0.56,-0.03,-0.58,0.01,-0.29,0.16,-0.56,0.05,-0.45,-0.14,-0.47,-0.13,-0.49,-0.06,-0.56,-0.03,-0.56,-0.12,-0.54,-0.17,-0.36,0.02,-0.6,0.09,-0.56,0.05,-0.37,-0.1,-0.53,0.02,-0.54,-0.04,-0.56,-0.12,-0.42,-0.08,-0.55,0.03,-0.5,-0.15,-0.58,-0.11,-0.53,-0.02,-0.62,-0.04,-0.39,-0.1,-0.51,0.03,-0.47,-0.07,-0.6,-0.06,-0.6,0.09,-0.47,-0.01,-0.45,-0.14,-0.43,-0.12,-0.33,-0.01,-0.61,-0.08,-0.61,-0.04,-0.39,0.0,-0.5,-0.15,-0.56,-0.12,-0.46,-0.08,-0.34,0.01,-0.59,-0.06,-0.44,-0.07,-0.33,-0.03,-0.54,-0.04,0.81,-0.13,0.98,-0.07,0.84,-0.1,0.94,-0.17,0.91,-0.2,0.96,-0.12,0.92,-0.04,0.89,-0.14,0.95,-0.14,0.87,-0.15,0.95,-0.14,0.83,-0.09,0.88,-0.09,0.94,-0.11,0.9,-0.16,1.0,-0.12,0.9,-0.04,0.92,-0.05,0.93,-0.22,0.93,-0.1,0.88,-0.15,0.88,-0.1,0.91,-0.09,0.88,-0.18,0.94,-0.08,0.83,-0.14,0.89,-0.09,0.97,-0.13,0.81,-0.1,0.92,-0.16,0.94,-0.15,0.85,-0.05,0.89,-0.12,0.99,-0.06,0.87,-0.08,0.86,-0.14,0.87,-0.05,0.95,-0.21,0.86,-0.09,0.9,-0.18,0.88,-0.22,0.92,-0.06,0.89,-0.09,0.98,-0.15,0.93,-0.13,0.82,-0.15,0.86,-0.11,0.96,-0.06,0.94,-0.07,0.85,-0.17]};
const TOY_COLORS = [RED, TEAL, YELLOW];
const PANELS = [["pca", "PCA (for reference)"], ["p2", "t-SNE, perplexity 2"], ["p5", "t-SNE, perplexity 5"], ["p30", "t-SNE, perplexity 30"]];

function Perplexity() {
  return (
    <Fig caption="Illustrative data, real t-SNE runs. Three groups in 10 dimensions: red is very tight, teal is six times wider and close to red, yellow is far from both. PCA (a straight projection) keeps those differences in size and distance. t-SNE makes the groups look similar in size, and how far apart they appear depends on the perplexity setting.">
      <div className={s.multi}>
        {PANELS.map(([k, name]) => (
          <div key={k}>
            <svg viewBox="-1.15 -1.15 2.3 2.3" role="img" aria-label={`${name}: three coloured groups of points.`}>
              {TOY.label.map((c, i) => <circle key={i} cx={TOY[k][2 * i]} cy={-TOY[k][2 * i + 1]} r="0.035" fill={TOY_COLORS[c]} />)}
            </svg>
            <p>{name}</p>
          </div>
        ))}
      </div>
    </Fig>
  );
}

const TABLE = [
  ["PCA", "Linear", "Overall spread; big distances", "Curved shapes; small groups hidden in the crowd", "Fast"],
  ["t-SNE", "Non-linear", "Each point’s close neighbours", "Cluster sizes; distances between clusters", "Slower on big data"],
  ["UMAP", "Non-linear", "Close neighbours, plus some large-scale layout", "Exact densities and distances", "Fast"],
  ["Isomap", "Non-linear", "Distances measured along the data’s surface", "Breaks if neighbours link across gaps; noisy data", "Medium"],
  ["LDA", "Linear, uses labels", "Separation between known classes", "Everything the labels don’t cover", "Fast"],
];

export default function DimensionalityReduction() {
  return (
    <>
      <p>
        Word embeddings have hundreds of numbers per word; the vectors inside large language models have thousands. Our eyes handle two dimensions on a screen and three at most.
        <strong> Dimensionality reduction</strong> is the family of methods that squash many dimensions down to two or three so we can look. It is one of the most useful tools for understanding
        embeddings, and one of the easiest to misread. This article explains the main methods, what each one keeps, and what each one quietly throws away.
      </p>

      <h2>Why any picture must lie a little</h2>
      <p>
        Going from 300 numbers to 2 means discarding information. There is no way around it: a flat picture simply has fewer places to put things.
        A photo of a room loses depth; a world map stretches Greenland. Every method makes a choice about <em>which</em> relationships to keep.
      </p>
      <Shadow />
      <p>
        So the useful question is never “which method is correct?” but “what did this method try to keep, and what did it give up?”
      </p>

      <h2>A test shape: the swiss roll</h2>
      <p>
        To compare methods, it helps to use data where we know the right answer. A classic test is the <strong>swiss roll</strong>: a flat rectangular sheet, rolled up into a spiral in 3D.
        The points’ real structure is two-dimensional (a position along the sheet and a position across it), but the roll hides that.
        A method that truly understood the data would unroll it. Colour follows position along the sheet, so a good 2D picture keeps the colours in order.
      </p>
      <Fig caption="Illustrative data (700 points). PCA, t-SNE, Isomap and LDA are real scikit-learn runs; the UMAP view comes from a small re-implementation of the UMAP algorithm, so it is close to, but not identical to, the official library. Turn the 3D roll with the slider, then switch between methods to see each one’s 2D result. The points glide from one layout to the next so you can follow them.">
        <SwissRoll />
      </Fig>
      <p>Keep this picture in mind as we go through the methods one by one.</p>

      <h2>PCA: the widest directions</h2>
      <p>
        <strong>Principal component analysis</strong> (PCA) finds the direction in which the data is most spread out and calls it the first principal component.
        The second is the most spread-out direction at right angles to the first, and so on. Keeping the first two and dropping the rest gives a 2D picture.
        Geometrically this is a rotation followed by a shadow: PCA picks the camera angle that shows the most spread.
      </p>
      <p>
        PCA is <strong>linear</strong>: it can only rotate and flatten, never bend. That makes it fast, predictable (the same data always gives the same picture) and honest about large distances.
        It also means it cannot unroll the swiss roll; it just photographs it from the side where it looks biggest.
        For word embeddings, where meaning is spread over many directions, the first two components often capture only a small share of the total spread, so PCA pictures of words tend to look like one big overlapping cloud.
      </p>

      <h2>t-SNE: keep the neighbours together</h2>
      <p>
        <strong>t-SNE</strong> (t-distributed stochastic neighbour embedding, 2008) gives up on large distances and focuses on neighbourhoods. For each point it asks, in the original space,
        “which other points are my close neighbours, and how close?” It then starts from a random or rough 2D layout and moves the points around, step by step,
        until each point’s 2D neighbours match its original neighbours as well as possible.
      </p>
      <p>
        That makes t-SNE very good at revealing clusters. It also produces three well-known illusions:
      </p>
      <ul>
        <li><strong>Cluster sizes mean nothing.</strong> t-SNE adapts to local density, so a tight group and a loose group come out looking about the same size.</li>
        <li><strong>Distances between clusters mean little.</strong> Two clusters far apart on the plot may or may not be far apart in the data.</li>
        <li><strong>Settings change the picture.</strong> The main knob, <strong>perplexity</strong>, is roughly how many neighbours each point pays attention to. Typical values are between 5 and 50.</li>
      </ul>
      <Perplexity />
      <p>
        t-SNE is also random: run it twice with different seeds and the picture can change, even though the neighbourhoods are similar.
      </p>

      <h2>UMAP: similar goal, faster, a bit more global</h2>
      <p>
        <strong>UMAP</strong> (uniform manifold approximation and projection, 2018) follows the same basic plan: build a graph connecting each point to its nearest neighbours, then find a 2D layout that keeps that graph intact.
        Its maths is different, and in practice it is much faster on large datasets, so it has become a common default for embeddings.
      </p>
      <p>
        UMAP tends to keep somewhat more of the large-scale layout than t-SNE: groups that are related often end up nearer each other. But it is still a neighbourhood method, so the same caution applies:
        distances between clusters and the size of each cluster are not reliable. Its two main settings are the number of neighbours (small values focus on fine detail, large values on the big picture)
        and a minimum distance that controls how tightly points are packed.
      </p>

      <h2>Two more: Isomap and LDA</h2>
      <p>
        <strong>Isomap</strong> (2000) also builds a nearest-neighbour graph, but then measures the distance between two points as the shortest route through that graph, like walking along the surface
        instead of tunnelling through the air. These are called <strong>geodesic</strong> distances. It then lays points out so those distances are kept. On a clean shape like the swiss roll it works beautifully;
        on noisy data a few wrong links (“short circuits” between layers) can ruin it.
      </p>
      <p>
        <strong>LDA</strong> here means <strong>linear discriminant analysis</strong>. Unlike everything above, it is <strong>supervised</strong>: you give it a label for each point (say, the topic of each word)
        and it finds the flat projection that best separates those labels. It is useful when you already know the groups and want to see how separable they are.
        Watch out for the name clash: in text analysis, “LDA” more often means latent Dirichlet allocation, an unrelated method for finding topics in documents.
      </p>

      <h2>At a glance</h2>
      <Fig caption="What each method tries to keep and what it is known to distort. “Linear” methods can only rotate and flatten; non-linear ones can bend and stretch.">
        <div className={l.scroll}>
          <table className={l.table} style={{ minWidth: 560 }}>
            <thead><tr>{["Method", "Type", "Keeps", "Don’t trust", "Speed"].map((h) => <th key={h} style={{ textAlign: "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {TABLE.map((r) => (
                <tr key={r[0]}>{r.map((c, i) => <td key={i} style={{ textAlign: "left" }}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>How to read these plots</h2>
      <ul>
        <li><strong>Trust neighbours more than distances.</strong> Points drawn right next to each other are usually close in the original space. Points far apart may or may not be.</li>
        <li><strong>Ignore cluster sizes and gaps</strong> in t-SNE and UMAP. A big blob is not necessarily a varied group, and a wide gap is not necessarily a big difference.</li>
        <li><strong>Check the original space.</strong> Before believing a pattern, confirm it with real distances or similarities in the full vectors.</li>
        <li><strong>Try more than one setting and seed.</strong> A pattern that survives different perplexities, neighbour counts and random seeds is more likely to be real.</li>
        <li><strong>Random data can look structured.</strong> Neighbourhood methods can produce clumps even from noise, so be wary of clusters you can’t explain.</li>
      </ul>
      <Callout title="In one sentence">
        Every 2D picture of high-dimensional data is a compromise; know which compromise your method made before you read meaning into it.
      </Callout>
      <p>
        For why the structure is there in the first place, see <ArticleLink slug="latent-space">Latent space</ArticleLink> and <ArticleLink slug="what-are-embeddings">What are embeddings?</ArticleLink>.
        The site guide <ArticleLink slug="pca-vs-umap">PCA vs UMAP</ArticleLink> shows how these two methods are used in the <Link href="/embedding">Embedding explorer</Link>, where you can switch between them on 10,000 real words.
      </p>

      <FurtherReading links={[
        { href: "https://distill.pub/2016/misread-tsne/", title: "How to Use t-SNE Effectively", source: "Distill, 2016", note: "interactive examples of every t-SNE pitfall" },
        { href: "https://pair-code.github.io/understanding-umap/", title: "Understanding UMAP", source: "Google PAIR", note: "UMAP and t-SNE side by side, interactively" },
        { href: "https://umap-learn.readthedocs.io/en/latest/how_umap_works.html", title: "How UMAP Works", source: "umap-learn documentation" },
        { href: "https://en.wikipedia.org/wiki/Principal_component_analysis", title: "Principal component analysis", source: "Wikipedia" },
      ]} />
    </>
  );
}
