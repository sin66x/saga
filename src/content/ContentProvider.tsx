import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getBundledStories } from './bundled';
import { type ImportedLoadError, loadImportedStories } from './imported';
import type { Story } from './types';

interface ContentState {
  stories: Story[];
  loading: boolean;
  importErrors: ImportedLoadError[];
  getStory: (id: string) => Story | undefined;
  reload: () => Promise<void>;
}

const ContentContext = createContext<ContentState | null>(null);

/** Provides the library: bundled stories (instant) + imported stories (from Documents). */
export function ContentProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [imported, setImported] = useState<Story[]>([]);
  const [importErrors, setImportErrors] = useState<ImportedLoadError[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await loadImportedStories(db);
      setImported(res.stories);
      setImportErrors(res.errors);
    } catch (e) {
      console.warn('[content] failed to load imported stories', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let alive = true;
    loadImportedStories(db)
      .then((res) => {
        if (!alive) return;
        setImported(res.stories);
        setImportErrors(res.errors);
      })
      .catch((e) => console.warn('[content] failed to load imported stories', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [db]);

  const value = useMemo<ContentState>(() => {
    const bundled = getBundledStories();
    const bundledIds = new Set(bundled.map((s) => s.manifest.id));
    const stories = [...bundled, ...imported.filter((s) => !bundledIds.has(s.manifest.id))];
    const byId = new Map(stories.map((s) => [s.manifest.id, s]));
    return { stories, loading, importErrors, getStory: (id) => byId.get(id), reload };
  }, [imported, importErrors, loading, reload]);

  return <ContentContext value={value}>{children}</ContentContext>;
}

export function useContent(): ContentState {
  const ctx = use(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>');
  return ctx;
}

export function useStory(id: string | undefined): Story | undefined {
  const { getStory } = useContent();
  return id ? getStory(id) : undefined;
}
