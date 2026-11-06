/**
 * Answer checking for typed and ordered answers. Pure functions (unit tested).
 *
 * Grammar is about endings, so a typed answer is correct only when it matches an
 * accepted answer exactly (ignoring case, extra spaces and final punctuation).
 * "Near misses" are detected only to give better feedback.
 */
import type { OrderExercise } from '@/content/types';

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”"«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?,;:]+$/g, '')
    .trim();
}

const stripDiacritics = (s: string) => s.replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');

export type NearMiss = 'diacritics' | 'one-letter' | 'case' | null;

export interface TypedResult {
  correct: boolean;
  nearMiss: NearMiss;
  expected: string;
}

export function checkTyped(input: string, accepted: string[]): TypedResult {
  const given = normalizeAnswer(input);
  const expected = accepted[0] ?? '';
  for (const a of accepted) if (normalizeAnswer(a) === given) return { correct: true, nearMiss: null, expected: a };
  for (const a of accepted) {
    if (stripDiacritics(normalizeAnswer(a)) === stripDiacritics(given)) return { correct: false, nearMiss: 'diacritics', expected: a };
  }
  for (const a of accepted) {
    if (levenshtein(normalizeAnswer(a), given) === 1) return { correct: false, nearMiss: 'one-letter', expected: a };
  }
  return { correct: false, nearMiss: null, expected };
}

export function nearMissMessage(m: NearMiss): string | null {
  if (m === 'diacritics') return 'So close! Check the letters å, ä and ö – they are different letters in Swedish.';
  if (m === 'one-letter') return 'Almost – just one letter is different. In Swedish, small endings carry grammar.';
  return null;
}

/** Joins tiles into a sentence for display. */
export function joinWords(words: string[], end?: string): string {
  const text = words.join(' ');
  const capitalised = text.charAt(0).toUpperCase() + text.slice(1);
  return end ? `${capitalised}${end}` : text;
}

export function checkOrder(given: string[], ex: Pick<OrderExercise, 'words' | 'alternatives'>): boolean {
  const norm = (ws: string[]) => ws.map((w) => w.toLowerCase()).join(' ');
  const g = norm(given);
  return [ex.words, ...(ex.alternatives ?? [])].some((ws) => norm(ws) === g);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Stable, seeded shuffle so that tile order does not change on re-render. */
export function seededShuffle<T>(items: T[], seedText: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Never present the tiles already in the correct order.
  if (a.length > 1 && a.every((x, i) => x === items[i])) [a[0], a[1]] = [a[1], a[0]];
  return a;
}
