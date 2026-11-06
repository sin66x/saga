import type { SQLiteDatabase } from 'expo-sqlite';
import type { ReaderSize } from '@/theme/tokens';
import type { ThemePreference } from '@/theme/ThemeContext';
import type { SpeechSpeed } from '@/lib/speech';
import { invalidate } from '../events';

export interface Settings {
  readerSize: ReaderSize;
  theme: ThemePreference;
  /** Show the "English summary" helper button on story pages. */
  englishHelp: boolean;
  haptics: boolean;
  /** Speed of the read-aloud voice. */
  speechSpeed: SpeechSpeed;
  /** Story most recently opened (for "Continue reading"). */
  lastStoryId: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  readerSize: 'M',
  theme: 'system',
  englishHelp: true,
  haptics: true,
  speechSpeed: 'normal',
  lastStoryId: null,
};

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    try {
      out[key] = JSON.parse(value);
    } catch {
      // ignore malformed values; defaults apply
    }
  }
  return out as unknown as Settings;
}

export async function setSetting<K extends keyof Settings>(db: SQLiteDatabase, key: K, value: Settings[K]): Promise<void> {
  await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
  invalidate('settings');
}
