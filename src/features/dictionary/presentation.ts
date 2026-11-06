/**
 * Turns dictionary entries into display rows (forms tables) for the popover,
 * vocabulary cards and flashcards.
 */
import type { DictionaryEntry, PartOfSpeech, WordForms } from '@/content/types';
import { POS_LABELS } from './forms';

export interface FormRow {
  label: string;
  labelSv: string;
  value: string;
}

export interface FormTable {
  title: string;
  rows: FormRow[];
}

export function posLabel(pos: PartOfSpeech | 'unknown'): string {
  return POS_LABELS[pos]?.en ?? 'Word';
}

/** Builds the grammatical forms of a word as labelled rows. */
export function formTables(pos: PartOfSpeech | 'unknown', forms: WordForms | null | undefined, gender?: 'en' | 'ett' | null, lemma?: string): FormTable[] {
  if (!forms) return [];
  if (pos === 'noun') {
    const art = gender ?? '';
    const tables: FormTable[] = [];
    const sg: FormRow[] = [];
    if (forms.indefSg) sg.push({ labelSv: 'obestämd', label: 'Indefinite', value: art ? `${art} ${forms.indefSg}` : forms.indefSg });
    if (forms.defSg) sg.push({ labelSv: 'bestämd', label: 'Definite', value: forms.defSg });
    if (sg.length) tables.push({ title: 'Singular', rows: sg });
    const pl: FormRow[] = [];
    if (forms.indefPl) pl.push({ labelSv: 'obestämd', label: 'Indefinite', value: forms.indefPl });
    if (forms.defPl) pl.push({ labelSv: 'bestämd', label: 'Definite', value: forms.defPl });
    if (pl.length) tables.push({ title: 'Plural', rows: pl });
    return tables;
  }
  if (pos === 'verb') {
    const rows: FormRow[] = [];
    if (forms.infinitive) rows.push({ labelSv: 'infinitiv', label: 'Infinitive', value: `att ${forms.infinitive}` });
    if (forms.present) rows.push({ labelSv: 'presens', label: 'Present', value: forms.present });
    if (forms.past) rows.push({ labelSv: 'preteritum', label: 'Past', value: forms.past });
    if (forms.supine) rows.push({ labelSv: 'supinum', label: 'Supine', value: `har ${forms.supine}` });
    if (forms.imperative) rows.push({ labelSv: 'imperativ', label: 'Imperative', value: `${forms.imperative}!` });
    return rows.length ? [{ title: 'Verb forms', rows }] : [];
  }
  if (pos === 'adjective') {
    const rows: FormRow[] = [];
    if (forms.common) rows.push({ labelSv: 'en-ord', label: 'With en-words', value: `en ${forms.common} …` });
    if (forms.neuter) rows.push({ labelSv: 'ett-ord', label: 'With ett-words', value: `ett ${forms.neuter} …` });
    if (forms.plural) rows.push({ labelSv: 'plural/bestämd', label: 'Plural / definite', value: forms.plural });
    const tables: FormTable[] = rows.length ? [{ title: 'Agreement', rows }] : [];
    const cmp: FormRow[] = [];
    if (forms.comparative) cmp.push({ labelSv: 'komparativ', label: 'Comparative', value: forms.comparative });
    if (forms.superlative) cmp.push({ labelSv: 'superlativ', label: 'Superlative', value: forms.superlative });
    if (cmp.length) tables.push({ title: 'Comparison', rows: cmp });
    return tables;
  }
  const others = (forms.other ?? []).filter((o) => o !== lemma);
  return others.length ? [{ title: 'Forms', rows: others.map((o) => ({ label: '', labelSv: '', value: o })) }] : [];
}

/** "en skog", "att gå", "stor" – how a word is shown as a headword. */
export function headword(entry: Pick<DictionaryEntry, 'lemma' | 'pos' | 'gender'>): string {
  if (entry.pos === 'noun' && entry.gender) return `${entry.gender} ${entry.lemma}`;
  if (entry.pos === 'verb') return `att ${entry.lemma}`;
  return entry.lemma;
}
