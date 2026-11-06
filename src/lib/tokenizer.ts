/**
 * Swedish-aware tokenizer for the reader.
 *
 * Splits a paragraph into word / number / space / punctuation tokens while keeping
 * character offsets and sentence boundaries, so that a long-pressed word can be
 * resolved together with the sentence it appears in.
 *
 * We intentionally use an explicit letter class instead of `\p{L}` so the behaviour
 * does not depend on the JS engine's Unicode property support (Hermes / JSC / Node).
 * The class covers Latin-1 letters, which includes å ä ö é ü.
 */

export type TokenKind = 'word' | 'number' | 'space' | 'punct';

export interface Token {
  kind: TokenKind;
  text: string;
  /** Start offset in the paragraph. */
  start: number;
  /** Index of the sentence (0-based) the token belongs to. */
  sentence: number;
}

const LETTER = 'A-Za-zÀ-ÖØ-öø-ÿ';
// A word is letters, optionally joined by inner hyphens/apostrophes; a number may carry a
// hyphenated Swedish suffix ("1500-talet") or a decimal comma ("1,3").
const TOKEN_RE = new RegExp(
  `(\\d+(?:[ ,.]\\d{3})*(?:,\\d+)?(?:-[${LETTER}]+)?)` + // 1 number
    `|([${LETTER}]+(?:[-'’][${LETTER}]+)*)` + // 2 word
    `|(\\s+)` + // 3 space
    `|([^\\s${LETTER}\\d]+|.)`, // 4 punctuation (anything else)
  'g',
);

const SENTENCE_END = /[.!?…]/;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let sentence = 0;
  let pendingBreak = false;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const [whole, num, word, space] = m;
    let kind: TokenKind;
    if (num !== undefined) kind = 'number';
    else if (word !== undefined) kind = 'word';
    else if (space !== undefined) kind = 'space';
    else kind = 'punct';

    if (pendingBreak && (kind === 'word' || kind === 'number')) {
      sentence += 1;
      pendingBreak = false;
    }
    tokens.push({ kind, text: whole, start: m.index, sentence });
    if (kind === 'punct' && SENTENCE_END.test(whole)) pendingBreak = true;
  }
  return tokens;
}

/** Returns the sentence text (trimmed) that contains the token at `tokenIndex`. */
export function sentenceAt(tokens: Token[], tokenIndex: number): string {
  const target = tokens[tokenIndex]?.sentence;
  if (target === undefined) return '';
  return tokens
    .filter((t) => t.sentence === target)
    .map((t) => t.text)
    .join('')
    .replace(/^[\s–—-]+/, '')
    .trim();
}

/** All distinct lower-cased words in a text, used by content checks and "words on this page". */
export function uniqueWords(text: string): string[] {
  const seen = new Set<string>();
  for (const t of tokenize(text)) {
    if (t.kind === 'word') seen.add(t.text.toLowerCase());
  }
  return [...seen];
}

/** Normalises a word for dictionary lookup: lower-case, curly apostrophes → straight. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/’/g, "'").trim();
}
