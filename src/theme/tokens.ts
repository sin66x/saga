/**
 * Design tokens. Warm, paper-like Scandinavian palette: falu red, lake blue,
 * pine green and ochre on cream paper. Dark mode keeps the warmth (night reading).
 */
import { Platform } from 'react-native';

export const palette = {
  falu: '#B5443B',
  lake: '#3D6A8E',
  pine: '#3E7A6A',
  ochre: '#C98F2E',
  plum: '#7E5A8E',
};

const light = {
  scheme: 'light' as const,
  background: '#FBF7F0',
  paper: '#FFFCF6',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EDE2',
  surfacePressed: '#EFE6D8',
  ink: '#2E2A25',
  inkSoft: '#655E55',
  inkFaint: '#A0978A',
  line: '#E9E0D2',
  accent: palette.falu,
  accentSoft: '#F6E3DE',
  accentInk: '#FFFFFF',
  blue: palette.lake,
  blueSoft: '#E1EBF2',
  green: palette.pine,
  greenSoft: '#E0EEE8',
  gold: palette.ochre,
  goldSoft: '#F7ECD6',
  plum: palette.plum,
  plumSoft: '#EEE6F1',
  success: '#3F8150',
  successSoft: '#E2F0E3',
  error: '#BC4B36',
  errorSoft: '#F8E2DC',
  highlight: '#F9E2A6',
  shadow: '#7A5C3A',
  overlay: 'rgba(36, 28, 20, 0.28)',
};

export type Theme = Omit<typeof light, 'scheme'> & { scheme: 'light' | 'dark' };

const dark: Theme = {
  scheme: 'dark',
  background: '#1B1916',
  paper: '#211E1A',
  surface: '#29251F',
  surfaceAlt: '#312C25',
  surfacePressed: '#3A342C',
  ink: '#F1EADF',
  inkSoft: '#BDB3A5',
  inkFaint: '#827869',
  line: '#3B352D',
  accent: '#DB7766',
  accentSoft: '#45291F',
  accentInk: '#1B1916',
  blue: '#86ADCB',
  blueSoft: '#24323C',
  green: '#7DB8A5',
  greenSoft: '#203430',
  gold: '#E2B35A',
  goldSoft: '#3A2F1C',
  plum: '#B597C2',
  plumSoft: '#332838',
  success: '#7CC08B',
  successSoft: '#1F3324',
  error: '#E58C75',
  errorSoft: '#3D231C',
  highlight: '#5B4A1F',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const themes = { light, dark };

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  read: 'Literata_400Regular',
  readMedium: 'Literata_500Medium',
  readItalic: 'Literata_400Regular_Italic',
  ui: 'NunitoSans_400Regular',
  uiSemi: 'NunitoSans_600SemiBold',
  uiBold: 'NunitoSans_700Bold',
  uiHeavy: 'NunitoSans_800ExtraBold',
};

/** Soft, warm card shadow. */
export function cardShadow(theme: Theme, strength = 1) {
  if (theme.scheme === 'dark') return {};
  return Platform.select({
    ios: {
      shadowColor: theme.shadow,
      shadowOpacity: 0.08 * strength,
      shadowRadius: 14 * strength,
      shadowOffset: { width: 0, height: 6 * strength },
    },
    default: { elevation: 2 * strength },
  });
}

/** Reader text sizes (user preference). */
export const readerSizes = {
  S: { font: 17, line: 28 },
  M: { font: 19, line: 31 },
  L: { font: 21, line: 34 },
  XL: { font: 24, line: 38 },
} as const;
export type ReaderSize = keyof typeof readerSizes;

/**
 * Categorical colours for the four learning states (new → mastered), in fixed order.
 * Validated for lightness band, chroma, colour-blind separation and contrast
 * (light and dark surfaces) with the dataviz palette validator.
 */
export const learningStateColors = {
  light: { new: '#2F6DA8', learning: '#B7791F', reviewing: '#8A4FA3', mastered: '#2E8550' },
  dark: { new: '#4A8BC7', learning: '#B9851F', reviewing: '#A877C4', mastered: '#4FA86A' },
} as const;
