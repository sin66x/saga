/** Minimal base64 codec (independent of atob/btoa support in the JS engine). */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const INVALID = 255;
const LOOKUP = new Uint8Array(256).fill(INVALID);
for (let i = 0; i < ALPHABET.length; i++) LOOKUP[ALPHABET.charCodeAt(i)] = i;

/** Decodes base64 text. Characters outside the alphabet (line breaks…) are skipped; "=" ends the data. */
export function base64ToBytes(input: string): Uint8Array {
  const out = new Uint8Array(Math.floor((input.length * 3) / 4));
  let o = 0;
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c === 61) break; // "="
    const v = c < 256 ? LOOKUP[c] : INVALID;
    if (v === INVALID) continue;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 255;
      acc &= (1 << bits) - 1;
    }
  }
  return o === out.length ? out : out.subarray(0, o);
}

const CHUNK_BYTES = 3 * 4096;

/** Encodes bytes as base64 text. Built in chunks so that large files don't create millions of tiny string pieces. */
export function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let start = 0; start < bytes.length; start += CHUNK_BYTES) {
    const end = Math.min(start + CHUNK_BYTES, bytes.length);
    let chunk = '';
    for (let i = start; i < end; i += 3) {
      const a = bytes[i];
      const b = bytes[i + 1];
      const c = bytes[i + 2];
      const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
      chunk += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63] + (b === undefined || i + 1 >= end ? '=' : ALPHABET[(n >> 6) & 63]) + (c === undefined || i + 2 >= end ? '=' : ALPHABET[n & 63]);
    }
    parts.push(chunk);
  }
  return parts.join('');
}

/** Parses "data:image/png;base64,AAAA" into its MIME type and bytes. */
export function parseDataUri(uri: string): { mime: string; bytes: Uint8Array } | null {
  if (!uri.startsWith('data:')) return null;
  const comma = uri.indexOf(',');
  const m = comma < 0 ? null : /^([\w/+.-]+);base64$/.exec(uri.slice(5, comma));
  return m ? { mime: m[1], bytes: base64ToBytes(uri.slice(comma + 1)) } : null;
}
