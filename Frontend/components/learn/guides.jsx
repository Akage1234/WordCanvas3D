import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink } from "@/components/learn/kit";
import s from "./learn.module.css";

const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE, GREEN, PINK] = CLUSTER_COLORS;

function Chips({ label, items }) {
  return (
    <div className={s.row}>
      {label && <span className={s.rowLabel}>{label}</span>}
      {items.map(([text, sub], i) => (
        <span key={i} className={s.chip} style={{ "--tc": CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
          <b>{text}</b>
          {sub !== undefined && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

function Fig({ caption, children }) {
  return (
    <figure className={s.fig}>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/* ---------- 1. Tokens ---------- */

function WhatIsAToken() {
  return (
    <>
      <p>
        When you type a sentence into a chatbot, the model never sees your letters, and it never sees your words either. It sees a list of whole numbers.
        The step that turns text into those numbers is called <strong>tokenization</strong>, and each piece of text that gets its own number is a <strong>token</strong>.
      </p>
      <p>
        Here is a short sentence split by the <code>o200k_base</code> tokenizer, the one used by GPT-4o and the default in this site’s Tokenizer.
        Each chip is one token, and the number under it is that token’s <strong>ID</strong>: its position in the tokenizer’s list of known pieces.
      </p>
      <Fig caption="“The cat sat on the mat.” in o200k_base: 7 tokens. The dots mark spaces, which belong to the start of the next token.">
        <Chips items={[["The", 976], ["·cat", 9059], ["·sat", 10139], ["·on", 402], ["·the", 290], ["·mat", 2450], [".", 13]]} />
      </Fig>
      <p>
        So far it looks like “one word, one token”. Two details already break that idea. The full stop is its own token.
        And the space in front of each word is glued onto the word: the model’s vocabulary has a separate entry for <code>·cat</code> (with a space) and <code>cat</code> (without one).
      </p>

      <h2>The vocabulary is a fixed list</h2>
      <p>
        A tokenizer comes with a vocabulary: a list of text pieces, each paired with an ID. The name <code>o200k_base</code> hints at its size, roughly 200,000 entries.
        The older <code>cl100k_base</code> (GPT-4 and GPT-3.5) has about 100,000, and GPT-2’s has about 50,000.
      </p>
      <p>
        Because the list is fixed, the tokenizer has to express <em>any</em> input with pieces it already has. Capitalization, spacing and spelling all matter.
        In <code>o200k_base</code>, <code>cat</code> is ID 8837, <code>·cat</code> is 9059, and <code>Cat</code> is 23546. To the model these are three unrelated numbers.
        It only learns that they mean nearly the same thing by seeing them used in similar ways during training.
      </p>

      <h2>Why not just use words?</h2>
      <p>
        A word-level vocabulary sounds simpler, but it runs into trouble fast. There is no end to words: names, typos, slang, product names, code identifiers, words from other languages.
        Any word missing from the list would have to be replaced with a generic “unknown” marker, and its meaning would be lost.
      </p>
      <p>
        The opposite extreme, one token per character, never meets an unknown word, but it makes every text very long.
        Models do more work for longer inputs, and a single letter carries almost no meaning on its own.
      </p>
      <p>
        Modern tokenizers sit in between. They use <strong>subword</strong> pieces (smaller than a word, usually bigger than a letter): common words get a single token, and rarer words are built from a few smaller, reusable parts.
        The full trade-off is explained in <ArticleLink slug="why-tokens">Why models read tokens, not letters or words</ArticleLink>.
      </p>
      <Fig caption="The same word, split differently by three tokenizers when it starts the text. With a leading space, “ unbelievable” is a single token in all three.">
        <Chips label="o200k_base · 3 tokens" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="cl100k_base · 3 tokens" items={[["un"], ["belie"], ["vable"]]} />
        <Chips label="gpt2 · 4 tokens" items={[["un"], ["bel"], ["iev"], ["able"]]} />
        <Chips label="o200k_base, with a leading space · 1 token" items={[["·unbelievable", 83614]]} />
      </Fig>
      <p>
        That last row is worth a second look. In the middle of a sentence, where the word follows a space, it is common enough to earn its own token.
        At the very start of a text, with no space before it, the same word is rare, so it gets built from parts.
      </p>

      <h2>How the pieces are chosen</h2>
      <p>
        The GPT tokenizers use a method called <strong>byte pair encoding</strong> (BPE). Training starts from the smallest possible pieces, individual bytes of text.
        It then scans a large amount of text, finds the pair of neighbouring pieces that appears most often, and merges that pair into a new vocabulary entry.
        It repeats this until the vocabulary reaches its target size.
      </p>
      <p>
        Early merges capture very common letter pairs such as <code>in</code> or <code>he</code>. Later merges build whole frequent words and word endings like <code>ization</code>.
        That is why <code>tokenization</code> comes out as <code>token</code> + <code>ization</code> in all three GPT tokenizers.
        The pieces are statistical, not grammatical: they follow what was frequent in the training text, not where a dictionary would split a word.
        For a worked, merge-by-merge example, see <ArticleLink slug="tokenization-algorithms">How tokenizers are built</ArticleLink>.
      </p>
      <p>
        The LLaMA options in the Tokenizer use a different tool, SentencePiece. You will notice two differences there.
        Its vocabulary writes spaces as <code>▁</code> (click a token to see this as its “vocabulary piece”), and every text starts with a special <code>&lt;s&gt;</code> token that marks the beginning of a sequence.
      </p>

      <h2>Side effects you can see</h2>
      <p>Once you know the model reads tokens, a few familiar quirks make more sense.</p>
      <ul>
        <li>
          <strong>Spelling questions are awkward.</strong> In <code>o200k_base</code>, <code>strawberry</code> is three tokens: <code>st</code>, <code>raw</code>, <code>berry</code>.
          The model never directly sees ten separate letters, which is one reason letter-counting questions trip models up.
        </li>
        <li>
          <strong>Numbers are chunked.</strong> The GPT tokenizers split <code>1234567</code> into <code>123</code>, <code>456</code>, <code>7</code>.
          LLaMA’s tokenizer splits it into one token per digit. Arithmetic on chunks like these is harder than it looks.
        </li>
        <li>
          <strong>Length limits are counted in tokens.</strong> A model’s context window (the most text it can read at once) and many API prices are measured in tokens, not words or characters.
        </li>
      </ul>

      <h2>What happens next</h2>
      <p>
        A token ID on its own is just a position in a list. ID 9059 is not “more” than ID 402 in any meaningful way.
        The next step inside a model is to swap each ID for a long list of numbers, called an embedding, that does carry meaning.
        That is the subject of <Link href="/learn/how-a-word-becomes-300-numbers">How a word becomes 300 numbers</Link>.
      </p>
    </>
  );
}

/* ---------- 2. Emoji and languages ---------- */

const GREETINGS = [
  ["English", "Hello, world.", 4, 4, 4],
  ["Arabic", "مرحباً بالعالم.", 15, 13, 6],
  ["Hindi", "नमस्ते दुनिया।", 25, 15, 6],
  ["Japanese", "こんにちは世界。", 11, 5, 3],
];
const ENCODERS = [["gpt2", RED], ["cl100k_base", YELLOW], ["o200k_base", TEAL]];

function EmojiAndLanguages() {
  return (
    <>
      <p>
        Type “Hello, world.” into the Tokenizer and you get 4 tokens. Type the same greeting in Hindi and, depending on the tokenizer, you can get anywhere from 6 to 25.
        Emoji behave similarly: a single 🎉 can take two, three or more tokens. None of this is random. It comes from how text is stored as bytes, and from what the tokenizer saw during training.
      </p>

      <h2>Everything starts as bytes</h2>
      <p>
        Computers store text using an encoding, a fixed rule for turning each character into <strong>bytes</strong> (a byte is a small number from 0 to 255, the basic unit of computer memory).
        Almost everything today uses <strong>UTF-8</strong>, which gives each character between one and four bytes:
      </p>
      <ul>
        <li>Basic Latin letters, digits and punctuation: 1 byte each.</li>
        <li>Arabic, Hebrew, Greek and Cyrillic letters: 2 bytes each.</li>
        <li>Devanagari (used for Hindi), Chinese and Japanese characters: 3 bytes each.</li>
        <li>Most emoji: 4 bytes each.</li>
      </ul>
      <p>
        You can watch this in the Tokenizer: under the input it shows the number of <strong>code points</strong> (the numbered characters of the Unicode standard; roughly, characters) and <strong>UTF-8 bytes</strong>.
        “Hello, world.” is 13 characters and 13 bytes. The Hindi “नमस्ते दुनिया।” is 14 code points but 40 bytes.
      </p>

      <h2>Merges follow the training data</h2>
      <p>
        The GPT tokenizers are <em>byte-level</em> BPE tokenizers. They start from single bytes and learn merges from a large pile of training text, keeping the pairs that appear most often.
        (The first guide, <Link href="/learn/what-is-a-token">What is a token</Link>, gives the short version;
        <ArticleLink slug="tokenization-algorithms">How tokenizers are built</ArticleLink> walks through the merges step by step.)
      </p>
      <p>
        If the training text is mostly English, most merges end up being English words and word parts. Other scripts get fewer merges, so their text stays split into smaller pieces.
        In the worst case a single character is split across tokens, because its bytes were never merged together.
      </p>
      <Fig caption="Token counts for the same greeting, as shown in this site’s Tokenizer. Each phrase includes its final punctuation mark.">
        <div className={s.legend}>
          {ENCODERS.map(([name, color]) => <span key={name} style={{ "--tc": color }}>{name}</span>)}
        </div>
        <dl className={s.bars}>
          {GREETINGS.map(([lang, text, ...counts]) => (
            <div key={lang} style={{ display: "contents" }}>
              <dt title={text}>{lang}</dt>
              <dd>
                {counts.map((n, i) => (
                  <span key={i} className={s.bar} style={{ "--tc": ENCODERS[i][1], "--n": n }}>
                    <i />{n}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Fig>
      <p>
        Two things stand out. First, English costs the same 4 tokens everywhere, because every one of these vocabularies learned <code>Hello</code>, <code>,</code> and <code>·world</code> long ago.
        Second, the newer <code>o200k_base</code> is far better at the other scripts. Its vocabulary is about twice the size of <code>cl100k_base</code>’s,
        and its extra entries include many more pieces of non-English text. <code>世界</code> (“world” in Japanese) is one token in <code>o200k_base</code>, while <code>cl100k_base</code> needs three, splitting <code>世</code> into raw bytes.
      </p>

      <h2>Emoji: several bytes, sometimes several characters</h2>
      <p>
        The 🎉 emoji is one character stored as four bytes: <code>F0 9F 8E 89</code>. A tokenizer that has not merged those bytes into one piece has to spend several tokens on it.
        The Tokenizer shows pieces that are only part of a character as hex bytes, so you can see exactly where the split happens.
      </p>
      <Fig caption="The four bytes of 🎉 and how two tokenizers group them. Numbers under each chip are token IDs.">
        <Chips label="cl100k_base · 3 tokens" items={[["F0 9F", 9468], ["8E", 236], ["89", 231]]} />
        <Chips label="o200k_base · 2 tokens" items={[["F0 9F 8E", 71344], ["89", 231]]} />
        <Chips label="👍 in o200k_base · 1 token" items={[["👍", 82514]]} />
      </Fig>
      <p>
        Popular emoji like 👍 and ✅ are single tokens in <code>o200k_base</code>, while in <code>cl100k_base</code> they still take two or three.
      </p>
      <p>
        Some emoji are not even one character. 🛠️ is the hammer-and-wrench symbol plus an invisible <strong>variation selector</strong> that asks for the colourful emoji style.
        That makes 4 tokens in both GPT-4 era tokenizers. Family emoji such as 👨‍👩‍👧 are several people glued together with invisible “zero width joiner” characters:
        5 code points, 18 bytes, and 8 tokens in <code>o200k_base</code>, for what looks like one symbol.
      </p>

      <h2>Why the count matters</h2>
      <ul>
        <li><strong>Cost.</strong> Many AI APIs charge per token, so the same message can cost more in one language than another.</li>
        <li><strong>Context.</strong> A model’s context window is a token budget. Text that needs more tokens fills it sooner.</li>
        <li><strong>Speed.</strong> Models generate one token at a time, so a reply that needs more tokens takes longer to write.</li>
      </ul>
      <p>
        This is also why tokenizer changes matter. Moving from <code>cl100k_base</code> to <code>o200k_base</code> cut the Hindi greeting above from 15 tokens to 6, with no change to the text.
      </p>

      <h2>Practical takeaways</h2>
      <ul>
        <li><strong>Count with the right tokenizer.</strong> The same text gives different counts in different vocabularies, so a count from one model does not carry over to another.</li>
        <li><strong>Decoration is not free.</strong> Emoji, box-drawing characters and fancy symbols in a prompt can each cost several tokens while adding little meaning.</li>
        <li><strong>Nothing is ever “unknown”.</strong> Because byte-level tokenizers can always fall back to single bytes, any text can be encoded. Rare text is not rejected, it is just expensive.</li>
      </ul>

      <h2>Try it</h2>
      <p>
        The Tokenizer has two presets made for this article: <strong>World scripts</strong> and <strong>Emoji</strong>.
        Load one, then switch between tokenizers and watch the token count change. Turn on the LLaMA tokenizer too: it uses roughly one token per character for these scripts,
        and to raw bytes for most emoji.
      </p>
    </>
  );
}

/* ---------- 3. Embeddings ---------- */

const KING = {
  king: [-0.07, -0.37, -0.21, -0.88, 0.06, -0.26, 0.34, -0.23],
  queen: [-0.08, -0.3, -0.18, -0.81, -0.66, 0.07, 0.21, -0.34],
  man: [-0.02, -0.02, -0.4, 0.27, 0.18, 0.28, -0.27, 0.1],
  apple: [-0.17, 0.13, 0.34, -0.71, -0.21, -0.77, -0.44, 0.26],
};
const SIMS = [["cat", "dog", 0.722], ["king", "queen", 0.696], ["king", "man", 0.468], ["cat", "car", 0.282], ["king", "apple", 0.269]];

function WordToNumbers() {
  return (
    <>
      <p>
        A tokenizer turns text into IDs, but an ID is only a position in a list. Nothing about the number 9059 says “cat”.
        To work with meaning, a model needs a representation where similar words look similar. That representation is an <strong>embedding</strong>:
        a list of numbers, often a few hundred long, for every word or token. Such a list is also called a <strong>vector</strong>, and each position in it is a <strong>dimension</strong>.
      </p>
      <p>
        This guide sticks to what the site’s Embedding page shows. For the idea itself, built up from scratch, read <ArticleLink slug="what-are-embeddings">What are embeddings?</ArticleLink>
      </p>
      <p>
        The Embedding page on this site shows three classic sets of word embeddings: <strong>GloVe</strong>, <strong>Word2Vec</strong> and <strong>FastText</strong>.
        In all three, every word is a list of exactly 300 numbers.
      </p>

      <h2>What 300 numbers look like</h2>
      <p>Here are the first 8 of the 300 numbers for four words, taken from the GloVe data this site uses.</p>
      <Fig caption="First 8 of 300 GloVe values, rounded. Teal is positive, red is negative, and stronger colour means a larger value.">
        <div className={s.cells}>
          {Object.entries(KING).map(([word, values]) => (
            <div key={word} style={{ display: "contents" }}>
              <span>{word}</span>
              {values.map((v, i) => (
                <span key={i} className={s.cell} style={{ background: `color-mix(in srgb, ${v < 0 ? RED : TEAL} ${Math.round(Math.abs(v) * 90)}%, #1a1d24)` }}>
                  {v.toFixed(2)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Fig>
      <p>
        No single number means “royal” or “fruit”. The meaning is spread across all 300 at once. Still, even this tiny slice hints at a pattern:
        <code>king</code> and <code>queen</code> have a similar shape in several positions, while <code>man</code> and <code>apple</code> go their own way.
        What the dimensions do and don’t capture is the subject of <ArticleLink slug="latent-space">Latent space</ArticleLink>.
      </p>

      <h2>Where the numbers come from</h2>
      <p>
        All three models are built on the same idea, often summed up by the linguist J.R. Firth:
        “You shall know a word by the company it keeps.” Words that appear in similar contexts tend to have similar meanings.
        The models read huge amounts of text and adjust each word’s numbers until words with similar neighbours end up with similar lists.
      </p>
      <ul>
        <li>
          <strong>Word2Vec</strong> (Google, 2013) trains a small neural network on a simple guessing game: predict the words around a given word, or the word from the words around it.
          After training, the network’s internal weights for each word become its embedding.
        </li>
        <li>
          <strong>GloVe</strong> (Stanford, 2014) first counts how often each pair of words appears near each other across the whole corpus.
          It then fits vectors so that the relationship between two words’ vectors reflects how often those words co-occur.
        </li>
        <li>
          <strong>FastText</strong> (Facebook, 2016–17) extends Word2Vec by also learning vectors for chunks of characters inside words, so <code>walk</code>, <code>walking</code> and <code>walked</code> share parts.
          That helps with rare words and spelling variants.
        </li>
      </ul>
      <p>
        The details differ in the data too. The GloVe vectors here are all lowercase. Word2Vec and FastText keep capital letters, so <code>Paris</code> and <code>paris</code> can be different entries,
        and the Word2Vec set even includes joined phrases like <code>prime_minister</code>.
      </p>

      <h2>Measuring similarity</h2>
      <p>
        If each word is a point in 300-dimensional space, “similar meaning” becomes “pointing in a similar direction”.
        The usual measure is <strong>cosine similarity</strong>: 1 means the two vectors point the same way, 0 means they are unrelated (at right angles).
      </p>
      <Fig caption="Cosine similarity between word pairs, computed from the site’s GloVe vectors.">
        <table className={s.table}>
          <thead><tr><th>Pair</th><th>Similarity</th></tr></thead>
          <tbody>
            {SIMS.map(([a, b, v]) => <tr key={a + b}><td>{a} · {b}</td><td>{v.toFixed(2)}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        The numbers match intuition: <code>cat</code> is much closer to <code>dog</code> than to <code>car</code>, even though <code>cat</code> and <code>car</code> differ by one letter.
        The embedding knows nothing about spelling; it only knows usage.
      </p>

      <h2>What embeddings get wrong</h2>
      <p>
        Usage is also where the surprises come from. In this GloVe data, the nearest neighbours of <code>apple</code> are <code>microsoft</code>, <code>google</code> and <code>intel</code>.
        The training text talked about the company far more than the fruit.
      </p>
      <p>
        Opposites can be close, too. <code>good</code> and <code>bad</code> have a similarity of about 0.72, because they appear in almost identical sentences: “the food was good”, “the food was bad”.
      </p>
      <p>
        These models are also <strong>static</strong>: each word gets exactly one vector, no matter the sentence. The <code>bank</code> of a river and the <code>bank</code> that holds your money share a single point.
        Modern language models fix this by adjusting each token’s vector based on the words around it, layer by layer
        (<ArticleLink slug="attention-and-transformers">Attention and the transformer</ArticleLink> shows how). But their very first step is the same as here:
        look up a vector for each token ID in a big table.
      </p>

      <h2>Why 300?</h2>
      <p>
        The length of the list is a design choice made before training. More numbers give the model more room to record fine distinctions,
        but they need more training data, more memory and more computation. For classic word embeddings like these, 300 became a common size.
        Across the 10,000 words each model ships with here, that is 3 million numbers per model.
      </p>
      <p>
        Large language models use the same idea at a bigger scale, with token vectors that are often thousands of numbers long.
      </p>

      <h2>Seeing the space</h2>
      <p>
        Nobody can picture 300 dimensions. The Embedding page takes 1,000, 5,000 or 10,000 words from a model and squeezes their vectors down to 3D so you can fly through them.
        How that squeezing works, and what it hides, is covered in <Link href="/learn/pca-vs-umap">PCA vs UMAP</Link>.
      </p>
    </>
  );
}

/* ---------- 4. PCA vs UMAP ---------- */

// Deterministic pseudo-random points so the server render is stable.
function cloud(centers, spread) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  return centers.flatMap(([cx, cy], c) =>
    Array.from({ length: 22 }, () => [cx + rand() * spread * (1 + Math.abs(rand())), cy + rand() * spread, c])
  );
}
const PCA_POINTS = cloud([[92, 96], [120, 84], [110, 118], [140, 104]], 26);
const UMAP_POINTS = cloud([[52, 52], [170, 60], [70, 150], [178, 158]], 13);
const CLOUD_COLORS = [TEAL, YELLOW, PINK, INDIGO];

function Scatter({ points }) {
  return (
    <svg viewBox="0 0 230 210" role="img" aria-label="Scatter plot of four coloured groups">
      <rect x="0.5" y="0.5" width="229" height="209" rx="10" fill="none" stroke="#ffffff14" />
      {points.map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="3.2" fill={CLOUD_COLORS[c]} fillOpacity=".85" />)}
    </svg>
  );
}

function PcaVsUmap() {
  return (
    <>
      <p>
        Each word on the Embedding page is really a list of 300 numbers, a point in 300-dimensional space. Screens have two dimensions and our intuition handles three.
        To draw the words at all, the site has to reduce 300 numbers to 3. This is called <strong>dimensionality reduction</strong>, and the page offers two ways to do it: <strong>PCA</strong> and <strong>UMAP</strong>.
      </p>
      <p>
        Neither is “correct”. Throwing away 297 dimensions always loses something. The two methods simply choose to keep different things.
        This guide covers the two options on the Embedding page; <ArticleLink slug="dimensionality-reduction">Seeing high dimensions</ArticleLink> explains the wider family, including t-SNE, in more depth.
      </p>

      <h2>PCA: find the widest directions</h2>
      <p>
        <strong>Principal Component Analysis</strong> looks for the direction in which the points are most spread out. That becomes the first axis.
        Then it finds the next most spread-out direction at right angles to the first, and so on. To get a 3D view, it keeps the top three directions and drops the rest.
      </p>
      <p>
        Think of photographing a flat object like a book. You get the most information by shooting it face-on, where its shape is widest, not edge-on.
        PCA picks the camera angle that shows the most spread. Mathematically it is just a rotation followed by dropping axes (a <strong>projection</strong>, like a shadow cast onto a wall), so it has useful properties:
      </p>
      <ul>
        <li>It is deterministic: the same data always gives the same picture.</li>
        <li>It is linear, so straight-line relationships in the original space stay straight.</li>
        <li>Large distances are roughly kept: things far apart in the plot really are far apart in the data.</li>
      </ul>
      <p>
        The weakness is how much it has to leave out. Word embeddings spread their information across many directions.
        For the 10,000 GloVe vectors this site ships, the top three directions capture only about 9% of the total spread; it takes around 54 directions to reach half.
        So a PCA view tends to look like one big cloud, with groups overlapping in the middle. Two words can land close together on screen without being similar at all.
      </p>

      <h2>UMAP: keep the neighbours together</h2>
      <p>
        <strong>UMAP</strong> (Uniform Manifold Approximation and Projection, 2018) takes a different approach. Instead of preserving overall spread, it tries to preserve <em>neighbourhoods</em>.
      </p>
      <p>
        First it finds each word’s nearest neighbours in the full 300-dimensional space and builds a graph connecting them.
        Then it places the words in 3D and nudges them around until the 3D neighbours match the original ones as closely as possible: neighbours pull together, non-neighbours push apart.
      </p>
      <Fig caption="An illustration, not real data: the same four groups as PCA and UMAP typically show them. PCA keeps the overall spread, so groups overlap. UMAP keeps neighbours together, so groups separate into islands.">
        <div className={s.pair}>
          <div><h3>PCA</h3><Scatter points={PCA_POINTS} /></div>
          <div><h3>UMAP</h3><Scatter points={UMAP_POINTS} /></div>
        </div>
      </Fig>
      <p>
        The result usually shows clear, tight clusters: numbers in one island, place names in another. That makes UMAP views easier to explore.
        But the clarity comes with rules for reading them:
      </p>
      <ul>
        <li><strong>Distances between clusters mean little.</strong> Two islands far apart are not necessarily less related than two islands side by side.</li>
        <li><strong>Cluster size means little.</strong> UMAP tends to even out density, so a large, loose group and a small, tight one can look alike.</li>
        <li><strong>Runs differ.</strong> UMAP starts from a random layout, so running it again can rotate, flip or rearrange the islands. The views on this site are computed ahead of time, so they stay the same between visits.</li>
      </ul>

      <h2>Side by side</h2>
      <Fig caption="How the two methods compare.">
        <div className={s.scroll}>
          <table className={s.table} style={{ minWidth: 440 }}>
            <thead><tr><th></th><th>PCA</th><th>UMAP</th></tr></thead>
            <tbody>
              <tr><td>Keeps</td><td>overall spread</td><td>local neighbours</td></tr>
              <tr><td>Method</td><td>linear (rotation)</td><td>non-linear (graph)</td></tr>
              <tr><td>Same result each run</td><td>yes</td><td>not guaranteed</td></tr>
              <tr><td>Clusters look</td><td>overlapping</td><td>separated</td></tr>
              <tr><td>Trust distances</td><td>large ones, roughly</td><td>small ones only</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Reading the Embedding page</h2>
      <p>
        On the Embedding page, the <strong>Dimensionality Reduction</strong> switch flips between the two. Try the same model and word count in both and compare.
      </p>
      <ul>
        <li>The colours come from cluster IDs stored with each dataset file. They are computed separately for each view, so a colour in PCA does not mean the same group as that colour in UMAP.</li>
        <li>The page itself warns that distance in the 3D view is not the original similarity score. For true similarity, the full 300 numbers are what count.</li>
        <li>Search for a word and look at its neighbours in both views. Neighbours that appear in both are a good sign the relationship is real, not an artefact of the projection.</li>
      </ul>
      <p>
        A good habit is to use UMAP to find interesting groups, and PCA as a sanity check on the big picture.
      </p>
    </>
  );
}

/* ---------- 5. Analogies ---------- */

const RESULTS = [
  ["GloVe 300D", "queen", "0.73"],
  ["FastText 300D", "queen", "0.77"],
  ["Word2Vec 300D", "royal", "0.51"],
];

function Parallelogram() {
  const arrow = (x1, y1, x2, y2, color, dash) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" strokeDasharray={dash} markerEnd={`url(#tip-${color.slice(1)})`} />
  );
  return (
    <svg viewBox="0 0 420 240" className={s.big} role="img" aria-label="Arrows from man to king and from woman to queen are parallel">
      <defs>
        {[PURPLE, SKY, GREEN].map((c) => (
          <marker key={c} id={`tip-${c.slice(1)}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={c} />
          </marker>
        ))}
      </defs>
      {arrow(70, 190, 140, 60, PURPLE)}
      {arrow(250, 200, 320, 70, PURPLE, "6 5")}
      {arrow(70, 190, 245, 200, SKY)}
      {arrow(140, 60, 315, 70, GREEN, "6 5")}
      {[[70, 190, "man"], [140, 60, "king"], [250, 200, "woman"], [320, 70, "queen"]].map(([x, y, w]) => (
        <g key={w}>
          <circle cx={x} cy={y} r="5" fill="#fff" />
          <text x={x + 10} y={y + (y > 100 ? 20 : -10)}>{w}</text>
        </g>
      ))}
      <text x="18" y="120" style={{ fill: PURPLE }}>royalty</text>
      <text x="140" y="228" style={{ fill: SKY }}>gender</text>
    </svg>
  );
}

function KingManWoman() {
  return (
    <>
      <p>
        One of the most famous results in word embeddings is a piece of arithmetic: take the vector for <code>king</code>, subtract <code>man</code>, add <code>woman</code>, and the closest word to the answer is <code>queen</code>.
        It sounds like a magic trick. It is really a statement about directions in space, and once you see that, you can also see where it works and where it fails.
      </p>

      <h2>Words as arrows</h2>
      <p>
        In an embedding model each word is a list of numbers, here 300 of them, called a <strong>vector</strong>. You can picture that list as an arrow from the origin (the point where every number is zero) to a point.
        Adding and subtracting arrows works one number at a time: to compute <code>king − man</code>, subtract the first number of <code>man</code> from the first number of <code>king</code>, then the second, and so on, all the way to 300.
      </p>
      <p>
        The result of a subtraction is itself an arrow: the direction you would travel to get from <code>man</code> to <code>king</code>.
        If the model has learned a consistent notion of “royalty”, then the trip from <code>woman</code> to <code>queen</code> should point roughly the same way.
      </p>
      <Fig caption="A simplified 2D picture. The analogy works when the man → king arrow and the woman → queen arrow are nearly parallel.">
        <Parallelogram />
      </Fig>
      <p>
        So <code>king − man + woman</code> means: start at <code>king</code>, remove the “man” direction, add the “woman” direction. If the geometry is clean, you land near <code>queen</code>.
        The same idea can be read the other way around, as “what is to woman as king is to man?”
      </p>

      <h2>What the Vector Playground actually does</h2>
      <p>
        The Playground has three boxes, a, b and c, and computes <code>a − b + c</code>. Behind the scenes it:
      </p>
      <ul>
        <li>looks up the full 300-number vector for each of your three words;</li>
        <li>does the arithmetic on all 300 numbers;</li>
        <li>compares the result with every word the model has loaded (10,000 of them) using cosine similarity, which measures how closely two arrows point the same way;</li>
        <li>skips your three input words, and reports the closest remaining words and their similarity.</li>
      </ul>
      <Fig caption="The closest word to king − man + woman in each model, with its cosine similarity.">
        <table className={s.table}>
          <thead><tr><th>Model</th><th>Result</th><th>Similarity</th></tr></thead>
          <tbody>
            {RESULTS.map(([m, w, v]) => <tr key={m}><td>{m}</td><td>{w}</td><td>{v}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        GloVe and FastText both land on <code>queen</code>. Word2Vec does not, and the reason is mundane: its vocabulary is case-sensitive,
        and the 10,000 words loaded here include only a capitalised <code>Queen</code>.
        That vector scores 0.44, below <code>royal</code>.
      </p>

      <h2>The fine print</h2>
      <p>
        That step “skips your three input words” matters more than it looks. In the GloVe data, the vector closest to <code>king − man + woman</code> is actually <code>king</code> itself
        (similarity 0.82), with <code>queen</code> second. Subtracting <code>man</code> and adding <code>woman</code> nudges the arrow only slightly, so it stays nearest to where it started.
        Almost every analogy tool excludes the inputs for this reason. The famous result is real, but it is a little less dramatic than it sounds.
      </p>
      <p>
        The 3D arrows on the canvas are another simplification: they are a flattened view of 300-dimensional vectors, so angles and lengths on screen are only approximate.
        The picture is a hint; the answer comes from the full 300-number calculation.
      </p>

      <h2>More analogies to try</h2>
      <p>These all work with GloVe, the Playground’s default model:</p>
      <ul>
        <li><code>paris − france + italy</code> → <code>rome</code> (capital cities)</li>
        <li><code>france − paris + tokyo</code> → <code>japan</code> (the same relation, reversed)</li>
        <li><code>walking − walk + swim</code> → <code>swimming</code> (verb forms)</li>
        <li><code>bigger − big + small</code> → <code>smaller</code>, with <code>larger</code> a very close second</li>
      </ul>
      <p>
        That last one shows a common failure. <code>smaller</code> and <code>larger</code> appear in nearly identical sentences, so the model keeps them close together.
        Embeddings are good at “same kind of word” and weaker at “opposite of”.
      </p>

      <h2>Reading the result</h2>
      <p>
        The similarity the Playground shows is cosine similarity: 1 would be a perfect match in direction. It is not a probability or a confidence score.
        It only says how closely the result arrow points toward each candidate word. A low number, like Word2Vec’s 0.51, means the calculation landed in a sparse area and even the nearest word is not very near.
      </p>
      <p>
        You can also skip the calculation and just plot words. The words box takes up to 50 words and draws each one as an arrow, which is a quick way to compare a small set like <code>man woman king queen</code>.
      </p>

      <h2>Why it works, and what it reflects</h2>
      <p>
        Nobody programmed a “royalty” or “gender” direction into these models. They emerged because the training text uses <code>king</code> and <code>queen</code> in parallel ways,
        just as it does <code>man</code> and <code>woman</code>. The geometry is a compressed summary of how people write.
        Why directions in an embedding carry meaning at all is explored in <ArticleLink slug="latent-space">Latent space: the hidden meaning in numbers</ArticleLink>.
      </p>
      <p>
        That cuts both ways. Researchers have shown that the same arithmetic surfaces stereotypes from the training text, for example linking certain jobs more strongly with one gender.
        When an analogy gives a surprising answer, it is worth asking what in the source text might have produced it.
      </p>
    </>
  );
}

// Site guides: short tours of what each WordCanvas3D tool shows.
export const GUIDES = [
  {
    slug: "what-is-a-token",
    tag: "Tokens",
    color: YELLOW,
    title: "What is a token, and why isn’t it a word?",
    summary: "How tokenizers cut text into reusable pieces, and why those pieces rarely line up with words.",
    minutes: 4,
    cta: { href: "/tokenizer", label: "Open the Tokenizer", text: "Paste any sentence and see exactly how GPT and LLaMA tokenizers split it, with every token’s ID." },
    Body: WhatIsAToken,
  },
  {
    slug: "why-emoji-cost-more-tokens",
    tag: "Tokens",
    color: PINK,
    title: "Why emoji and other languages cost more tokens",
    summary: "UTF-8 bytes, byte-level BPE, and why the same greeting can take 4 tokens or 25.",
    minutes: 4,
    cta: { href: "/tokenizer", label: "Try the presets", text: "Load the World scripts or Emoji preset and switch tokenizers to watch the count change." },
    Body: EmojiAndLanguages,
  },
  {
    slug: "how-a-word-becomes-300-numbers",
    tag: "Embeddings",
    color: TEAL,
    title: "How a word becomes 300 numbers",
    summary: "What word embeddings are, how GloVe, Word2Vec and FastText learn them, and how to measure similarity.",
    minutes: 4,
    cta: { href: "/embedding", label: "Explore embeddings", text: "Fly through thousands of words from GloVe, Word2Vec or FastText and see which ones end up close together." },
    Body: WordToNumbers,
  },
  {
    slug: "pca-vs-umap",
    tag: "Embeddings",
    color: SKY,
    title: "PCA vs UMAP: two ways to flatten meaning",
    summary: "Two ways to squeeze 300 dimensions into 3, what each one keeps, and how to read the result.",
    minutes: 4,
    cta: { href: "/embedding", label: "Compare PCA and UMAP", text: "Switch between the two projections on the same words and see what each one reveals." },
    Body: PcaVsUmap,
  },
  {
    slug: "king-man-woman",
    tag: "Vectors",
    color: PURPLE,
    title: "King − man + woman, explained",
    summary: "Word analogies as arrow arithmetic: what the Playground computes, why it works, and where it breaks.",
    minutes: 4,
    cta: { href: "/vector-playground", label: "Open the Playground", text: "Type king, man and woman into the a − b + c boxes, then try your own analogies." },
    Body: KingManWoman,
  },
];
