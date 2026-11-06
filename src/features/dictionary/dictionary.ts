/**
 * The bundled Swedish–English dictionary. Parsed lazily on first use (≈1 000 entries,
 * a few milliseconds) and cached for the lifetime of the app.
 */
import type { DictionaryEntry } from '@/content/types';
import { parseCompactDictionary } from './compact';
import adjectives from './data/adjectives';
import functionWords from './data/function-words';
import names from './data/names';
import nouns from './data/nouns';
import verbs from './data/verbs';
import { buildIndex, dedupeEntries } from './forms';
import type { FormIndex } from './types';

export interface Dictionary {
  entries: DictionaryEntry[];
  index: FormIndex;
}

let cached: Dictionary | null = null;

export function getBaseDictionary(): Dictionary {
  if (cached) return cached;
  const entries = dedupeEntries(
    [nouns, verbs, adjectives, functionWords, names].flatMap((src) => parseCompactDictionary(src)),
  );
  cached = { entries, index: buildIndex(entries, 'dictionary') };
  return cached;
}
