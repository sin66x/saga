/**
 * Parser for the compact dictionary source format used by the bundled
 * Swedish–English dictionary (src/features/dictionary/data/*.ts).
 *
 *   n  <en|ett|->  <indefSg> <defSg> <indefPl> <defPl>  = english [; english plural]   [| note]
 *   v  <inf> <present> <past> <supine> [+extra…]        = english [; past [; participle]] [| note]
 *   a  <common> <neuter> <plural> [<comparative> <superlative>] [+extra…] = english [| note]
 *   x  <pos> <lemma> [forms…]                            = english [| note]
 *   pn <Name>                                            = english [| note]
 *
 * "-" marks a missing form, "_" inside a word stands for a space (multi-word lemmas).
 * Lines starting with "#" are comments.
 */
import type { DictionaryEntry, PartOfSpeech, WordForms } from '@/content/types';

const POS_CODES: Record<string, PartOfSpeech> = {
  adv: 'adverb',
  prep: 'preposition',
  conj: 'conjunction',
  pron: 'pronoun',
  num: 'numeral',
  interj: 'interjection',
  det: 'determiner',
  part: 'particle',
  phrase: 'phrase',
  noun: 'noun',
  adj: 'adjective',
  verb: 'verb',
};

const clean = (s: string | undefined): string | undefined =>
  s === undefined || s === '-' ? undefined : s.replace(/_/g, ' ');

export function parseCompactLine(line: string): DictionaryEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const [head, ...rest] = trimmed.split('=');
  if (rest.length === 0) throw new Error(`Dictionary line without "=": ${line}`);
  const [englishPart, note] = rest.join('=').split('|').map((s) => s.trim());
  const english = englishPart.split(';').map((s) => s.trim());
  const fields = head.trim().split(/\s+/);
  const code = fields[0];

  const extras = fields.filter((f) => f.startsWith('+')).map((f) => f.slice(1).replace(/_/g, ' '));
  const plain = fields.slice(1).filter((f) => !f.startsWith('+'));

  const base = { en: english[0], ...(note ? { note } : {}) };

  switch (code) {
    case 'n': {
      const [gender, indefSg, defSg, indefPl, defPl] = plain;
      const forms: WordForms = {
        indefSg: clean(indefSg),
        defSg: clean(defSg),
        indefPl: clean(indefPl),
        defPl: clean(defPl),
      };
      if (extras.length) forms.other = extras;
      const lemma = forms.indefSg ?? forms.indefPl ?? forms.defSg ?? '';
      return {
        lemma,
        pos: 'noun',
        ...base,
        ...(english[1] ? { enPlural: english[1] } : {}),
        ...(gender === 'en' || gender === 'ett' ? { gender } : {}),
        forms: stripUndefined(forms),
      };
    }
    case 'v': {
      const [infinitive, present, past, supine] = plain.map(clean);
      const forms: WordForms = {
        infinitive,
        present,
        past,
        supine,
        imperative: deriveImperative(infinitive, present),
      };
      const other = [...extras, ...derivePassive(infinitive, present, past, supine)];
      if (other.length) forms.other = unique(other);
      return {
        lemma: infinitive ?? '',
        pos: 'verb',
        ...base,
        ...(english[1] ? { enPast: english[1] } : {}),
        ...(english[2] ? { enParticiple: english[2] } : english[1] ? { enParticiple: english[1] } : {}),
        forms: stripUndefined(forms),
      };
    }
    case 'a': {
      const [common, neuter, plural, comparative, superlative] = plain.map(clean);
      const forms: WordForms = { common, neuter, plural, comparative, superlative };
      const other = [...extras];
      if (superlative) other.push(superlativeDefinite(superlative));
      if (other.length) forms.other = unique(other);
      return { lemma: common ?? '', pos: 'adjective', ...base, forms: stripUndefined(forms) };
    }
    case 'pn': {
      return { lemma: plain.join(' ').replace(/_/g, ' '), pos: 'proper-noun', ...base };
    }
    case 'x': {
      const [posCode, lemma, ...forms] = plain;
      const pos = POS_CODES[posCode];
      if (!pos) throw new Error(`Unknown part of speech "${posCode}" in: ${line}`);
      const other = [...forms.map((f) => f.replace(/_/g, ' ')), ...extras];
      return {
        lemma: lemma.replace(/_/g, ' '),
        pos,
        ...base,
        ...(other.length ? { forms: { other } } : {}),
      };
    }
    default:
      throw new Error(`Unknown dictionary code "${code}" in: ${line}`);
  }
}

export function parseCompactDictionary(source: string): DictionaryEntry[] {
  const out: DictionaryEntry[] = [];
  for (const line of source.split('\n')) {
    const entry = parseCompactLine(line);
    if (entry) out.push(entry);
  }
  return out;
}

/** Imperative: -a verbs keep the infinitive (prata!), others use the stem (köp!, tänk!, gå!). */
export function deriveImperative(inf?: string, present?: string): string | undefined {
  if (!inf || !present) return undefined;
  if (present.endsWith('ar') && inf.endsWith('a')) return inf;
  if (present.endsWith('er')) return present.slice(0, -2);
  if (present.endsWith('r')) return present.slice(0, -1);
  return undefined; // modal / irregular presents (kan, vill, ska, måste)
}

/** s-passive forms: kallas, nämns, kallades, släpptes, samlats. */
export function derivePassive(inf?: string, present?: string, past?: string, supine?: string): string[] {
  const out: string[] = [];
  if (!inf || inf.endsWith('s')) return out; // deponent verbs (finnas, minnas) are already s-forms
  out.push(`${inf}s`);
  if (present?.endsWith('er')) out.push(`${present.slice(0, -2)}s`);
  if (past && /(de|te|dde)$/.test(past)) out.push(`${past}s`);
  if (supine?.endsWith('t')) out.push(`${supine}s`);
  return out;
}

/** Definite/weak superlative: störst → största, svårast → svåraste. */
export function superlativeDefinite(sup: string): string {
  return sup.endsWith('ast') ? `${sup}e` : `${sup}a`;
}

function stripUndefined<T extends object>(o: T): T {
  const copy = { ...o } as Record<string, unknown>;
  for (const k of Object.keys(copy)) if (copy[k] === undefined) delete copy[k];
  return copy as T;
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
