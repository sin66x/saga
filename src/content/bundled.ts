import { bundledStories } from './bundled/generated';
import { makeStory } from './story';
import type { Story } from './types';

let cache: Story[] | null = null;

/** The stories compiled into the app (see scripts/build-content.ts). */
export function getBundledStories(): Story[] {
  if (cache) return cache;
  cache = bundledStories.map((b) =>
    makeStory(b, 'bundled', (path) => {
      const xml = b.assets[path.replace(/^\.?\//, '')];
      return xml ? { kind: 'svg-xml', xml } : { kind: 'missing', path };
    }),
  );
  return cache;
}
