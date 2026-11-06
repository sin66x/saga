/**
 * Word resolution: turns a word long-pressed in the reader into a dictionary result.
 *
 * Provider chain (first answer wins):
 *   1. story glossary   – the story's own vocabulary.json (contextual meanings)
 *   2. base dictionary  – every inflected form of every bundled entry
 *   3. morphology rules – genitive -s, "1600-talet", Roman numerals, suffix stripping
 *   4. compounds        – vinter|kläder, blåbär|s|riset …
 *   5. not found        – never invents a translation
 */
import type { DictionaryEntry } from '@/content/types';
import { normalizeWord } from '@/lib/tokenizer';
import { getBaseDictionary } from './dictionary';
import { englishForForm, isSForm } from './english';
import { buildIndex, FORM_LABELS } from './forms';
import type {
  CompoundPart,
  FormHit,
  FormIndex,
  LookupContext,
  TranslationProvider,
  WordLookup,
} from './types';

/* ------------------------------------------------------------------ */
/* Ranking of homographs (man, får, var, vår, låg …)                   */
/* ------------------------------------------------------------------ */

const DETERMINERS = new Set([
  'en', 'ett', 'den', 'det', 'de', 'min', 'mitt', 'mina', 'din', 'ditt', 'dina', 'sin', 'sitt', 'sina',
  'hans', 'hennes', 'vår', 'vårt', 'våra', 'deras', 'varje', 'denna', 'detta', 'dessa', 'någon', 'något', 'några',
]);
const SUBJECTS = new Set(['jag', 'du', 'han', 'hon', 'vi', 'ni', 'de', 'man', 'det', 'den', 'som']);
const PREPOSITIONS = new Set(['i', 'på', 'till', 'från', 'med', 'för', 'av', 'hos', 'under', 'över', 'om', 'vid', 'mot', 'genom', 'efter']);

function rankHits(hits: FormHit[], index: FormIndex, ctx: LookupContext): FormHit[] {
  if (hits.length < 2) return hits;
  const prev = ctx.previousWord ? normalizeWord(ctx.previousWord) : undefined;
  const next = ctx.nextWord ? normalizeWord(ctx.nextWord) : undefined;
  const nextIsVerb = next ? (index.get(next) ?? []).some((h) => h.entry.pos === 'verb' && h.form !== 'lemma' && h.form !== 'infinitive') : false;

  const score = (h: FormHit): number => {
    let s = 0;
    if (h.source === 'story') s += 5;
    const pos = h.entry.pos;
    if (prev && (DETERMINERS.has(prev) || PREPOSITIONS.has(prev))) {
      if (pos === 'noun' || pos === 'adjective') s += 4;
    }
    if (prev && SUBJECTS.has(prev) && pos === 'verb') s += 4;
    if (nextIsVerb && (pos === 'pronoun' || pos === 'adverb')) s += 3;
    if (!prev && pos === 'verb') s += 1;
    // Generic preference: function words and verbs are the most frequent readings.
    s += { verb: 0.6, pronoun: 0.5, adverb: 0.4, preposition: 0.4, conjunction: 0.4 }[pos as string] ?? 0;
    return s;
  };
  return [...hits].sort((a, b) => score(b) - score(a));
}

function lookupFromHits(surface: string, hits: FormHit[], index: FormIndex, ctx: LookupContext): WordLookup {
  // Collapse several forms of the same entry into one (e.g. "kom": past + imperative).
  const unique: FormHit[] = [];
  for (const h of hits) if (!unique.some((u) => u.entry === h.entry)) unique.push(h);
  const [best, ...alternatives] = rankHits(unique, index, ctx);
  return {
    surface,
    status: 'found',
    hit: best,
    translation: englishForForm(best.entry, best.form, surface),
    formLabel: labelFor(best, surface),
    alternatives,
  };
}

export function labelFor(hit: FormHit, surface = ''): string | undefined {
  if (hit.form === 'lemma') return undefined;
  if (hit.form === 'other') {
    const w = surface.toLowerCase();
    if (hit.entry.pos === 'verb') return isSForm(w, hit.entry) ? 's-form (passive)' : 'participle';
    if (hit.entry.pos === 'adjective') return /(sta|aste)$/.test(w) ? 'superlative, definite form' : 'definite form';
    return undefined;
  }
  return FORM_LABELS[hit.form].en;
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

function indexProvider(id: string, index: FormIndex, fallbackIndex: FormIndex): TranslationProvider {
  return {
    id,
    lookup(surface, ctx) {
      const hits = index.get(normalizeWord(surface));
      if (!hits?.length) return null;
      // Merge with base-dictionary readings so alternatives are complete.
      const extra = id === 'story' ? (fallbackIndex.get(normalizeWord(surface)) ?? []) : [];
      const merged = [...hits, ...extra.filter((e) => !hits.some((h) => h.entry.lemma === e.entry.lemma && h.entry.pos === e.entry.pos))];
      return lookupFromHits(surface, merged, fallbackIndex, ctx);
    },
  };
}

const ROMAN: Record<string, [number, string]> = {
  i: [1, 'the First'], ii: [2, 'the Second'], iii: [3, 'the Third'], iv: [4, 'the Fourth'], v: [5, 'the Fifth'],
  vi: [6, 'the Sixth'], vii: [7, 'the Seventh'], viii: [8, 'the Eighth'], ix: [9, 'the Ninth'], x: [10, 'the Tenth'],
  xi: [11, 'the Eleventh'], xii: [12, 'the Twelfth'], xiii: [13, 'the Thirteenth'], xiv: [14, 'the Fourteenth'],
  xv: [15, 'the Fifteenth'], xvi: [16, 'the Sixteenth'],
};

function morphologyProvider(primary: FormIndex[]): TranslationProvider {
  const find = (w: string): FormHit[] => primary.flatMap((ix) => ix.get(w) ?? []);
  return {
    id: 'morphology',
    lookup(surface, ctx) {
      const w = normalizeWord(surface);

      // "1600-talet", "1990-talet"
      const century = /^(\d{2,4})-tal(et|s)?$/.exec(w);
      if (century) {
        const n = century[1];
        return {
          surface,
          status: 'found',
          translation: `the ${n}s`,
          explanation:
            n.endsWith('00') && n.length === 4
              ? `“${n}-talet” means the ${n}s, i.e. the ${ordinal(Number(n.slice(0, 2)) + 1)} century.`
              : `“-talet” after a year means the decade or century: the ${n}s.`,
          alternatives: [],
        };
      }

      // Roman numerals after a name: Gustav II Adolf, Karl XII
      if (ROMAN[w] && surface === surface.toUpperCase()) {
        const [num, en] = ROMAN[w];
        return {
          surface,
          status: 'found',
          translation: en,
          explanation: `Roman numeral ${num}. In Swedish it is read as an ordinal: ${surface} = “den ${swedishOrdinal(num)}”.`,
          alternatives: [],
        };
      }

      // Genitive -s: Sveriges, Elins, kanelbullens, morfars
      if (w.length > 2 && w.endsWith('s')) {
        const hits = find(w.slice(0, -1));
        if (hits.length) {
          const base = lookupFromHits(surface, hits, primary[0], ctx);
          const isName = base.hit?.entry.pos === 'proper-noun';
          const owner = base.translation ?? base.hit?.entry.en ?? '';
          return {
            ...base,
            translation: isName ? `${owner.replace(/\s*\(.*\)$/, '')}'s` : `${owner}'s / of ${owner}`,
            formLabel: 'genitive (possessive -s)',
            explanation: `Swedish adds -s to show possession: ${surface.slice(0, -1)} → ${surface}.`,
          };
        }
      }

      // Hyphenated words: look up the last part (d-vitamin, mor- och farföräldrar)
      if (w.includes('-')) {
        const last = w.split('-').pop() ?? '';
        const hits = find(last);
        if (hits.length) {
          return { ...lookupFromHits(surface, hits, primary[0], ctx), status: 'probable', explanation: `Looked up the last part: “${last}”.` };
        }
      }

      // Suffix stripping: probable lemma when the exact form is missing.
      for (const [suffix, replacement, pos] of SUFFIX_RULES) {
        if (!w.endsWith(suffix) || w.length - suffix.length < 2) continue;
        const candidate = w.slice(0, w.length - suffix.length) + replacement;
        const hits = find(candidate).filter((h) => pos.includes(h.entry.pos));
        if (hits.length) {
          const base = lookupFromHits(surface, hits, primary[0], ctx);
          return {
            ...base,
            status: 'probable',
            translation: base.hit?.entry.en,
            formLabel: undefined,
            explanation: `Probably a form of “${base.hit?.entry.lemma}”. This form is not in the dictionary yet.`,
          };
        }
      }
      return null;
    },
  };
}

const SUFFIX_RULES: [string, string, DictionaryEntry['pos'][]][] = [
  ['arna', '', ['noun']], ['orna', 'a', ['noun']], ['erna', '', ['noun']], ['arna', 'e', ['noun']],
  ['orna', '', ['noun']], ['na', '', ['noun']], ['en', '', ['noun']], ['et', '', ['noun']],
  ['ar', '', ['noun', 'verb']], ['or', 'a', ['noun']], ['er', '', ['noun', 'verb']], ['n', '', ['noun']],
  ['t', '', ['noun', 'adjective']], ['ade', 'a', ['verb']], ['at', 'a', ['verb']], ['de', 'a', ['verb']],
  ['te', 'a', ['verb']], ['r', '', ['verb']], ['a', '', ['adjective']], ['are', '', ['adjective']],
  ['aste', '', ['adjective']], ['ast', '', ['adjective']], ['e', '', ['adjective']],
];

function compoundProvider(primary: FormIndex[]): TranslationProvider {
  const find = (w: string): FormHit[] => primary.flatMap((ix) => ix.get(w) ?? []);
  const isHead = (w: string) =>
    find(w).find((h) => h.entry.pos === 'noun' || h.entry.pos === 'adjective' || h.entry.pos === 'verb' || h.entry.pos === 'proper-noun');

  return {
    id: 'compound',
    lookup(surface) {
      const w = normalizeWord(surface);
      if (w.length < 7) return null;
      // Scan for the longest known last part (the head determines the meaning).
      for (let i = 3; i <= w.length - 3; i++) {
        const tail = w.slice(i);
        const tailHits = find(tail).filter((h) => ['noun', 'adjective', 'verb'].includes(h.entry.pos));
        if (!tailHits.length) continue;
        const left = w.slice(0, i);
        const candidates: [string, string][] = [[left, '']];
        if (left.endsWith('s')) candidates.push([left.slice(0, -1), 's']);
        if (/[aeo]$/.test(left)) candidates.push([left.slice(0, -1), left.slice(-1)]);
        candidates.push([`${left}a`, ''], [`${left}e`, '']);
        for (const [stem, link] of candidates) {
          const head = isHead(stem);
          if (!head) continue;
          const tailHit = tailHits[0];
          const parts: CompoundPart[] = [{ text: left.slice(0, left.length - link.length), hit: head }];
          if (link) parts.push({ text: link });
          parts.push({ text: tail, hit: tailHit });
          const tailEn = englishForForm(tailHit.entry, tailHit.form, tail);
          return {
            surface,
            status: 'compound',
            hit: tailHit,
            translation: `${head.entry.en.split(',')[0]} + ${tailEn}`,
            explanation:
              'Compound word (automatic analysis). In Swedish compounds, the last part carries the main meaning' +
              (link ? `; “-${link}-” is a linking letter.` : '.'),
            compound: parts,
            alternatives: [],
          };
        }
      }
      return null;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface Resolver {
  resolve(surface: string, context?: LookupContext): WordLookup;
}

/** Creates a resolver for one story (its glossary takes priority over the base dictionary). */
export function createResolver(storyVocabulary: DictionaryEntry[] = []): Resolver {
  const base = getBaseDictionary();
  const storyIndex = buildIndex(storyVocabulary, 'story');
  const providers: TranslationProvider[] = [
    indexProvider('story', storyIndex, base.index),
    indexProvider('dictionary', base.index, base.index),
    morphologyProvider([storyIndex, base.index]),
    compoundProvider([storyIndex, base.index]),
  ];
  return {
    resolve(surface, context = {}) {
      for (const p of providers) {
        const result = p.lookup(surface, context);
        if (result) return result;
      }
      return { surface, status: 'not-found', alternatives: [] };
    },
  };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function swedishOrdinal(n: number): string {
  return (
    ['', 'förste', 'andre', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde', 'elfte', 'tolfte', 'trettonde', 'fjortonde', 'femtonde', 'sextonde'][n] ??
    String(n)
  );
}
