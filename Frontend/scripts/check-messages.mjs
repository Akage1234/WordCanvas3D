// Checks messages/<locale>.json against en.json: same key paths, same array lengths,
// same ICU placeholders and rich-text tags. Usage: node scripts/check-messages.mjs zh ja es
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));
const flat = (o, p = "", out = {}) => {
  if (typeof o === "string") out[p] = o;
  else if (Array.isArray(o)) { out[p + "#len"] = String(o.length); o.forEach((v, i) => flat(v, `${p}[${i}]`, out)); }
  else for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
  return out;
};
// top-level {name} / {name, type...} and <tag> / </tag>; plural bodies contain nested text, so take names only
const marks = (s) => [...(s.match(/\{\s*\w+(?=[\s,}])/g) ?? []).map((m) => m.replace(/\s/g, "")), ...(s.match(/<\/?\w+>/g) ?? [])].sort().join(" ");

const en = flat(load("en"));
let bad = 0;
for (const l of process.argv.slice(2)) {
  const tr = flat(load(l));
  for (const k of Object.keys(en)) if (!(k in tr)) { bad++; console.log(`${l} missing ${k}`); }
  for (const k of Object.keys(tr)) if (!(k in en)) { bad++; console.log(`${l} extra ${k}`); }
  for (const k of Object.keys(en)) {
    if (!(k in tr)) continue;
    if (k.endsWith("#len") ? en[k] !== tr[k] : marks(en[k]) !== marks(tr[k])) { bad++; console.log(`${l} ${k}: "${en[k]}" vs "${tr[k]}"`); }
    else if (!k.endsWith("#len") && !tr[k].trim() && en[k].trim()) { bad++; console.log(`${l} empty ${k}`); }
  }
  console.log(`${l}: ${Object.keys(tr).length} entries checked`);
}
process.exit(bad ? 1 : 0);
