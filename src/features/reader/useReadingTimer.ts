import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { addReadingTime } from '@/db/repos/progress';

const TICK_MS = 5_000;
const IDLE_LIMIT_MS = 3 * 60_000;

/**
 * Counts *active* reading time: only while the app is in the foreground and the
 * reader has seen an interaction (page turn, word lookup) in the last 3 minutes.
 * Time is flushed to SQLite when the app backgrounds or the reader closes.
 */
export function useReadingTimer(storyId: string | undefined) {
  const db = useSQLiteContext();
  const state = useRef({ seconds: 0, startedAt: '', lastActivity: 0, active: AppState.currentState === 'active' });

  const flush = useCallback(() => {
    const s = state.current;
    if (storyId && s.seconds > 0) {
      void addReadingTime(db, storyId, s.startedAt, s.seconds).catch(() => {});
    }
    s.seconds = 0;
    s.startedAt = new Date().toISOString();
  }, [db, storyId]);

  const ping = useCallback(() => {
    state.current.lastActivity = Date.now();
  }, []);

  useEffect(() => {
    state.current.startedAt = new Date().toISOString();
    state.current.lastActivity = Date.now();
    const timer = setInterval(() => {
      const s = state.current;
      if (s.active && Date.now() - s.lastActivity < IDLE_LIMIT_MS) s.seconds += TICK_MS / 1000;
    }, TICK_MS);
    const sub = AppState.addEventListener('change', (next) => {
      state.current.active = next === 'active';
      if (next === 'active') ping();
      else flush();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      flush();
    };
  }, [flush, ping]);

  return { ping };
}
