/** Pure helpers that prepare Swedish text for the text-to-speech voice (unit tested). */
import type { FlatPage } from '@/content/types';

const ORDINALS: Record<string, string> = {
  I: 'första', II: 'andre', III: 'tredje', IV: 'fjärde', V: 'femte', VI: 'sjätte', VII: 'sjunde', VIII: 'åttonde', IX: 'nionde',
  X: 'tionde', XI: 'elfte', XII: 'tolfte', XIII: 'trettonde', XIV: 'fjortonde', XV: 'femtonde', XVI: 'sextonde',
};

/** "Karl XII" → "Karl den tolfte", "SFI" → "S F I" – so the voice reads them as a Swede would. */
export function speechText(text: string): string {
  return text
    .replace(/(^|[^A-Za-zÅÄÖåäö])([A-ZÅÄÖ][a-zåäö]+) (XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II)\b/g, (_m, pre: string, name: string, roman: string) => `${pre}${name} den ${ORDINALS[roman]}`)
    .replace(/\bSFI\b/g, 'S F I')
    .replace(/\bEU\b/g, 'E U')
    .replace(/\bD-vitamin\b/gi, 'D vitamin')
    .replace(/\s*[–—]\s*/g, ', ') // dialogue dashes become a short pause
    .replace(/^,\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SpeechChunk {
  /** Matches the block ids used by the page layout, so the reader can highlight it. */
  block: string;
  text: string;
}

/** Everything on a page that should be read aloud, in reading order. */
export function pageSpeechChunks(page: Pick<FlatPage, 'heading' | 'paragraphs' | 'timeline' | 'factBox'>): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  if (page.heading) chunks.push({ block: 'h', text: page.heading });
  (page.timeline ?? []).forEach((e, i) => chunks.push({ block: `t${i}`, text: `${e.when}. ${e.label}` }));
  page.paragraphs.forEach((p, i) => chunks.push({ block: `p${i}`, text: p }));
  if (page.factBox) chunks.push({ block: 'f', text: page.factBox.text.sv });
  return chunks.map((c) => ({ ...c, text: speechText(c.text) })).filter((c) => c.text.length > 0);
}

