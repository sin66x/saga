import type {
  ChoiceExercise, CorrectExercise, Exercise, FillExercise, MatchExercise, OrderExercise, TrueFalseExercise,
} from '@/content/types';

export type GrammarCategory = 'nouns' | 'verbs' | 'adjectives' | 'pronouns' | 'sentence' | 'prepositions' | 'other';

export type LessonBlock =
  | { type: 'text'; text: string }
  | { type: 'examples'; items: { sv: string; en: string }[] }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | { type: 'tip'; text: string };

export interface GrammarTopic {
  id: string;
  category: GrammarCategory;
  title: string;
  titleSv: string;
  level: 'A1' | 'A1-A2' | 'A2' | 'A2-B1' | 'B1';
  /** One-line summary for the topic list. */
  summary: string;
  lesson: LessonBlock[];
  exercises: Exercise[];
}

export const CATEGORIES: { id: GrammarCategory; title: string; titleSv: string; icon: string }[] = [
  { id: 'nouns', title: 'Nouns', titleSv: 'Substantiv', icon: 'book' },
  { id: 'verbs', title: 'Verbs', titleSv: 'Verb', icon: 'play' },
  { id: 'adjectives', title: 'Adjectives', titleSv: 'Adjektiv', icon: 'sparkles' },
  { id: 'pronouns', title: 'Pronouns', titleSv: 'Pronomen', icon: 'translate' },
  { id: 'sentence', title: 'Sentence structure', titleSv: 'Ordföljd', icon: 'text' },
  { id: 'prepositions', title: 'Prepositions', titleSv: 'Prepositioner', icon: 'map' },
  { id: 'other', title: 'More SFI topics', titleSv: 'Mer att lära', icon: 'graduation' },
];

/* ------------------------------------------------------------------ */
/* Compact authoring helpers                                           */
/* ------------------------------------------------------------------ */

type D = 1 | 2 | 3;

export const p = (text: string): LessonBlock => ({ type: 'text', text });
export const ex = (...items: [string, string][]): LessonBlock => ({ type: 'examples', items: items.map(([sv, en]) => ({ sv, en })) });
export const table = (headers: string[], rows: string[][], caption?: string): LessonBlock => ({ type: 'table', headers, rows, caption });
export const tip = (text: string): LessonBlock => ({ type: 'tip', text });

export function mc(id: string, d: D, prompt: string, sentence: string | null, options: string[], answer: number, explanation: string, wrong?: Record<string, string>): ChoiceExercise {
  return { id, type: 'choice', difficulty: d, prompt, ...(sentence ? { sentence } : {}), options, answer, explanation, ...(wrong ? { wrong } : {}) };
}

export function fill(id: string, d: D, prompt: string, sentence: string, answers: string[], explanation: string, translation?: string): FillExercise {
  return { id, type: 'fill', difficulty: d, prompt, sentence, answers, explanation, ...(translation ? { translation } : {}) };
}

export function order(id: string, d: D, prompt: string, words: string[], explanation: string, opts: { end?: '.' | '?' | '!'; translation?: string; alternatives?: string[][] } = {}): OrderExercise {
  return { id, type: 'order', difficulty: d, prompt, words, explanation, ...opts };
}

export function match(id: string, d: D, prompt: string, pairs: [string, string][], explanation: string): MatchExercise {
  return { id, type: 'match', difficulty: d, prompt, pairs, explanation };
}

export function fix(id: string, d: D, incorrect: string, options: string[], answer: number, explanation: string, wrong?: Record<string, string>): CorrectExercise {
  return { id, type: 'correct', difficulty: d, prompt: 'This sentence has a mistake. Choose the correct version.', incorrect, options, answer, explanation, ...(wrong ? { wrong } : {}) };
}

export function tf(id: string, d: D, statement: string, answer: boolean, explanation: string, prompt = 'Is this sentence correct Swedish?'): TrueFalseExercise {
  return { id, type: 'truefalse', difficulty: d, prompt, statement, answer, explanation };
}
