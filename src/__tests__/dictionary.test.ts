import { describe, expect, it } from '@jest/globals';
import { parseCompactLine } from '@/features/dictionary/compact';
import { getBaseDictionary } from '@/features/dictionary/dictionary';
import { compare, pluralizeEnglish } from '@/features/dictionary/english';
import { createResolver } from '@/features/dictionary/resolver';

const r = createResolver();

describe('compact dictionary format', () => {
  it('parses nouns with all four forms', () => {
    const e = parseCompactLine('n en skog skogen skogar skogarna = forest')!;
    expect(e).toMatchObject({ lemma: 'skog', pos: 'noun', gender: 'en', en: 'forest' });
    expect(e.forms).toMatchObject({ indefSg: 'skog', defSg: 'skogen', indefPl: 'skogar', defPl: 'skogarna' });
  });

  it('derives imperative and passive forms of verbs', () => {
    const e = parseCompactLine('v kalla kallar kallade kallat = to call')!;
    expect(e.forms?.imperative).toBe('kalla');
    expect(e.forms?.other).toEqual(expect.arrayContaining(['kallas', 'kallades', 'kallats']));
    expect(parseCompactLine('v köpa köper köpte köpt = to buy ; bought')!.forms?.imperative).toBe('köp');
  });

  it('has no duplicate lemma + part of speech', () => {
    const keys = getBaseDictionary().entries.map((e) => `${e.lemma}|${e.pos}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('word resolution', () => {
  it.each([
    ['skogen', 'skog', 'the forest', 'definite singular'],
    ['gick', 'gå', 'went', 'past tense'],
    ['husen', 'hus', 'the houses', 'definite plural'],
    ['böcker', 'bok', 'books', 'indefinite plural'],
    ['gamla', 'gammal', 'old', 'plural or definite'],
  ])('%s → %s (%s)', (word, lemma, en, label) => {
    const res = r.resolve(word);
    expect(res.status).toBe('found');
    expect(res.hit?.entry.lemma).toBe(lemma);
    expect(res.translation).toBe(en);
    expect(res.formLabel).toBe(label);
  });

  it('handles å, ä, ö and capitals', () => {
    expect(r.resolve('Älgen').hit?.entry.lemma).toBe('älg');
    expect(r.resolve('ÖN').hit?.entry.lemma).toBe('ö');
  });

  it('explains genitive -s', () => {
    const res = r.resolve('Sveriges');
    expect(res.hit?.entry.lemma).toBe('Sverige');
    expect(res.translation).toBe("Sweden's");
    expect(res.formLabel).toMatch(/genitive/);
  });

  it('understands "-talet" and Roman numerals', () => {
    expect(r.resolve('1600-talet').translation).toBe('the 1600s');
    expect(r.resolve('XII').translation).toBe('the Twelfth');
  });

  it('uses context for homographs', () => {
    expect(r.resolve('man', { nextWord: 'tar' }).hit?.entry.pos).toBe('pronoun');
    expect(r.resolve('man', { previousWord: 'en' }).hit?.entry.pos).toBe('noun');
  });

  it('analyses unknown compounds without inventing a translation', () => {
    const res = r.resolve('kärlekssång');
    expect(res.status).toBe('compound');
    expect(res.compound?.map((p) => p.text)).toEqual(['kärlek', 's', 'sång']);
  });

  it('reports unknown words honestly', () => {
    const res = r.resolve('blorpfnask');
    expect(res.status).toBe('not-found');
    expect(res.translation).toBeUndefined();
  });

  it('prefers the story glossary', () => {
    const story = createResolver([{ lemma: 'högtid', pos: 'noun', en: 'festive holiday', gender: 'en', forms: { indefPl: 'högtider' } }]);
    expect(story.resolve('högtider').hit?.source).toBe('story');
  });

  it('inflects English sensibly', () => {
    expect(pluralizeEnglish('church')).toBe('churches');
    expect(pluralizeEnglish('day (24 hours)')).toBe('days (24 hours)');
    expect(compare('big', 'er')).toBe('bigger');
    expect(compare('beautiful', 'est')).toBe('most beautiful');
    expect(compare('good', 'er')).toBe('better');
  });
});
