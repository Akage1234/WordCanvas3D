// Packs the Vector Playground's full embedding files into a compact binary format.
//   node scripts/pack-embeddings.mjs public/glove_300d/glove_300D_full.json.gz public/glove_300d/glove_300D_vectors.bin.gz
// Input: gzipped JSON { word: number[dims] }. Output: gzip of encodeVectors(), see vectorMath.mjs.
// 8-bit values with one scale per dimension: ~2.6 MB instead of ~7 MB, and nearest-word rankings unchanged.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { encodeVectors } from "../components/vectorPlayground/vectorMath.mjs";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/pack-embeddings.mjs <in.json.gz> <out.bin.gz>");
  process.exit(1);
}
const embeddings = JSON.parse(gunzipSync(readFileSync(input)).toString("utf8"));
const packed = gzipSync(encodeVectors(embeddings), { level: 9 });
writeFileSync(output, packed);
console.log(`${output}: ${Object.keys(embeddings).length} words, ${(packed.length / 1e6).toFixed(2)} MB`);
