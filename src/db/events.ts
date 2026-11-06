/**
 * Minimal invalidation bus: repositories call `invalidate(tag)` after a write and
 * `useDbQuery` reloads every query that depends on that tag.
 */
export type DataTag = 'progress' | 'vocabulary' | 'results' | 'stories' | 'settings' | 'bookmarks';

type Listener = (tags: DataTag[]) => void;
const listeners = new Set<Listener>();

export function invalidate(...tags: DataTag[]): void {
  for (const l of listeners) l(tags);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
