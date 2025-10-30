import { init, Tiktoken } from '@dqbd/tiktoken/lite/init'
import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json'
import p50k_base from '@dqbd/tiktoken/encoders/p50k_base.json'
import p50k_edit from '@dqbd/tiktoken/encoders/p50k_edit.json'
import r50k_base from '@dqbd/tiktoken/encoders/r50k_base.json'
import gpt2 from '@dqbd/tiktoken/encoders/gpt2.json'
import o200k_base from '@dqbd/tiktoken/encoders/o200k_base.json'
import llamaTokenizer from 'llama-tokenizer-js'

const ENCODING_META = {
  o200k_base,
  cl100k_base,
  p50k_base,
  p50k_edit,
  r50k_base,
  gpt2,
}

const td = new TextDecoder()

// Robust WASM bootstrap (streaming + fallback)
async function initWasm() {
  const wasmUrl = new URL('@dqbd/tiktoken/lite/tiktoken_bg.wasm', import.meta.url)
  try {
    await init((imports) => WebAssembly.instantiateStreaming(fetch(wasmUrl), imports))
  } catch {
    const res = await fetch(wasmUrl)
    const buf = await res.arrayBuffer()
    await init((imports) => WebAssembly.instantiate(buf, imports))
  }
}

let wasmReadyPromise = null
const encoderCache = new Map()

async function getEncoder(encodingName) {
  const meta = ENCODING_META[encodingName] ?? ENCODING_META.cl100k_base
  if (!wasmReadyPromise) wasmReadyPromise = initWasm()
  await wasmReadyPromise
  if (!encoderCache.has(meta)) {
    const enc = new Tiktoken(meta.bpe_ranks, meta.special_tokens, meta.pat_str)
    encoderCache.set(meta, enc)
  }
  return encoderCache.get(meta)
}

export async function tokenizeText(text, encodingName = 'cl100k_base', opts = {}) {
  if (typeof text !== 'string') return []
  try {
    const enc = await getEncoder(encodingName)
    if (encodingName === 'llama' || encodingName === 'llama2') {
      const ids = llamaTokenizer.encode(text) || []
      return ids.map((id) => ({
        id,
        token: llamaTokenizer.decode([id]) || '',
      }))
    }
    // encode(text, allowed_special = 'none', disallowed_special = 'all')
    let allowed_special = 'none'
    if (opts.allowedSpecial instanceof Set && opts.allowedSpecial.size > 0) {
      allowed_special = Array.from(opts.allowedSpecial)
    } else if (opts.allowedSpecial === 'all') {
      allowed_special = 'all'
    }

    const ids = enc.encode(text, allowed_special)
    return Array.from(ids, (id) => ({
      id,
      token: td.decode(enc.decode(new Uint32Array([id]))),
    }))
  } catch (e) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[tiktoken] tokenize error', e)
    }
    return []
  }
}