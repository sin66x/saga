import { createContext, use, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type Theme } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const ThemeContext = createContext<Theme>(themes.light);

export function ThemeProvider({ preference = 'system', children }: PropsWithChildren<{ preference?: ThemePreference }>) {
  const system = useColorScheme();
  const theme = useMemo(() => {
    const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return themes[scheme];
  }, [preference, system]);
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return use(ThemeContext);
}
