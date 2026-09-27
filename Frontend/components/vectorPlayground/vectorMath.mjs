// Models store some words capitalised ("Paris"), others lowercase; accept either spelling.
export function lookup(embeddings, word) {
  if (!embeddings || !word) return null;
  const w = word.trim();
  const lower = w.toLowerCase();
  const capital = lower.charAt(0).toUpperCase() + lower.slice(1);
  for (const key of [w, lower, capital]) if (embeddings[key]) return key;
  return null;
}

export function analogy(a, b, c) {
  return a.map((v, i) => v - b[i] + c[i]);
}

function norm(v) {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

// Cosine similarity against the whole vocabulary; case variants of excluded words are skipped too.
export function nearest(vector, embeddings, exclude = [], k = 5) {
  const skip = new Set(exclude.map((w) => w.toLowerCase()));
  const vn = norm(vector);
  const best = [];
  for (const [word, e] of Object.entries(embeddings)) {
    if (skip.has(word.toLowerCase())) continue;
    let dot = 0;
    for (let i = 0; i < vector.length; i++) dot += vector[i] * e[i];
    const sim = dot / (vn * norm(e) || 1);
    if (best.length < k || sim > best[best.length - 1].similarity) {
      best.push({ word, similarity: sim });
      best.sort((x, y) => y.similarity - x.similarity);
      if (best.length > k) best.pop();
    }
  }
  return best;
}

// Eigen-decomposition of a small symmetric matrix (cyclic Jacobi rotations).
function eigenSymmetric(A) {
  const n = A.length;
  const a = A.map((row) => row.slice());
  const V = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < 1e-18) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  return a.map((_, i) => ({ value: a[i][i], vector: V.map((row) => row[i]) })).sort((x, y) => y.value - x.value);
}

// PCA to 3D fitted on just the plotted vectors, via the small n×n Gram matrix.
// center=false keeps the model's real zero at the origin (projection onto the top 3 directions without subtracting the mean).
export function pca3(vectors, center = true) {
  const n = vectors.length;
  if (n === 0) return [];
  const d = vectors[0].length;
  const mean = new Array(d).fill(0);
  if (center) for (const v of vectors) for (let i = 0; i < d; i++) mean[i] += v[i] / n;
  const X = vectors.map((v) => v.map((x, i) => x - mean[i]));
  const G = X.map((a) => X.map((b) => a.reduce((s, x, i) => s + x * b[i], 0)));
  const coords = X.map(() => [0, 0, 0]);
  eigenSymmetric(G).slice(0, 3).forEach(({ value, vector }, comp) => {
    if (value < 1e-9) return;
    const sign = vector.find((x) => Math.abs(x) > 1e-6) < 0 ? -1 : 1;
    vector.forEach((x, i) => { coords[i][comp] = x * Math.sqrt(value) * sign; });
  });
  return coords;
}

// Compact binary embeddings (made by scripts/pack-embeddings.mjs), little-endian:
//   uint32 words, uint32 dims, uint32 byte length of a JSON array of the words, that JSON (padded to 4 bytes),
//   float32[dims] one scale per dimension, int8[words × dims] values; value = int8 × scale of its dimension.
// Per-dimension 8-bit keeps nearest-word rankings identical to the float data at about a third of the size.
export function encodeVectors(embeddings) {
  const words = Object.keys(embeddings);
  const dims = embeddings[words[0]].length;
  const scale = new Float32Array(dims);
  for (const w of words) embeddings[w].forEach((x, i) => { scale[i] = Math.max(scale[i], Math.abs(x) / 127); });
  const json = new TextEncoder().encode(JSON.stringify(words));
  const jsonPadded = Math.ceil(json.length / 4) * 4;
  const out = new Uint8Array(12 + jsonPadded + dims * 4 + words.length * dims);
  const view = new DataView(out.buffer);
  view.setUint32(0, words.length, true);
  view.setUint32(4, dims, true);
  view.setUint32(8, json.length, true);
  out.set(json, 12);
  let o = 12 + jsonPadded;
  for (let i = 0; i < dims; i++, o += 4) view.setFloat32(o, scale[i], true);
  const values = new Int8Array(out.buffer, o);
  words.forEach((w, r) => embeddings[w].forEach((x, i) => { values[r * dims + i] = scale[i] ? Math.round(x / scale[i]) : 0; }));
  return out;
}

export function decodeVectors(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = view.getUint32(0, true), dims = view.getUint32(4, true), jsonLength = view.getUint32(8, true);
  const words = JSON.parse(new TextDecoder().decode(bytes.subarray(12, 12 + jsonLength)));
  let o = 12 + Math.ceil(jsonLength / 4) * 4;
  const scale = new Float32Array(dims);
  for (let i = 0; i < dims; i++, o += 4) scale[i] = view.getFloat32(o, true);
  const values = new Int8Array(bytes.buffer, bytes.byteOffset + o, n * dims);
  const embeddings = {};
  for (let r = 0; r < n; r++) {
    const v = new Float32Array(dims);
    for (let i = 0; i < dims; i++) v[i] = values[r * dims + i] * scale[i];
    embeddings[words[r]] = v;
  }
  return embeddings;
}

const cache = new Map();

export function loadModel(url, onProgress) {
  if (!cache.has(url)) {
    const promise = (async () => {
      const { ungzip } = await import("pako");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Could not load ${url}`);
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) onProgress?.(received / total);
      }
      const bytes = new Uint8Array(received);
      let offset = 0;
      for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
      return decodeVectors(ungzip(bytes));
    })();
    promise.catch(() => cache.delete(url));
    cache.set(url, promise);
  }
  return cache.get(url);
}
