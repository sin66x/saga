import type { DictionaryEntry } from '@/content/types';

export type FormKey =
  | 'lemma'
  | 'indefSg'
  | 'defSg'
  | 'indefPl'
  | 'defPl'
  | 'infinitive'
  | 'present'
  | 'past'
  | 'supine'
  | 'imperative'
  | 'common'
  | 'neuter'
  | 'plural'
  | 'comparative'
  | 'superlative'
  | 'other';

export interface FormHit {
  entry: DictionaryEntry;
  form: FormKey;
  /** Where the entry came from. */
  source: 'story' | 'dictionary';
}

export type FormIndex = Map<string, FormHit[]>;

export type LookupStatus = 'found' | 'probable' | 'compound' | 'not-found';

export interface CompoundPart {
  text: string;
  hit?: FormHit;
}

export interface WordLookup {
  /** The word exactly as it appears in the text. */
  surface: string;
  status: LookupStatus;
  /** Best match (absent when not found). */
  hit?: FormHit;
  /** English for this specific form, e.g. "the forest" for "skogen". */
  translation?: string;
  /** Human-readable grammatical label for the form, e.g. "definite singular". */
  formLabel?: string;
  /** Extra information (genitive, roman numeral, compound analysis, …). */
  explanation?: string;
  /** Other possible readings of the same word (homographs). */
  alternatives: FormHit[];
  compound?: CompoundPart[];
}

export interface LookupContext {
  previousWord?: string;
  nextWord?: string;
}

/**
 * A translation provider can answer a lookup or pass (return null). Providers are
 * chained; the first one that answers wins. A future AI provider would implement
 * this interface (with an async variant) without touching the UI.
 */
export interface TranslationProvider {
  id: string;
  lookup(surface: string, context: LookupContext): WordLookup | null;
}
