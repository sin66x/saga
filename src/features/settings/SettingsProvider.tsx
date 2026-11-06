import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { subscribe } from '@/db/events';
import { DEFAULT_SETTINGS, getSettings, setSetting, type Settings } from '@/db/repos/settings';
import { setSpeechSpeed } from '@/lib/speech';
import { ThemeProvider } from '@/theme/ThemeContext';

interface SettingsState {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

const SettingsContext = createContext<SettingsState>({ settings: DEFAULT_SETTINGS, update: async () => {} });

/** Loads user preferences from SQLite and provides the theme derived from them. */
export function SettingsProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const load = useCallback(() => {
    getSettings(db).then(setSettings).catch((e) => console.warn('[settings] load failed', e));
  }, [db]);

  useEffect(() => {
    load();
    return subscribe((tags) => {
      if (tags.includes('settings')) load();
    });
  }, [load]);

  useEffect(() => {
    setSpeechSpeed(settings.speechSpeed);
  }, [settings.speechSpeed]);

  const update = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((s) => ({ ...s, [key]: value }));
      await setSetting(db, key, value);
    },
    [db],
  );

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return (
    <SettingsContext value={value}>
      <ThemeProvider preference={settings.theme}>{children}</ThemeProvider>
    </SettingsContext>
  );
}

export function useSettings(): SettingsState {
  return use(SettingsContext);
}
