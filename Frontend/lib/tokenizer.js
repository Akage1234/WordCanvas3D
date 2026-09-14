import { init, Tiktoken } from '@dqbd/tiktoken/lite/init'
import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json'
import p50k_base from '@dqbd/tiktoken/encoders/p50k_base.json'
import p50k_edit from '@dqbd/tiktoken/encoders/p50k_edit.json'
import r50k_base from '@dqbd/tiktoken/encoders/r50k_base.json'
import gpt2 from '@dqbd/tiktoken/encoders/gpt2.json'
import o200k_base from '@dqbd/tiktoken/encoders/o200k_base.json'
import llamaTokenizer from 'llama-tokenizer-js'
import { describeBytes } from './tokenDisplay'

const ENCODING_META = {
  o200k_base,
  cl100k_base,
  p50k_base,
  p50k_edit,
  r50k_base,
  gpt2,
}

// Robust WASM bootstrap (streaming + fallback)
async function initWasm() {
  const wasmUrl = new URL('@dqbd/tiktoken/lite/tiktoken_bg.wasm', import.meta.url)
  try {
    await init((imports) => WebAssembly.instantiateStreaming(fetch(wasmUrl), imports))
  } catch {
    const res = await fetch(wasmUrl)
    if (!res.ok) throw new Error(`Tokenizer engine download failed (HTTP ${res.status})`)
    const buf = await res.arrayBuffer()
    await init((imports) => WebAssembly.instantiate(buf, imports))
  }
}

let wasmReadyPromise = null
const encoderCache = new Map()

async function getEncoder(meta) {
  if (!wasmReadyPromise) {
    // Forget a failed init so the next call (edit or Retry) tries again.
    wasmReadyPromise = initWasm().catch((e) => {
      wasmReadyPromise = null
      throw e
    })
  }
  await wasmReadyPromise
  if (!encoderCache.has(meta)) {
    const enc = new Tiktoken(meta.bpe_ranks, meta.special_tokens, meta.pat_str)
    const specials = new Map(Object.entries(meta.special_tokens).map(([name, id]) => [id, name]))
    encoderCache.set(meta, { enc, specials })
  }
  return encoderCache.get(meta)
}

// llama-tokenizer-js 1.2.2: vocabById[id] is the SentencePiece piece. Byte-fallback
// pieces are literally "<0xNN>", ids 0-2 are <unk>/<s>/</s>, and "▁" stands for a space
// (the library's own decode() maps it back the same way).
const LLAMA_SPECIAL = new Set([0, 1, 2])
const utf8 = new TextEncoder()
function llamaToken(id) {
  const piece = llamaTokenizer.vocabById[id]
  if (LLAMA_SPECIAL.has(id)) return { id, kind: 'special', name: piece, piece }
  const byte = /^<0x([0-9A-F]{2})>$/.exec(piece)
  const bytes = byte ? new Uint8Array([parseInt(byte[1], 16)]) : utf8.encode(piece.replaceAll('▁', ' '))
  return { id, piece, ...describeBytes(bytes) }
}

// Returns [{ id, kind, bytes, parts, name?, piece? }]. Throws on failure; callers show the error.
export async function tokenizeText(text, encodingName = 'cl100k_base', opts = {}) {
  if (typeof text !== 'string') return []
  // LLaMA never needs the tiktoken WASM engine.
  if (encodingName === 'llama' || encodingName === 'llama2') {
    return (llamaTokenizer.encode(text) || []).map(llamaToken)
  }
  const { enc, specials } = await getEncoder(ENCODING_META[encodingName] ?? ENCODING_META.cl100k_base)
  // encode(text, allowed_special = 'none', disallowed_special = 'all')
  let allowed_special = 'none'
  if (opts.allowedSpecial instanceof Set && opts.allowedSpecial.size > 0) {
    allowed_special = Array.from(opts.allowedSpecial)
  } else if (opts.allowedSpecial === 'all') {
    allowed_special = 'all'
  }

  let ids
  try {
    ids = enc.encode(text, allowed_special)
  } catch (e) {
    // tiktoken rejects text containing a special token that is not allowed.
    throw Object.assign(new Error(String(e?.message ?? e)), { input: true })
  }
  return Array.from(ids, (id) =>
    specials.has(id)
      ? { id, kind: 'special', name: specials.get(id), bytes: enc.decode_single_token_bytes(id) }
      : { id, ...describeBytes(enc.decode_single_token_bytes(id)) }
  )
}
