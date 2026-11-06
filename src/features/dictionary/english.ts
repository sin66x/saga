/**
 * Small English morphology helpers used to show a contextual translation for an
 * inflected Swedish form ("skogen" → "the forest", "gick" → "went").
 * Irregular English forms are supplied by the dictionary entry (enPlural/enPast).
 */
import type { DictionaryEntry } from '@/content/types';
import type { FormKey } from './types';

const splitSenses = (en: string) => en.split(/,\s*/).filter(Boolean);

/** Splits "day (24 hours)" into ["day", " (24 hours)"]. */
function splitParen(s: string): [string, string] {
  const i = s.indexOf(' (');
  return i > 0 ? [s.slice(0, i), s.slice(i)] : [s, ''];
}

export function pluralizeEnglish(noun: string): string {
  const [core, tail] = splitParen(noun);
  if (/\(.*\)$/.test(core)) return noun; // "(ice) skate" handled below
  const words = core.split(' ');
  const last = words.pop() ?? '';
  let plural: string;
  if (/(s|x|z|ch|sh)$/.test(last)) plural = `${last}es`;
  else if (/[^aeiou]y$/.test(last)) plural = `${last.slice(0, -1)}ies`;
  else plural = `${last}s`;
  return [...words, plural].join(' ') + tail;
}

export function regularPast(verb: string): string {
  if (verb.endsWith('e')) return `${verb}d`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ied`;
  return `${verb}ed`;
}

/** "to look up" → "looked up" (only the first word is inflected). */
function pastOfSense(sense: string): string {
  const s = sense.replace(/^to /, '');
  const [first, ...rest] = s.split(' ');
  return [regularPast(first), ...rest].join(' ');
}

const stripTo = (sense: string) => sense.replace(/^to /, '');

export function englishForForm(entry: DictionaryEntry, form: FormKey, surface?: string): string {
  const senses = splitSenses(entry.en);
  switch (form) {
    case 'comparative':
      return senses.map((x) => compare(x, 'er')).join(', ');
    case 'superlative':
      return senses.map((x) => compare(x, 'est')).join(', ');
    case 'other': {
      if (entry.pos === 'adjective' && surface && /(sta|aste)$/i.test(surface)) return senses.map((x) => `the ${compare(x, 'est')}`).join(', ');
      if (entry.pos !== 'verb' || !surface) return entry.en;
      const participle = entry.enParticiple ?? senses.map(pastOfSense).join(', ');
      return isSForm(surface, entry) ? `be ${participle.split(', ')[0]}` : participle;
    }
    case 'defSg':
      return senses.map((s) => `the ${s}`).join(', ');
    case 'indefPl':
      return entry.enPlural ?? senses.map(pluralizeEnglish).join(', ');
    case 'defPl':
      return entry.enPlural
        ? entry.enPlural
            .split(/,\s*/)
            .map((s) => `the ${s}`)
            .join(', ')
        : senses.map((s) => `the ${pluralizeEnglish(s)}`).join(', ');
    case 'past':
      return entry.enPast ?? senses.map(pastOfSense).join(', ');
    case 'supine':
      return entry.enParticiple ?? entry.enPast ?? senses.map(pastOfSense).join(', ');
    case 'present':
    case 'imperative':
      return entry.pos === 'verb' ? senses.map(stripTo).join(', ') : entry.en;
    default:
      return entry.en;
  }
}

/** True for s-passive forms like "kallas", "nämns", "släpptes" (not deponents like "finns"). */
export function isSForm(surface: string, entry: DictionaryEntry): boolean {
  return entry.pos === 'verb' && !entry.lemma.endsWith('s') && surface.toLowerCase().endsWith('s');
}

const IRREGULAR_COMPARISON: Record<string, [string, string]> = {
  good: ['better', 'best'],
  bad: ['worse', 'worst'],
  little: ['less', 'least'],
  far: ['further', 'furthest'],
  many: ['more', 'most'],
  much: ['more', 'most'],
};

/** English comparative/superlative: big → bigger/biggest, beautiful → more/most beautiful. */
export function compare(adj: string, kind: 'er' | 'est'): string {
  const [core, tail] = splitParen(adj);
  const irregular = IRREGULAR_COMPARISON[core];
  if (irregular) return (kind === 'er' ? irregular[0] : irregular[1]) + tail;
  const syllables = (core.replace(/e$/, '').match(/[aeiouy]+/g) ?? []).length;
  const short = !core.includes(' ') && !core.includes('-') && (syllables <= 1 || (syllables === 2 && /y$/.test(core)));
  if (!short) return `${kind === 'er' ? 'more' : 'most'} ${core}${tail}`;
  let stem = core;
  if (/[^aeiou]y$/.test(stem)) stem = `${stem.slice(0, -1)}i`;
  else if (/e$/.test(stem)) stem = stem.slice(0, -1);
  else if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(stem)) stem += stem.slice(-1); // big → bigg-er
  return `${stem}${kind}${tail}`;
}
