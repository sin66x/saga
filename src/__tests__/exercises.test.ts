import { describe, expect, it } from '@jest/globals';
import { checkOrder, checkTyped, normalizeAnswer, seededShuffle } from '@/features/exercises/check';
import { GRAMMAR_TOPICS } from '@/features/grammar';
import { validateExercise } from '@/features/import/validate';
import { buildMatch, buildSession, type PracticeWord } from '@/features/vocabulary/exerciseGenerator';

describe('answer checking', () => {
  it('ignores case, spaces and final punctuation', () => {
    expect(normalizeAnswer('  Huset. ')).toBe('huset');
    expect(checkTyped('Huset!', ['huset']).correct).toBe(true);
  });
  it('flags missing Swedish letters as a near miss (not correct)', () => {
    const r = checkTyped('lasa', ['läsa']);
    expect(r.correct).toBe(false);
    expect(r.nearMiss).toBe('diacritics');
  });
  it('does not accept a wrong ending', () => {
    expect(checkTyped('huse', ['huset'])).toMatchObject({ correct: false, nearMiss: 'one-letter' });
  });
  it('checks word order including alternatives', () => {
    expect(checkOrder(['I', 'dag', 'åker', 'jag'], { words: ['I', 'dag', 'åker', 'jag'] })).toBe(true);
    expect(checkOrder(['jag', 'åker', 'i', 'dag'], { words: ['I', 'dag', 'åker', 'jag'], alternatives: [['Jag', 'åker', 'i', 'dag']] })).toBe(true);
    expect(checkOrder(['I', 'dag', 'jag', 'åker'], { words: ['I', 'dag', 'åker', 'jag'] })).toBe(false);
  });
  it('never shows tiles in the solved order', () => {
    expect(seededShuffle(['a', 'b'], 'x')).not.toEqual(['a', 'b']);
  });
});

describe('grammar content', () => {
  it('has the SFI topic areas', () => {
    const cats = new Set(GRAMMAR_TOPICS.map((t) => t.category));
    expect([...cats]).toEqual(expect.arrayContaining(['nouns', 'verbs', 'adjectives', 'pronouns', 'sentence', 'prepositions', 'other']));
    expect(GRAMMAR_TOPICS.length).toBeGreaterThanOrEqual(25);
  });

  it.each(GRAMMAR_TOPICS.map((t) => [t.id, t] as const))('%s: every exercise is valid and explained', (_id, topic) => {
    const errors: string[] = [];
    const ids = new Set<string>();
    for (const ex of topic.exercises) {
      validateExercise(ex, `${topic.id}/${ex.id}`, (w, m) => errors.push(`${w}: ${m}`));
      expect(ids.has(ex.id)).toBe(false);
      ids.add(ex.id);
      if (ex.type === 'match') {
        expect(new Set(ex.pairs.map((p) => p[0])).size).toBe(ex.pairs.length);
        expect(new Set(ex.pairs.map((p) => p[1])).size).toBe(ex.pairs.length);
      }
      if (ex.type === 'choice' || ex.type === 'correct') expect(new Set(ex.options).size).toBe(ex.options.length);
    }
    expect(errors).toEqual([]);
    expect(topic.exercises.length).toBeGreaterThanOrEqual(5);
    expect(topic.lesson.length).toBeGreaterThan(0);
  });
});

describe('vocabulary exercises', () => {
  const words: PracticeWord[] = [
    { id: '1', word: 'skogen', lemma: 'skog', pos: 'noun', gender: 'en', translation: 'forest', sentence: 'Flickan gick genom skogen.' },
    { id: '2', word: 'gick', lemma: 'gå', pos: 'verb', translation: 'to go, to walk', sentence: 'Flickan gick genom skogen.' },
    { id: '3', word: 'huset', lemma: 'hus', pos: 'noun', gender: 'ett', translation: 'house', sentence: 'Huset är rött.' },
    { id: '4', word: 'stora', lemma: 'stor', pos: 'adjective', translation: 'big', sentence: 'De stora skeppen seglade.' },
    { id: '5', word: 'bok', lemma: 'bok', pos: 'noun', gender: 'en', translation: 'book', sentence: null },
  ];
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  it('builds a varied, valid session', () => {
    const session = buildSession(words, words, { size: 8, random });
    expect(session.length).toBeGreaterThanOrEqual(4);
    expect(new Set(session.map((s) => s.mode)).size).toBeGreaterThanOrEqual(3);
    for (const s of session) {
      const errors: string[] = [];
      validateExercise(s.exercise, s.exercise.id, (w, m) => errors.push(m));
      expect(errors).toEqual([]);
    }
  });

  it('builds unambiguous matching exercises', () => {
    const m = buildMatch(words, random)!;
    expect(m.exercise.type).toBe('match');
    if (m.exercise.type === 'match') expect(new Set(m.exercise.pairs.map((p) => p[1])).size).toBe(m.exercise.pairs.length);
  });
});
