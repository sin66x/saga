import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Literata_400Regular } from '@expo-google-fonts/literata/400Regular';
import { Literata_400Regular_Italic } from '@expo-google-fonts/literata/400Regular_Italic';
import { Literata_500Medium } from '@expo-google-fonts/literata/500Medium';
import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans/400Regular';
import { NunitoSans_600SemiBold } from '@expo-google-fonts/nunito-sans/600SemiBold';
import { NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans/700Bold';
import { NunitoSans_800ExtraBold } from '@expo-google-fonts/nunito-sans/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ContentProvider } from '@/content/ContentProvider';
import { migrate } from '@/db/migrations';
import { SettingsProvider } from '@/features/settings/SettingsProvider';
import { registerPwa } from '@/lib/pwa';
import { useTheme } from '@/theme/ThemeContext';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Literata_400Regular,
    Literata_400Regular_Italic,
    Literata_500Medium,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  useEffect(() => {
    registerPwa();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Suspense fallback={null}>
      <SQLiteProvider databaseName="saga.db" onInit={migrate} useSuspense>
        <SettingsProvider>
          <ContentProvider>
            <AppNavigator />
          </ContentProvider>
        </SettingsProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

function AppNavigator() {
  const t = useTheme();
  const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: t.background, card: t.surface, text: t.ink, primary: t.accent, border: t.line },
  };
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="read/[id]" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="word/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="import" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </NavThemeProvider>
  );
}
