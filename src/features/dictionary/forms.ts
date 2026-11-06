import type { DictionaryEntry } from '@/content/types';
import type { FormHit, FormIndex, FormKey } from './types';

const FORM_KEYS: Exclude<FormKey, 'lemma' | 'other'>[] = [
  'indefSg',
  'defSg',
  'indefPl',
  'defPl',
  'infinitive',
  'present',
  'past',
  'supine',
  'imperative',
  'common',
  'neuter',
  'plural',
  'comparative',
  'superlative',
];

/** Labels: Swedish grammar term (as taught at SFI) + English. */
export const FORM_LABELS: Record<FormKey, { sv: string; en: string }> = {
  lemma: { sv: 'grundform', en: 'base form' },
  indefSg: { sv: 'obestämd form singular', en: 'indefinite singular' },
  defSg: { sv: 'bestämd form singular', en: 'definite singular' },
  indefPl: { sv: 'obestämd form plural', en: 'indefinite plural' },
  defPl: { sv: 'bestämd form plural', en: 'definite plural' },
  infinitive: { sv: 'infinitiv', en: 'infinitive' },
  present: { sv: 'presens', en: 'present tense' },
  past: { sv: 'preteritum', en: 'past tense' },
  supine: { sv: 'supinum', en: 'supine (used with har/hade)' },
  imperative: { sv: 'imperativ', en: 'imperative' },
  common: { sv: 'en-form', en: 'with en-words' },
  neuter: { sv: 'ett-form', en: 'with ett-words / adverb' },
  plural: { sv: 'plural / bestämd form', en: 'plural or definite' },
  comparative: { sv: 'komparativ', en: 'comparative' },
  superlative: { sv: 'superlativ', en: 'superlative' },
  other: { sv: 'annan form', en: 'other form' },
};

export const POS_LABELS: Record<string, { sv: string; en: string }> = {
  noun: { sv: 'substantiv', en: 'Noun' },
  verb: { sv: 'verb', en: 'Verb' },
  adjective: { sv: 'adjektiv', en: 'Adjective' },
  adverb: { sv: 'adverb', en: 'Adverb' },
  pronoun: { sv: 'pronomen', en: 'Pronoun' },
  preposition: { sv: 'preposition', en: 'Preposition' },
  conjunction: { sv: 'konjunktion', en: 'Conjunction' },
  numeral: { sv: 'räkneord', en: 'Number' },
  interjection: { sv: 'interjektion', en: 'Interjection' },
  determiner: { sv: 'artikel', en: 'Article' },
  'proper-noun': { sv: 'namn', en: 'Name' },
  particle: { sv: 'partikel', en: 'Particle' },
  phrase: { sv: 'uttryck', en: 'Expression' },
};

/** Lists every surface form of an entry together with its form key. */
export function formsOf(entry: DictionaryEntry): [string, FormKey][] {
  const out: [string, FormKey][] = [[entry.lemma, 'lemma']];
  const forms = entry.forms ?? {};
  for (const key of FORM_KEYS) {
    const value = forms[key];
    if (value) out.push([value, key]);
  }
  for (const other of forms.other ?? []) out.push([other, 'other']);
  return out;
}

const keyOf = (s: string) => s.toLowerCase();

export function addToIndex(index: FormIndex, entry: DictionaryEntry, source: FormHit['source']): void {
  const seen = new Set<string>();
  for (const [form, formKey] of formsOf(entry)) {
    const k = keyOf(form);
    // The lemma usually coincides with a specific form; keep the more specific one.
    const dedupe = `${k}|${formKey === 'lemma' ? 'L' : formKey}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const list = index.get(k) ?? [];
    // Avoid duplicate (entry, form) pairs, and prefer a specific form over "lemma".
    const existing = list.find((h) => h.entry === entry);
    if (existing) {
      if (existing.form === 'lemma' && formKey !== 'lemma') existing.form = formKey;
      continue;
    }
    list.push({ entry, form: formKey, source });
    index.set(k, list);
  }
}

export function buildIndex(entries: DictionaryEntry[], source: FormHit['source']): FormIndex {
  const index: FormIndex = new Map();
  for (const e of entries) addToIndex(index, e, source);
  return index;
}

/** Stable identity for an entry: lemma + part of speech. */
export const entryKey = (e: Pick<DictionaryEntry, 'lemma' | 'pos'>) => `${e.lemma.toLowerCase()}|${e.pos}`;

export function dedupeEntries(entries: DictionaryEntry[]): DictionaryEntry[] {
  const seen = new Map<string, DictionaryEntry>();
  for (const e of entries) if (!seen.has(entryKey(e))) seen.set(entryKey(e), e);
  return [...seen.values()];
}
