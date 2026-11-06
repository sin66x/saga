import { describe, expect, it } from '@jest/globals';
import { normalizeWord, sentenceAt, tokenize, uniqueWords } from '@/lib/tokenizer';

describe('tokenizer', () => {
  it('keeps Swedish letters inside words', () => {
    const words = tokenize('Flickan gick långsamt genom den gamla skogen. Älgen åt.').filter((t) => t.kind === 'word').map((t) => t.text);
    expect(words).toEqual(['Flickan', 'gick', 'långsamt', 'genom', 'den', 'gamla', 'skogen', 'Älgen', 'åt']);
  });

  it('separates punctuation and dialogue dashes', () => {
    const tokens = tokenize('– Hej! sa hon.');
    expect(tokens.filter((t) => t.kind === 'word').map((t) => t.text)).toEqual(['Hej', 'sa', 'hon']);
    expect(tokens[0]).toMatchObject({ kind: 'punct', text: '–' });
  });

  it('keeps hyphenated forms and numbers together', () => {
    const tokens = tokenize('På 1600-talet bodde 12 000 människor i d-vitamin-staden.');
    expect(tokens.find((t) => t.text === '1600-talet')?.kind).toBe('number');
    expect(tokens.find((t) => t.text === '12 000')?.kind).toBe('number');
    expect(tokens.find((t) => t.text === 'd-vitamin-staden')?.kind).toBe('word');
  });

  it('tracks sentences', () => {
    const text = 'Det är lördag. Ella är tio år.';
    const tokens = tokenize(text);
    const ella = tokens.findIndex((t) => t.text === 'Ella');
    expect(sentenceAt(tokens, ella)).toBe('Ella är tio år.');
  });

  it('round-trips the original text exactly', () => {
    const text = '– Idag ska vi resa i tiden, säger morfar. "Hur då?"';
    expect(tokenize(text).map((t) => t.text).join('')).toBe(text);
  });

  it('normalises words for lookup', () => {
    expect(normalizeWord('Skogen')).toBe('skogen');
    expect(uniqueWords('Hus hus HUS')).toEqual(['hus']);
  });
});
