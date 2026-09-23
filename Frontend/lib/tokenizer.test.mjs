// Run from Frontend/: node --test lib/tokenizer.test.mjs   (Node >= 22.15, no extra deps)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks, createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

// Load lib/*.js the way the bundler does: extensionless relative imports, JSON imports
// without attributes, and lib files as ES modules.
registerHooks({
  resolve(spec, ctx, next) {
    try { return next(spec, ctx) } catch (e) {
      if (spec.startsWith('.')) return next(spec + '.js', ctx)
      throw e
    }
  },
  load(url, ctx, next) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }
    const r = next(url, ctx)
    return url.includes('/lib/') && url.endsWith('.js') ? { ...r, format: 'module' } : r
  },
})

// The browser build fetches the WASM asset; in Node serve it from disk, with a switch to fail.
const require = createRequire(import.meta.url)
const wasmPath = require.resolve('@dqbd/tiktoken/lite/tiktoken_bg.wasm')
let fetchCalls = 0
let failFetch = false
globalThis.fetch = async () => {
  fetchCalls++
  if (failFetch) throw new TypeError('Failed to fetch')
  return new Response(readFileSync(wasmPath), { headers: { 'content-type': 'application/wasm' } })
}

const { tokenizeText } = await import('./tokenizer.js')
const { describeBytes, tokenLabel, tokenColor, TOKEN_TEXT, markWhitespace } = await import('./tokenDisplay.js')
const { Tiktoken } = require('@dqbd/tiktoken/lite')
const llama = (await import('llama-tokenizer-js')).default

const OPTS = { allowedSpecial: new Set(['<|endoftext|>']) }
const TIKTOKEN = ['o200k_base', 'cl100k_base', 'p50k_base', 'p50k_edit', 'r50k_base', 'gpt2']
const FIXTURES = {
  default: 'The quick brown fox jumps over the lazy dog.',
  spaces: '  leading, trailing   and  multiple   spaces  ',
  newlines: 'a\tb\nc\r\nd\n\n',
  e_precomposed: 'caf\u00e9',
  e_combining: 'cafe\u0301',
  emoji: '\u{1F642}',
  emoji_tone: '\u{1F44B}\u{1F3FD} Friends',
  zwj: '\u{1F468}\u200d\u{1F469}\u200d\u{1F467}',
  cjk: '\u3053\u3093\u306b\u3061\u306f \u4e2d\u6587',
  rtl: '\u0645\u0631\u062d\u0628\u0627',
  devanagari: '\u0928\u092e\u0938\u094d\u0924\u0947',
  code: 'for (let i = 0; i < n; i++) { sum += a[i]; }',
  endoftext: 'hello <|endoftext|> world',
  literal_fffd: 'bad \ufffd byte',
  literal_llama_space: 'a\u2581b',
  lone_surrogate: 'x\uD800y',
  whitespace: '   ',
  bom: '\uFEFFx \uFEFF',
}
const utf8 = (s) => new TextEncoder().encode(s)
const concat = (tokens) => Uint8Array.from(tokens.flatMap((t) => [...t.bytes]))
// Re-encode what the UI shows (text parts + raw byte parts). Equal to the token's bytes
// means nothing was lossily decoded to U+FFFD.
const shownBytes = (t) => Uint8Array.from(t.parts.flatMap((p) => ('text' in p ? [...utf8(p.text)] : p.bytes)))

// Must run first: module-level init state is per process.
test('failed WASM init is reported, then retried successfully', async () => {
  const llamaTokens = await tokenizeText('hi', 'llama2', OPTS)
  assert.equal(fetchCalls, 0, 'LLaMA must not start the tiktoken WASM download')
  assert.deepEqual(llamaTokens.map((t) => t.id), [1, 7251])
  failFetch = true
  await assert.rejects(tokenizeText('hi', 'o200k_base', OPTS), /Failed to fetch/)
  failFetch = false
  const tokens = await tokenizeText('hi', 'o200k_base', OPTS)
  assert.equal(tokens.length, 1)
})

test('default IDs are unchanged', async () => {
  const ids = async (enc) => (await tokenizeText(FIXTURES.default, enc, OPTS)).map((t) => t.id)
  assert.deepEqual(await ids('o200k_base'), [976, 4853, 19705, 68347, 65613, 1072, 290, 29082, 6446, 13])
  const llamaIds = [1, 450, 4996, 17354, 1701, 29916, 432, 17204, 975, 278, 17366, 11203, 29889]
  assert.deepEqual(await ids('llama'), llamaIds)
  assert.deepEqual(await ids('llama2'), llamaIds)
  assert.deepEqual(await tokenizeText('', 'o200k_base', OPTS), [])
  assert.deepEqual(await tokenizeText('', 'llama', OPTS), [])
})

for (const name of TIKTOKEN) {
  test(`${name}: IDs, per-token bytes and reconstruction`, async () => {
    const meta = JSON.parse(readFileSync(require.resolve(`@dqbd/tiktoken/encoders/${name}.json`), 'utf8'))
    const ref = new Tiktoken(meta.bpe_ranks, meta.special_tokens, meta.pat_str)
    for (const [fx, text] of Object.entries(FIXTURES)) {
      const tokens = await tokenizeText(text, name, OPTS)
      const ids = tokens.map((t) => t.id)
      assert.deepEqual(ids, Array.from(ref.encode(text, ['<|endoftext|>'])), `${fx}: IDs`)
      tokens.forEach((t, i) => {
        assert.deepEqual(t.bytes, ref.decode_single_token_bytes(t.id), `${fx}#${i}: bytes`)
        if (t.kind !== 'special') assert.deepEqual(shownBytes(t), t.bytes, `${fx}#${i}: lossless display`)
      })
      // Special-token bytes are their literal text, so the whole input reconstructs,
      // with lone surrogates replaced as the encoder itself does.
      assert.deepEqual(concat(tokens), utf8(text.toWellFormed()), `${fx}: reconstruction`)
    }
    ref.free()
  })
}

test('special tokens are identified, not shown as text', async () => {
  const expected = { o200k_base: 199999, cl100k_base: 100257, gpt2: 50256 }
  for (const [name, id] of Object.entries(expected)) {
    const specials = (await tokenizeText(FIXTURES.endoftext, name, OPTS)).filter((t) => t.kind === 'special')
    assert.deepEqual(specials.map((t) => [t.id, t.name]), [[id, '<|endoftext|>']], name)
  }
  // Other special tokens are rejected by the encoder, as before, but now as an input error.
  await assert.rejects(tokenizeText('x <|endofprompt|> y', 'o200k_base', OPTS), (e) => e.input === true)
})

test('LLaMA: same IDs for both options, pieces, byte fallback and normalization', async () => {
  for (const [fx, text] of Object.entries(FIXTURES)) {
    const a = await tokenizeText(text, 'llama', OPTS)
    const b = await tokenizeText(text, 'llama2', OPTS)
    assert.deepEqual(a.map((t) => t.id), llama.encode(text), `${fx}: IDs`)
    assert.deepEqual(b.map((t) => t.id), a.map((t) => t.id), `${fx}: llama vs llama2`)
    assert.deepEqual([a[0].id, a[0].kind, a[0].name], [1, 'special', '<s>'], `${fx}: BOS`)
    for (const t of a.slice(1)) {
      assert.equal(t.piece, llama.vocabById[t.id])
      assert.deepEqual(shownBytes(t), t.bytes, `${fx}: lossless display`)
    }
    // Library contract (llama-tokenizer-js 1.2.2 encode/decode): a space is prepended and
    // every space, and any literal U+2581, is the piece U+2581, which decodes to a space.
    const expected = ' ' + text.toWellFormed().replaceAll('\u2581', ' ')
    assert.deepEqual(concat(a.slice(1)), utf8(expected), `${fx}: reconstruction`)
  }
  const emoji = await tokenizeText('\u{1F642}', 'llama')
  assert.deepEqual(emoji.slice(2).map((t) => t.piece), ['<0xF0>', '<0x9F>', '<0x99>', '<0x82>'])
  assert.ok(emoji.slice(2).every((t) => t.kind === 'fragment'))
})

test('describeBytes splits complete characters from stray bytes', () => {
  assert.deepEqual(describeBytes(utf8(' fox')).parts, [{ text: ' fox' }])
  assert.equal(describeBytes(utf8('\u{1F642}')).kind, 'text')
  const frag = describeBytes(new Uint8Array([0xf0, 0x9f]))
  assert.equal(frag.kind, 'fragment')
  assert.equal(tokenLabel(frag), '<F0 9F>')
  const mixed = describeBytes(new Uint8Array([0x20, 0xe4, 0xb8]))
  assert.deepEqual(mixed.parts, [{ text: ' ' }, { bytes: [0xe4, 0xb8] }])
  assert.equal(describeBytes(new Uint8Array([0xc0, 0x80])).kind, 'fragment', 'overlong form is not text')
  assert.deepEqual(describeBytes(utf8('\uFFFD')).parts, [{ text: '\uFFFD' }], 'a real U+FFFD in the input stays text')
  assert.deepEqual(describeBytes(new Uint8Array([0xef, 0xbb, 0xbf])).parts, [{ text: '\uFEFF' }], 'U+FEFF is not stripped as a BOM')
  assert.deepEqual(describeBytes(new Uint8Array([0x20, 0xef, 0xbb, 0xbf, 0xe4])).parts, [{ text: ' \uFEFF' }, { bytes: [0xe4] }])
  assert.equal(markWhitespace(' a\tb\n'), '\u00b7a\u2192b\u21b5\n')
})

// WCAG relative-luminance contrast for every hue the chips can take.
const lum = ([r, g, b]) => [r, g, b].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0)
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const hsl = (css) => {
  const [h, s, l] = css.match(/[\d.]+/g).map(Number)
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n) => { const k = (n + h / 30) % 12; return 255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) }
  return [f(0), f(8), f(4)]
}
test('chip text contrast >= 4.5:1 for all 360 hues; focus ring >= 3:1', () => {
  let worst = Infinity
  for (let id = 0; id < 360; id++) worst = Math.min(worst, ratio(hex(TOKEN_TEXT), hsl(tokenColor(id))))
  assert.ok(worst >= 4.5, `worst chip contrast ${worst.toFixed(2)}`)
  // Unselected chips during a selection are transparent: light text on the panel background.
  const PANEL = hex('#141414')
  assert.ok(ratio(hex(TOKEN_TEXT), PANEL) >= 4.5)
  // The active chip's ring (sky-400) is offset so it sits on the panel background.
  assert.ok(ratio(hex('#38bdf8'), PANEL) >= 3)
  console.log(`worst chip text contrast across 360 hues: ${worst.toFixed(2)}:1`)
})
