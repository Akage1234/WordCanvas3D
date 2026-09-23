// Run: node --test components/embedding/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { parseDataset, datasetUrl, DatasetError } from "./embeddingData.mjs";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "../../public");
const MODELS = { glove_300D: "glove_300d", fasttext_300D: "FastText_300D", word2vec_300D: "Word2Vec_300D" };

test("all 18 shipped projection assets resolve and pass", () => {
  let checked = 0;
  for (const model of Object.keys(MODELS)) for (const count of ["1000", "5000", "10000"]) for (const method of ["pca", "umap"]) {
    const url = datasetUrl(model, count, method);
    const rows = JSON.parse(gunzipSync(readFileSync(join(PUBLIC, url))));
    const d = parseDataset(rows, Number(count));
    assert.equal(d.words.length, Number(count), url);
    assert.equal(d.positions.length, Number(count) * 3);
    assert.ok(d.positions.every(Number.isFinite), url);
    checked++;
  }
  assert.equal(checked, 18);
  // the file set on disk is exactly what the URLs cover
  const onDisk = Object.values(MODELS).flatMap((f) => readdirSync(join(PUBLIC, f)).filter((n) => /_(pca|umap)_3d\.json\.gz$/.test(n)));
  assert.equal(onDisk.length, 18);
});

const row = (i, extra = {}) => ({ word: `w${i}`, x: i, y: -i, z: 0.5, cluster: 0, edges: [], ...extra });
const rows = (n, patch = () => {}) => { const r = [...Array(n)].map((_, i) => row(i)); patch(r); return r; };
const rejects = (data, count, re) => assert.throws(() => parseDataset(data, count), (e) => e instanceof DatasetError && e.kind === "invalid" && re.test(e.message));

test("accepts the supported contract, including incidental variations", () => {
  const d = parseDataset(rows(4, (r) => {
    r[0].edges = [1];            // degree 1 (as in Word2Vec 10k PCA)
    r[1].edges = [1, 2, 3];      // self-link is harmless
    r[2].cluster = -1;           // noise cluster
    delete r[3].cluster; delete r[3].edges; // optional fields
    r[3].extra = "ignored";      // extra keys
    r[2].word = " The";          // no trimming / case rules
  }), 4);
  assert.deepEqual(d.clusters, [0, 0, -1, 0]);
  assert.deepEqual(d.edges[3], []);
  assert.equal(d.words[2], " The");
  // centred
  const mean = (k) => [0, 1, 2, 3].reduce((s, i) => s + d.positions[i * 3 + k], 0) / 4;
  assert.ok(Math.abs(mean(0)) < 1e-6 && Math.abs(mean(1)) < 1e-6);
});

test("accepts token/label fallbacks the renderer already supported", () => {
  const d = parseDataset([{ token: "a", x: 0, y: 0, z: 0 }, { label: "b", x: 1, y: 1, z: 1 }], 2);
  assert.deepEqual(d.words, ["a", "b"]);
});

test("rejects bad roots and counts", () => {
  rejects({}, 1, /not a list/);
  rejects([], 0, /no words/);
  rejects(rows(3), 4, /expected 4 words but the file has 3/);
  rejects(rows(5), 4, /expected 4/);
  rejects([null], 1, /row 0 is not an object/);
  rejects([[1, 2]], 1, /row 0 is not an object/);
});

test("rejects missing, empty or duplicate words", () => {
  rejects(rows(2, (r) => { delete r[1].word; }), 2, /row 1 has no word/);
  rejects(rows(2, (r) => { r[1].word = ""; }), 2, /row 1 has no word/);
  rejects(rows(2, (r) => { r[1].word = 7; }), 2, /row 1 has no word/);
  rejects(rows(2, (r) => { r[1].word = "w0"; }), 2, /appears more than once/);
});

test("rejects non-finite or non-Float32-safe coordinates", () => {
  for (const v of [null, undefined, "1", NaN, Infinity, -Infinity, 1e39]) {
    rejects(rows(2, (r) => { r[1].y = v; }), 2, /coordinate/);
  }
});

test("rejects coordinates whose centred Float32 value overflows", () => {
  // each value is Float32-safe, but subtracting the centroid is not
  // centroid = -1.13e38, so the first point's centred x (4.5e38) exceeds Float32 max
  rejects(rows(3, (r) => { r[0].x = 3.4e38; r[1].x = -3.4e38; r[2].x = -3.4e38; }), 3, /too far from the centre/);
});

test("rejects clusters that cannot index the palette", () => {
  for (const v of [1.5, "2", null, NaN]) rejects(rows(2, (r) => { r[0].cluster = v; }), 2, /cluster/);
});

test("rejects links to rows that do not exist", () => {
  rejects(rows(3, (r) => { r[0].edges = "1,2"; }), 3, /malformed links/);
  for (const t of [3, -1, 1.5, "1", null]) rejects(rows(3, (r) => { r[0].edges = [1, t]; }), 3, /does not exist/);
});

test("expectedCount is optional", () => {
  assert.equal(parseDataset(rows(3)).words.length, 3);
});
