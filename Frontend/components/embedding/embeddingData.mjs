// Dataset URL + validation for the Embedding page. Pure (no DOM, no three.js) so it can be tested with `node --test`.

export class DatasetError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // "network" | "http" | "decode" | "invalid"
  }
}

export function datasetUrl(embeddingModel, wordCount, reductionMethod) {
  let modelFolder;
  let fileName;
  if (embeddingModel.startsWith("glove_")) {
    // GloVe: glove_300D -> glove_300d folder, files keep uppercase D
    modelFolder = embeddingModel.toLowerCase();
    fileName = `glove_${embeddingModel.replace("glove_", "")}_${wordCount}_${reductionMethod}_3d.json.gz`;
  } else if (embeddingModel.startsWith("fasttext_")) {
    modelFolder = "FastText_300D";
    fileName = `FastText_300D_${wordCount}_${reductionMethod}_3d.json.gz`;
  } else if (embeddingModel.startsWith("word2vec_")) {
    modelFolder = "Word2Vec_300D";
    fileName = `Word2Vec_300D_${wordCount}_${reductionMethod}_3d.json.gz`;
  } else {
    modelFolder = embeddingModel.toLowerCase();
    fileName = `${embeddingModel}_${wordCount}_${reductionMethod}_3d.json.gz`;
  }
  return `/${modelFolder}/${fileName}`;
}

const isCoord = (v) => typeof v === "number" && Number.isFinite(v) && Number.isFinite(Math.fround(v));

// Validates the contract the renderer relies on and returns render-ready arrays.
// Throws DatasetError("invalid") on the first violation; nothing is partially returned.
// Deliberately NOT checked (incidental to the shipped files): exact key set, cluster maximum,
// edge degree, self-links, token trimming/case.
export function parseDataset(rows, expectedCount) {
  const bad = (msg) => { throw new DatasetError("invalid", msg); };
  if (!Array.isArray(rows)) bad("the file is not a list of words");
  const n = rows.length;
  if (n === 0) bad("the file has no words");
  if (expectedCount != null && n !== expectedCount) bad(`expected ${expectedCount} words but the file has ${n}`);

  const words = new Array(n);
  const clusters = new Array(n);
  const edges = new Array(n);
  const raw = new Float64Array(n * 3);
  const seen = new Set();
  let sx = 0, sy = 0, sz = 0;

  for (let i = 0; i < n; i++) {
    const row = rows[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) bad(`row ${i} is not an object`);
    // same label fields the renderer has always accepted
    const word = row.word ?? row.token ?? row.label;
    if (typeof word !== "string" || word.length === 0) bad(`row ${i} has no word`);
    // exact-token selection and list keys need unique labels
    if (seen.has(word)) bad(`word "${word}" appears more than once`);
    seen.add(word);
    words[i] = word;

    if (!isCoord(row.x) || !isCoord(row.y) || !isCoord(row.z)) bad(`"${word}" has a missing or non-finite coordinate`);
    raw[i * 3] = row.x; raw[i * 3 + 1] = row.y; raw[i * 3 + 2] = row.z;
    sx += row.x; sy += row.y; sz += row.z;

    // cluster is optional (defaults to 0, negative = noise) but must index the palette
    if (row.cluster !== undefined && !Number.isInteger(row.cluster)) bad(`"${word}" has a non-integer cluster`);
    clusters[i] = row.cluster ?? 0;

    // edges are optional; when present every entry must be a real row index
    if (row.edges !== undefined && !Array.isArray(row.edges)) bad(`"${word}" has malformed links`);
    const e = row.edges ?? [];
    for (const t of e) if (!Number.isInteger(t) || t < 0 || t >= n) bad(`"${word}" links to a row that does not exist`);
    edges[i] = e;
  }

  // centre at the origin, as the renderer always has; the result must stay finite in Float32
  const cx = sx / n, cy = sy / n, cz = sz / n;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i += 3) {
    positions[i] = raw[i] - cx;
    positions[i + 1] = raw[i + 1] - cy;
    positions[i + 2] = raw[i + 2] - cz;
    if (!Number.isFinite(positions[i]) || !Number.isFinite(positions[i + 1]) || !Number.isFinite(positions[i + 2])) {
      bad(`"${words[i / 3]}" is too far from the centre to draw`);
    }
  }
  return { words, clusters, edges, positions };
}
