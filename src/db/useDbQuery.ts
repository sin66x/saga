import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type DataTag, subscribe } from './events';

export interface QueryState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `loader(db)` when the screen gains focus, whenever one of `tags` is
 * invalidated, and when `key` changes (e.g. the id of the item being shown).
 * Keeps the previous data while reloading, so screens don't flicker.
 */
export function useDbQuery<T>(loader: (db: SQLiteDatabase) => Promise<T>, tags: DataTag[], key = ''): QueryState<T> {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const seq = useRef(0);

  // Always call the latest loader without re-subscribing on every render.
  useLayoutEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(() => {
    const id = ++seq.current;
    setLoading(true);
    loaderRef
      .current(db)
      .then((result) => {
        if (id === seq.current) {
          setData(result);
          setError(undefined);
        }
      })
      .catch((e: unknown) => {
        if (id === seq.current) setError(e instanceof Error ? e : new Error(String(e)));
        console.warn('[db] query failed', e);
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
    // `key` is a dependency on purpose: a new key means a different query.
  }, [db, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Runs on first focus, on every re-focus, and when `run` changes.
  useFocusEffect(run);

  const tagKey = tags.join('|');
  useEffect(() => {
    const wanted = new Set(tagKey.split('|'));
    return subscribe((changed) => {
      if (changed.some((t) => wanted.has(t))) run();
    });
  }, [run, tagKey]);

  return { data, error, loading, reload: run };
}
