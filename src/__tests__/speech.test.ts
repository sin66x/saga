import { describe, expect, it } from '@jest/globals';
import { pageSpeechChunks, speechText } from '@/lib/speechText';

describe('speech text', () => {
  it('reads Roman numerals after names as Swedish ordinals', () => {
    expect(speechText('Karl XII förlorade kriget.')).toBe('Karl den tolfte förlorade kriget.');
    expect(speechText('Gustav II Adolf blir kung')).toBe('Gustav den andre Adolf blir kung');
    expect(speechText('Åke V kom.')).toBe('Åke den femte kom.');
  });

  it('spells out abbreviations and turns dialogue dashes into pauses', () => {
    expect(speechText('Daniel läser på SFI.')).toBe('Daniel läser på S F I.');
    expect(speechText('– Hej! säger hon.')).toBe('Hej! säger hon.');
    expect(speechText('Hon säger – kanske – ja.')).toBe('Hon säger, kanske, ja.');
  });

  it('collects every block of a page in reading order', () => {
    const chunks = pageSpeechChunks({
      heading: 'Lucia',
      paragraphs: ['Första.', 'Andra.'],
      timeline: [{ when: '1523', label: 'Gustav Vasa blir kung' }],
      factBox: { kind: 'fact', text: { sv: 'Fakta här.', en: 'Fact here.' } },
    });
    expect(chunks.map((c) => c.block)).toEqual(['h', 't0', 'p0', 'p1', 'f']);
    expect(chunks[1].text).toBe('1523. Gustav Vasa blir kung');
  });
});
