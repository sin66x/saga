/**
 * Builds vocabulary exercises from the learner's saved words, using the original
 * story sentences whenever possible. Pure (no React / DB) so it can be unit tested.
 *
 * Exercise types:
 *   1. Swedish → English (multiple choice)
 *   2. English → Swedish (multiple choice)
 *   3. English → Swedish (typed)
 *   4. Fill the missing word in the original sentence
 *   5. Match Swedish words with English meanings
 *   6. Identify the word in a sentence
 */
import type { Exercise } from '@/content/types';
import { headword } from '@/features/dictionary/presentation';
import { tokenize } from '@/lib/tokenizer';
import { shuffle } from '@/lib/util';

export interface PracticeWord {
  id: string;
  word: string;
  lemma: string;
  pos: string;
  translation: string;
  gender?: 'en' | 'ett' | null;
  sentence?: string | null;
}

export type VocabMode = 'sv-en' | 'en-sv' | 'typing' | 'cloze' | 'match' | 'identify';

export interface VocabExercise {
  exercise: Exercise;
  /** Words this exercise tests (used to update their spaced-repetition state). */
  wordIds: string[];
  mode: VocabMode;
}

const firstSense = (en: string) => en.split(/[,;]/)[0].trim();
const display = (w: PracticeWord) => headword({ lemma: w.lemma, pos: w.pos as never, gender: w.gender ?? undefined });

/** Three wrong options, preferring words of the same part of speech (so the answer is not obvious). */
function pickDistractors(target: PracticeWord, candidates: PracticeWord[], label: (w: PracticeWord) => string, correct: string, random: () => number): string[] {
  const usable = candidates.filter((c) => c.translation && c.lemma !== target.lemma && label(c) !== correct);
  const same = shuffle(usable.filter((c) => c.pos === target.pos), random);
  const rest = shuffle(usable.filter((c) => c.pos !== target.pos), random);
  return [...new Set([...same, ...rest].map(label))].slice(0, 3);
}

function distractors<T>(pool: T[], exclude: (t: T) => boolean, n: number, random: () => number): T[] {
  return shuffle(pool.filter((p) => !exclude(p)), random).slice(0, n);
}

function choiceFrom(correct: string, wrongs: string[], random: () => number): { options: string[]; answer: number } {
  const options = shuffle([correct, ...wrongs], random);
  return { options, answer: options.indexOf(correct) };
}

/** Finds the exact word as written in the sentence (case-insensitive). */
function wordInSentence(sentence: string, word: string): string | null {
  const tok = tokenize(sentence).find((t) => t.kind === 'word' && t.text.toLowerCase() === word.toLowerCase());
  return tok?.text ?? null;
}

export function buildExercise(target: PracticeWord, mode: VocabMode, pool: PracticeWord[], extras: PracticeWord[] = [], random: () => number = Math.random): VocabExercise | null {
  const others = pool.filter((p) => p.id !== target.id && p.translation);
  const en = firstSense(target.translation);
  const note = target.sentence ? ` In the story: “${target.sentence}”` : '';

  switch (mode) {
    case 'sv-en': {
      const wrong = pickDistractors(target, [...others, ...extras], (o) => firstSense(o.translation), en, random);
      if (wrong.length < 2) return null;
      const { options, answer } = choiceFrom(en, wrong, random);
      return {
        mode,
        wordIds: [target.id],
        exercise: { id: `${target.id}-sv-en`, type: 'choice', prompt: `What does “${display(target)}” mean?`, options, answer, explanation: `${display(target)} = ${target.translation}.${note}` },
      };
    }
    case 'en-sv': {
      const wrong = pickDistractors(target, [...others, ...extras], display, display(target), random);
      if (wrong.length < 2) return null;
      const { options, answer } = choiceFrom(display(target), wrong, random);
      return {
        mode,
        wordIds: [target.id],
        exercise: { id: `${target.id}-en-sv`, type: 'choice', prompt: `How do you say “${en}” in Swedish?`, options, answer, explanation: `“${en}” is ${display(target)}.${note}` },
      };
    }
    case 'typing': {
      const accepted = [target.lemma, display(target)];
      return {
        mode,
        wordIds: [target.id],
        exercise: {
          id: `${target.id}-typing`,
          type: 'fill',
          prompt: `Type the Swedish word for “${en}”.`,
          sentence: target.pos === 'noun' && target.gender ? `${target.gender} ___` : target.pos === 'verb' ? 'att ___' : '___',
          answers: accepted,
          explanation: `${display(target)} = ${target.translation}.${note}`,
        },
      };
    }
    case 'cloze': {
      if (!target.sentence) return null;
      const surface = wordInSentence(target.sentence, target.word);
      if (!surface) return null;
      const gap = target.sentence.replace(new RegExp(`(^|[^A-Za-zÀ-ÖØ-öø-ÿ])${escapeRe(surface)}(?=$|[^A-Za-zÀ-ÖØ-öø-ÿ])`), `$1___`);
      if (!gap.includes('___')) return null;
      const wrong = distractors(others, (o) => o.word.toLowerCase() === surface.toLowerCase(), 3, random).map((o) => o.word);
      if (wrong.length < 2) {
        return {
          mode,
          wordIds: [target.id],
          exercise: { id: `${target.id}-cloze`, type: 'fill', prompt: `Fill in the missing word (it means “${en}”).`, sentence: gap, answers: [surface], explanation: `The missing word is “${surface}” (${display(target)} = ${target.translation}).` },
        };
      }
      const { options, answer } = choiceFrom(surface, wrong, random);
      return {
        mode,
        wordIds: [target.id],
        exercise: { id: `${target.id}-cloze`, type: 'choice', prompt: 'Which word is missing from the story sentence?', sentence: gap, options, answer, explanation: `“${surface}” is a form of ${display(target)} (${target.translation}).` },
      };
    }
    case 'identify': {
      if (!target.sentence) return null;
      const surface = wordInSentence(target.sentence, target.word);
      if (!surface) return null;
      return {
        mode,
        wordIds: [target.id],
        exercise: { id: `${target.id}-identify`, type: 'identify', prompt: `Tap the word that means “${en}”.`, sentence: target.sentence, target: surface, explanation: `“${surface}” is a form of ${display(target)} = ${target.translation}.` },
      };
    }
    case 'match':
      return null; // built from several words, see buildMatch
  }
}

export function buildMatch(words: PracticeWord[], random: () => number = Math.random): VocabExercise | null {
  // Unique left and right sides, otherwise matching would be ambiguous.
  const seenL = new Set<string>();
  const seenR = new Set<string>();
  const picked: PracticeWord[] = [];
  for (const w of shuffle(words.filter((x) => x.translation), random)) {
    const l = display(w);
    const r = firstSense(w.translation);
    if (seenL.has(l) || seenR.has(r)) continue;
    seenL.add(l);
    seenR.add(r);
    picked.push(w);
    if (picked.length === 5) break;
  }
  if (picked.length < 3) return null;
  return {
    mode: 'match',
    wordIds: picked.map((w) => w.id),
    exercise: {
      id: `match-${picked.map((w) => w.id).join('-')}`,
      type: 'match',
      prompt: 'Match the Swedish words with their meanings.',
      pairs: picked.map((w) => [display(w), firstSense(w.translation)] as [string, string]),
      explanation: picked.map((w) => `${display(w)} = ${firstSense(w.translation)}`).join(' · '),
    },
  };
}

/**
 * A practice session: a varied mix of exercise types over the given words.
 * `targets` are the words to practise (due/difficult first); `pool` provides distractors.
 */
export function buildSession(targets: PracticeWord[], pool: PracticeWord[], opts: { size?: number; extras?: PracticeWord[]; random?: () => number } = {}): VocabExercise[] {
  const { size = 10, extras = [], random = Math.random } = opts;
  const usable = targets.filter((t) => t.translation);
  const modes: VocabMode[] = ['sv-en', 'cloze', 'en-sv', 'identify', 'typing', 'sv-en', 'cloze', 'en-sv'];
  const out: VocabExercise[] = [];
  let m = Math.floor(random() * modes.length);
  for (const w of usable) {
    if (out.length >= size - 1) break;
    // try a few modes until one works for this word
    for (let k = 0; k < modes.length; k++) {
      const ex = buildExercise(w, modes[(m + k) % modes.length], pool, extras, random);
      if (ex) {
        out.push(ex);
        m = (m + k + 1) % modes.length;
        break;
      }
    }
  }
  const match = buildMatch(usable.length >= 3 ? usable : pool, random);
  if (match) out.splice(Math.min(3, out.length), 0, match);
  return out.slice(0, size);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
