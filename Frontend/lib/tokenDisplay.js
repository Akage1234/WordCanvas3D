// Pure helpers for showing a token's raw bytes honestly.
// A BPE token can hold only part of a UTF-8 character; those bytes are shown
// as hex instead of being decoded to U+FFFD.

// ignoreBOM: a token that is U+FEFF must stay U+FEFF, not be stripped as a byte-order mark.
const strict = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })

export const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')

// Byte length of the UTF-8 sequence a lead byte starts, or 0 if it cannot start one.
const seqLen = (b) => (b < 0x80 ? 1 : b >= 0xc2 && b <= 0xdf ? 2 : b >= 0xe0 && b <= 0xef ? 3 : b >= 0xf0 && b <= 0xf4 ? 4 : 0)

// Split bytes into complete UTF-8 characters ({ text }) and stray bytes ({ bytes }).
export function splitBytes(bytes) {
  const parts = []
  const push = (key, value) => {
    const last = parts[parts.length - 1]
    if (last && key in last) last[key] = key === 'text' ? last.text + value : [...last.bytes, ...value]
    else parts.push({ [key]: value })
  }
  for (let i = 0; i < bytes.length; ) {
    const n = seqLen(bytes[i])
    let text = null
    if (n && i + n <= bytes.length) {
      try { text = strict.decode(bytes.subarray(i, i + n)) } catch { /* invalid sequence */ }
    }
    if (text !== null) { push('text', text); i += n }
    else { push('bytes', [bytes[i]]); i += 1 }
  }
  return parts
}

// { bytes, parts, kind } where kind is 'text' | 'fragment' (bytes only) | 'mixed'.
export function describeBytes(bytes) {
  // Common case: the whole token is valid UTF-8.
  try {
    return { bytes, parts: [{ text: strict.decode(bytes) }], kind: 'text' }
  } catch { /* contains stray bytes */ }
  const parts = splitBytes(bytes)
  const hasText = parts.some((p) => 'text' in p)
  const hasBytes = parts.some((p) => 'bytes' in p)
  return { bytes, parts, kind: hasBytes ? (hasText ? 'mixed' : 'fragment') : 'text' }
}

// Display-only whitespace markers (the underlying token text is unchanged).
export const markWhitespace = (s) =>
  s.replace(/ /g, '·').replace(/\t/g, '→').replace(/\r/g, '␍').replace(/\n/g, '↵\n')

// One-line form for the inspector: whitespace marked in text parts, stray bytes as <E2 80>.
export const tokenLabel = (t) =>
  t.kind === 'special'
    ? t.name
    : t.parts.map((p) => ('text' in p ? markWhitespace(p.text).replace(/\n/g, '') : `<${toHex(p.bytes)}>`)).join('')

// Token chip colour: same hue mapping as before (id % 360), darker so light text stays readable.
export const TOKEN_TEXT = '#f5f5f5'
export const tokenColor = (id) => `hsl(${id % 360} 55% 27%)`
